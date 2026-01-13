// Client API Dolibarr de base avec support offline
import axios, { type AxiosInstance, AxiosError } from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { DolibarrConfig } from "../types/dolibarr.types"
import { OfflineManager } from "../utils/offline"
import { normalizeApiUrl } from "../utils/normalizeApiUrl"
import { isSqlError, is503UnknownColumnError } from "../utils/dolibarrSort"
import { setDegradedMode } from "../utils/degradedMode"

// Whitelist des champs de tri autorisés par endpoint Dolibarr
const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
  "/invoices": ["datef", "datec", "date_creation", "ref", "total_ttc", "total_ht", "t.datef", "t.datec"],
  "/orders": ["date_commande", "date_creation", "t.date_commande", "t.date_creation", "ref", "total_ttc"],
  "/products": ["ref", "label", "price", "t.ref", "t.label", "t.price"],
  "/thirdparties": ["nom", "ref", "code_client", "datec", "t.nom", "t.ref"],
  // Endpoints de catégories produits
  "/products/categories": ["s.rowid", "s.label", "s.fk_parent", "rowid", "label"],
  // Endpoints de catégories générales (sans préfixe t.)
  "/categories": ["rowid", "label", "fk_parent", "type"],
}

// Fallback par défaut pour chaque endpoint
const DEFAULT_SORT_FIELD: Record<string, string> = {
  "/invoices": "datef",
  "/orders": "date_commande",
  "/products": "ref",
  "/thirdparties": "nom",
  "/categories": "rowid",
}

class DolibarrClient {
  private client: AxiosInstance
  private config: DolibarrConfig
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private requestTimestamps: Map<string, number> = new Map()
  private readonly REQUEST_DEBOUNCE_MS = 500 // Empêcher les appels en boucle

  constructor() {
    this.config = {
      apiUrl: process.env.DOLIBARR_API_URL || "",
      apiKey: process.env.DOLIBARR_API_KEY || "",
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        DOLAPIKEY: this.config.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 secondes
    })

    // Intercepteur pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => {
        // Sauvegarder en cache si la requête est réussie
        const cacheKey = this.getCacheKey(response.config.url || "", response.config.params)
        if (response.config.method === "get" && cacheKey) {
          OfflineManager.setCache(cacheKey, response.data).catch(console.error)
        }
        return response
      },
      async (error: AxiosError) => {
        const endpoint = error.config?.url || "unknown"
        const params = error.config?.params || {}
        const status = error.response?.status
        const errorData = error.response?.data || error.message
        const method = error.config?.method?.toUpperCase() || "GET"

        // Gestion spécifique des timeouts
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
          console.error("⏱️ Timeout API Dolibarr:", {
            endpoint,
            timeout: "30000ms",
            params: JSON.stringify(params),
          })
          
          // Pour les GET, essayer le cache
          if (error.config?.method === "get") {
            const cacheKey = this.getCacheKey(endpoint, params)
            const cached = await OfflineManager.getCache(cacheKey)
            if (cached) {
              console.log("✅ Timeout: Utilisation du cache pour:", endpoint)
              return { data: cached, fromCache: true, timeout: true }
            }
          }
          
          return Promise.reject({
            ...error,
            isTimeout: true,
            message: "Timeout: La requête a pris plus de 30 secondes",
          })
        }

        // Ne pas logger les erreurs 404 pour /products/{id}/categories (produit sans catégories = normal)
        const isCategories404 = endpoint.includes("/products/") && endpoint.includes("/categories") && status === 404
        
        if (!isCategories404) {
          // Logger l'erreur avec tous les détails (sauf 404 catégories)
          console.error("❌ Dolibarr API Error:", {
            endpoint,
            params: JSON.stringify(params),
            status,
            error: errorData,
            method,
          })
        }

        // PROTECTION GLOBALE : Erreur 404 pour /products/{id}/categories (produit sans catégories = normal)
        // Retourner un tableau vide directement sans rejeter
        if (status === 404 && endpoint.includes("/products/") && endpoint.includes("/categories")) {
          // Produit sans catégories - retourner tableau vide (pas une erreur)
          return { data: [], fromCache: false, is404: true }
        }

        // PROTECTION GLOBALE : Erreur 400 Bad Request (syntaxe sqlfilters invalide)
        // Essayer sans filtre si erreur 400 et sqlfilters présent
        if (status === 400) {
          const eData: any = errorData as any
          const errorMessage = String(
            eData?.error?.message ||
            eData?.message ||
            (error as any).message ||
            "",
          )
          
          if (errorMessage.includes("Bad syntax") || errorMessage.includes("search string")) {
            console.warn(
              "⚠️ Erreur 400: Syntaxe sqlfilters invalide. Tentative sans filtre...",
            )
            // Retirer sqlfilters et réessayer pour les GET
            if (error.config?.method === "get" && error.config?.params?.sqlfilters) {
              const retryParams = { ...error.config.params }
              delete retryParams.sqlfilters
              try {
                const retryResponse = await this.client.get(error.config.url || "", {
                  params: retryParams,
                })
                console.log("✅ Retry sans sqlfilters réussi")
                return retryResponse
              } catch (retryError) {
                // Si le retry échoue aussi, essayer le cache
                const cacheKey = this.getCacheKey(endpoint, retryParams)
                const cached = await OfflineManager.getCache(cacheKey)
                if (cached) {
                  console.log("✅ Erreur 400: Utilisation du cache pour:", endpoint)
                  return { data: cached, fromCache: true, error400: true }
                }
                console.error("❌ Retry sans sqlfilters a échoué")
              }
            }
          }
          
          // Pour toute erreur 400, essayer le cache si disponible
          if (error.config?.method === "get") {
            const cacheKey = this.getCacheKey(endpoint, params)
            const cached = await OfflineManager.getCache(cacheKey)
            if (cached) {
              console.log("✅ Erreur 400: Utilisation du cache pour:", endpoint)
              return { data: cached, fromCache: true, error400: true }
            }
          }
          
          return Promise.reject({
            ...error,
            is400Error: true,
            message: `Erreur 400: ${errorMessage || "Requête invalide"}`,
          })
        }

        // PROTECTION GLOBALE : Erreur 500/503 (Dolibarr - souvent erreur SQL)
        if (status === 500 || status === 503) {
          const eData: any = errorData as any
          const errorMessage = String(
            eData?.error?.message ||
            eData?.message ||
            (error as any).message ||
            "",
          )
          
          // Erreur 500/503 avec "Unknown column" - mode dégradé
          if (status === 500 && /Unknown column/i.test(errorMessage)) {
            console.error(
              "🚨 Erreur SQL 500 détectée - Activation du mode dégradé et basculement sur le cache",
            )

            // Activer le mode dégradé
            await setDegradedMode(
              `Erreur SQL 500: ${errorMessage}`,
            ).catch(console.error)

            // Pour les requêtes GET, essayer immédiatement le cache
            if (error.config?.method === "get") {
              const cacheKey = this.getCacheKey(endpoint, params)
              const cached = await OfflineManager.getCache(cacheKey)
              if (cached) {
                console.log(
                  "✅ Mode dégradé: Utilisation du cache offline pour:",
                  endpoint,
                )
                return {
                  data: cached,
                  fromCache: true,
                  degradedMode: true,
                }
              }
            }

            // Rejeter avec un flag spécial pour le mode dégradé
            return Promise.reject({
              ...error,
              isSqlError: true,
              is503UnknownColumn: true,
              degradedMode: true,
              message: "Erreur SQL détectée. Mode dégradé activé - Données du cache local.",
            })
          }
          
          // Erreur 503 avec "Unknown column" - mode dégradé
          if (is503UnknownColumnError(error)) {
            console.error(
              "🚨 Erreur SQL 503 détectée - Activation du mode dégradé et basculement sur le cache",
            )

            // Activer le mode dégradé
            await setDegradedMode(
              `Erreur SQL 503: ${errorMessage}`,
            ).catch(console.error)

            // Pour les requêtes GET, essayer immédiatement le cache
            if (error.config?.method === "get") {
              const cacheKey = this.getCacheKey(endpoint, params)
              const cached = await OfflineManager.getCache(cacheKey)
              if (cached) {
                console.log(
                  "✅ Mode dégradé: Utilisation du cache offline pour:",
                  endpoint,
                )
                return {
                  data: cached,
                  fromCache: true,
                  degradedMode: true,
                }
              }
            }

            // Rejeter avec un flag spécial pour le mode dégradé
            return Promise.reject({
              ...error,
              isSqlError: true,
              is503UnknownColumn: true,
              degradedMode: true,
              message: "Erreur SQL détectée. Mode dégradé activé - Données du cache local.",
            })
          }
          
          // Autre erreur 503 - essayer le cache
          if (error.config?.method === "get") {
            const cacheKey = this.getCacheKey(endpoint, params)
            const cached = await OfflineManager.getCache(cacheKey)
            if (cached) {
              console.log("✅ Erreur 503: Utilisation du cache pour:", endpoint)
              return { data: cached, fromCache: true, error503: true }
            }
          }
          
          // Pour toute erreur 500/503, essayer le cache si disponible
          if (error.config?.method === "get") {
            const cacheKey = this.getCacheKey(endpoint, params)
            const cached = await OfflineManager.getCache(cacheKey)
            if (cached) {
              console.log(`✅ Erreur ${status}: Utilisation du cache pour:`, endpoint)
              return { data: cached, fromCache: true, error500: status === 500, error503: status === 503 }
            }
            
            // Si erreur 500 sur /invoices, essayer avec des paramètres réduits progressivement
            if (status === 500 && endpoint === "/invoices") {
              console.warn("⚠️ Erreur 500 sur /invoices, tentative avec paramètres réduits")
              
              // Essayer progressivement avec des limites de plus en plus petites
              const limitsToTry = [50, 25, 10]
              
              for (const limit of limitsToTry) {
                const reducedParams: any = { limit }
                if (params?.thirdparty_ids) {
                  reducedParams.thirdparty_ids = params.thirdparty_ids
                }
                
                // Utiliser axios directement pour éviter les intercepteurs
                try {
                  const retryResponse = await axios.get(
                    `${this.config.apiUrl}${endpoint}`,
                    {
                      params: reducedParams,
                      headers: {
                        DOLAPIKEY: this.config.apiKey,
                        "Content-Type": "application/json",
                      },
                      timeout: 30000,
                    }
                  )
                  console.log(`✅ Retry avec limit=${limit} réussi pour /invoices`)
                  // Mettre en cache la réponse réussie
                  const cacheKeyReduced = this.getCacheKey(endpoint, reducedParams)
                  await OfflineManager.setCache(cacheKeyReduced, retryResponse.data, 3600000)
                  return retryResponse.data
                } catch (retryError: any) {
                  console.warn(`⚠️ Retry avec limit=${limit} a échoué, essai suivant...`)
                  // Continuer avec la limite suivante
                }
              }
              
              // Si tous les retries ont échoué, essayer le cache
              console.warn("⚠️ Tous les retries ont échoué, utilisation du cache si disponible")
              // Essayer le cache avec différents paramètres
              const cacheParamsToTry: any[] = [
                { limit: 50 },
                { limit: 25 },
                { limit: 100 },
                { limit: 10 },
              ]
              
              for (const cacheParams of cacheParamsToTry) {
                if (params?.thirdparty_ids) {
                  cacheParams.thirdparty_ids = params.thirdparty_ids
                }
                const cacheKey = this.getCacheKey(endpoint, cacheParams)
                const cached = await OfflineManager.getCache(cacheKey)
                if (cached) {
                  console.log(`✅ Cache trouvé pour /invoices avec limit=${cacheParams.limit}`)
                  return { data: cached, fromCache: true, error500: true }
                }
              }
              
              // Dernier recours : essayer avec les paramètres minimaux
              const minimalParams: any = {}
              if (params?.thirdparty_ids) {
                minimalParams.thirdparty_ids = params.thirdparty_ids
              }
              const cacheKeyMinimal = this.getCacheKey(endpoint, minimalParams)
              const cachedMinimal = await OfflineManager.getCache(cacheKeyMinimal)
              if (cachedMinimal) {
                return { data: cachedMinimal, fromCache: true, error500: true }
              }
            }
          }
          
          return Promise.reject({
            ...error,
            is500Error: status === 500,
            is503Error: status === 503,
            message: `Erreur ${status}: ${errorMessage || "Service temporairement indisponible"}`,
          })
        }

        // Détecter les autres erreurs SQL (503 sans "Unknown column" ou autres patterns)
        if (isSqlError(error)) {
          console.error(
            "⚠️ Erreur SQL détectée - Vérifiez les paramètres de tri (sortfield)",
          )
          // Ne pas retry automatiquement pour les erreurs SQL
          return Promise.reject({
            ...error,
            isSqlError: true,
            message: `Erreur SQL: ${errorData || error.message}. Vérifiez les paramètres de tri.`,
          })
        }

        // En cas d'erreur réseau, essayer de récupérer du cache pour les GET
        if (error.code === "NETWORK_ERROR" || !error.response) {
          const cacheKey = this.getCacheKey(endpoint, params)
          if (error.config?.method === "get" && cacheKey) {
            const cached = await OfflineManager.getCache(cacheKey)
            if (cached) {
              console.log("✅ Utilisation du cache offline pour:", endpoint)
              return { data: cached, fromCache: true }
            }
          }
        }

        return Promise.reject(error)
      },
    )
  }

  /**
   * Nettoie et valide un champ de tri pour un endpoint donné
   * Garantit qu'un champ valide est toujours retourné (jamais de champ invalide envoyé à l'API)
   * 
   * @param endpoint - Endpoint API (ex: "/thirdparties")
   * @param requestedField - Champ demandé (ex: "name")
   * @returns Champ valide pour l'endpoint (ex: "nom")
   */
  sanitizeSortField(endpoint: string, requestedField?: string): string {
    if (!requestedField) {
      // Vérifier si c'est un endpoint de catégories produits
      if (endpoint.includes("/products/") && endpoint.includes("/categories")) {
        return "s.rowid"
      }
      // Vérifier si c'est l'endpoint /categories
      if (endpoint === "/categories" || endpoint.includes("/categories")) {
        return DEFAULT_SORT_FIELD["/categories"] || "rowid"
      }
      return DEFAULT_SORT_FIELD[endpoint] || "id"
    }

    // Vérifier si c'est un endpoint de catégories produits
    if (endpoint.includes("/products/") && endpoint.includes("/categories")) {
      const allowedFields = ALLOWED_SORT_FIELDS["/products/categories"] || ["s.rowid"]
      if (allowedFields.includes(requestedField)) {
        return requestedField
      }
      // Pour les catégories, toujours utiliser s.rowid par défaut
      return "s.rowid"
    }

    // Vérifier si c'est l'endpoint /categories
    if (endpoint === "/categories" || endpoint.includes("/categories")) {
      const allowedFields = ALLOWED_SORT_FIELDS["/categories"] || ["rowid"]
      if (allowedFields.includes(requestedField)) {
        return requestedField
      }
      // Pour /categories, utiliser rowid par défaut
      return DEFAULT_SORT_FIELD["/categories"] || "rowid"
    }

    const allowedFields = ALLOWED_SORT_FIELDS[endpoint] || []
    const defaultField = DEFAULT_SORT_FIELD[endpoint] || "id"

    // Si le champ demandé est dans la whitelist, l'utiliser
    if (allowedFields.includes(requestedField)) {
      return requestedField
    }

    // Sinon, utiliser le fallback et logger un warning
    console.warn(
      `⚠️ [sanitizeSortField] Champ de tri invalide "${requestedField}" pour ${endpoint}. Utilisation du fallback "${defaultField}"`,
    )
    return defaultField
  }

  // Valider et corriger les paramètres de tri avant l'envoi
  private validateAndFixSortParams(endpoint: string, params?: any): any {
    if (!params) {
      return params
    }

    // Pour les endpoints de catégories produits, ne pas modifier sortfield
    if (endpoint.includes("/products/") && endpoint.includes("/categories")) {
      // Retourner les paramètres tels quels pour les catégories (s.rowid est correct)
      return params
    }

    // Pour l'endpoint /categories, utiliser sanitizeSortField
    if (endpoint === "/categories" || (endpoint.includes("/categories") && !endpoint.includes("/products/"))) {
      if (params.sortfield) {
        const sanitizedField = this.sanitizeSortField(endpoint, params.sortfield)
        return {
          ...params,
          sortfield: sanitizedField,
        }
      }
      return params
    }

    // Pour /invoices, appliquer des restrictions spécifiques Dolibarr
    if (endpoint === "/invoices") {
      const fixedParams: any = { ...params }
      
      // Ne jamais envoyer de sortfield pour /invoices (erreur 500 connue)
      delete fixedParams.sortfield
      delete fixedParams.sortorder
      
      // Limiter la taille de la requête : Dolibarr a souvent des problèmes avec limit > 100
      if (fixedParams.limit && fixedParams.limit > 100) {
        console.warn(`⚠️ Limite réduite de ${fixedParams.limit} à 100 pour /invoices (limite Dolibarr)`)
        fixedParams.limit = 100
      }
      
      // Si pas de limit spécifié, utiliser 100 par défaut pour /invoices
      if (!fixedParams.limit) {
        fixedParams.limit = 100
      }
      
      // Ne pas utiliser la pagination si elle cause des problèmes
      // Dolibarr peut avoir des problèmes avec page > 0 sur /invoices
      if (fixedParams.page && fixedParams.page > 0) {
        console.warn(`⚠️ Pagination désactivée pour /invoices (page: ${fixedParams.page})`)
        delete fixedParams.page
      }
      
      return fixedParams
    }

    // Pour tous les autres endpoints, utiliser sanitizeSortField
    if (params.sortfield) {
      const sanitizedField = this.sanitizeSortField(endpoint, params.sortfield)
      return {
        ...params,
        sortfield: sanitizedField,
      }
    }

    return params
  }

  // Générer une clé de cache à partir de l'endpoint et des paramètres
  private getCacheKey(endpoint: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : ""
    return `${endpoint}_${paramStr}`
  }

  // Configuration dynamique (pour permettre à l'utilisateur de changer les paramètres)
  async setConfig(apiUrl: string, apiKey: string) {
    // Normaliser l'URL (ajouter /api/index.php si absent)
    const normalizedUrl = normalizeApiUrl(apiUrl)
    
    this.config = { apiUrl: normalizedUrl, apiKey }
    this.client.defaults.baseURL = normalizedUrl
    this.client.defaults.headers["DOLAPIKEY"] = apiKey

    // Sauvegarder l'URL normalisée dans le storage
    await AsyncStorage.setItem("dolibarr_config", JSON.stringify(this.config))
  }

  async loadConfig() {
    try {
    const stored = await AsyncStorage.getItem("dolibarr_config")
    if (stored) {
        try {
      const config = JSON.parse(stored)
          // Vérifier que la config est valide avant de l'utiliser
          if (config && typeof config === "object" && config.apiUrl && config.apiKey) {
            // Normaliser l'URL lors du chargement (au cas où une ancienne config n'aurait pas été normalisée)
      await this.setConfig(config.apiUrl, config.apiKey)
          } else {
            console.warn("⚠️ Configuration invalide dans AsyncStorage")
          }
        } catch (parseError) {
          console.error("❌ Erreur lors du parsing de la config:", parseError)
          // Nettoyer la config invalide
          await AsyncStorage.removeItem("dolibarr_config").catch(() => {})
        }
      }
    } catch (error) {
      // Ne pas crasher si AsyncStorage échoue
      console.error("❌ Erreur lors du chargement de la config:", error)
    }
  }

  // Vérifier la connectivité
  async isOnline(): Promise<boolean> {
    return await OfflineManager.isOnline()
  }

  // Méthodes génériques avec support offline et protection contre les appels en boucle
  // Méthode interne pour obtenir la réponse complète avec headers (pour récupérer le total)
  private async getWithHeaders<T>(endpoint: string, params?: any): Promise<{ data: T; headers: any }> {
    const validatedParams = this.validateAndFixSortParams(endpoint, params)
    const response = await this.client.get(endpoint, { params: validatedParams })
    return {
      data: response.data,
      headers: response.headers || {},
    }
  }

  async get<T>(endpoint: string, params?: any, useCache = true): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params)
    const requestKey = `${endpoint}_${JSON.stringify(params || {})}`
    const now = Date.now()
    
    // Vérifier si une requête identique est déjà en cours
    if (this.pendingRequests.has(requestKey)) {
      console.log("⏳ Requête en cours, réutilisation de la promesse:", endpoint)
      return this.pendingRequests.get(requestKey)!
    }
    
    // Vérifier le debounce pour éviter les appels en boucle
    const lastRequestTime = this.requestTimestamps.get(requestKey) || 0
    if (now - lastRequestTime < this.REQUEST_DEBOUNCE_MS) {
      // Attendre un peu avant de continuer plutôt que d'utiliser le cache
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DEBOUNCE_MS - (now - lastRequestTime)))
    }

    // Si on est offline, tenter le cache avant l'API
    if (useCache && !(await this.isOnline())) {
      const cached = await OfflineManager.getCache<T>(cacheKey)
      if (cached) {
        console.log("✅ Offline: utilisation du cache pour:", endpoint)
        return cached
      }
    }
    
    // Créer la promesse de requête
    const requestPromise = (async () => {
      try {
        this.requestTimestamps.set(requestKey, Date.now())
        
        // Valider et corriger les paramètres de tri avant l'envoi
        const validatedParams = this.validateAndFixSortParams(endpoint, params)
        
        // Pour /invoices, vérifier le cache AVANT d'appeler l'API si on est offline
        if (endpoint === "/invoices" && useCache && !(await this.isOnline())) {
          const cacheKeyValidated = this.getCacheKey(endpoint, validatedParams)
          const cachedBeforeRequest = await OfflineManager.getCache(cacheKeyValidated)
          if (cachedBeforeRequest) {
            console.log("✅ Cache hit pour /invoices (avant requête API)")
            return cachedBeforeRequest
          }
        }
        
        const response = await this.client.get(endpoint, { params: validatedParams }) as any
        
        // Si la réponse vient du cache en mode dégradé, retourner directement
        if (response?.fromCache && response?.degradedMode) {
          return response.data
        }
        
        return response.data
      } catch (error: any) {
        // Si erreur 503 avec Unknown column, le cache a déjà été tenté dans l'intercepteur
        if (error.is503UnknownColumn && error.degradedMode) {
          // Le cache a été tenté mais n'existe pas, rejeter l'erreur
          throw error
        }

        // Si erreur réseau/timeout/400/500/503 et cache activé, essayer de récupérer du cache
        if (useCache && (
          error.code === "NETWORK_ERROR" || 
          !error.response || 
          error.isTimeout ||
          error.is400Error ||
          error.is500Error ||
          error.is503Error
        )) {
          const cached = await OfflineManager.getCache<T>(cacheKey)
          if (cached) {
            console.log("✅ Utilisation du cache offline pour:", endpoint)
            return cached
          }
        }
        throw error
      } finally {
        // Nettoyer la requête en cours après un délai
        setTimeout(() => {
          this.pendingRequests.delete(requestKey)
        }, 1000)
      }
    })()
    
    // Stocker la promesse pour éviter les doublons
    this.pendingRequests.set(requestKey, requestPromise)
    
    return requestPromise
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post(endpoint, data)
    return response.data
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.put(endpoint, data)
    return response.data
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint)
    return response.data
  }

  // Nettoyer le cache (expiré seulement)
  async cleanExpiredCache(): Promise<void> {
    await OfflineManager.cleanExpiredCache()
  }

  // Vider complètement le cache
  async clearCache(): Promise<void> {
    await OfflineManager.clearAllCache()
  }
}

export const dolibarrClient = new DolibarrClient()
