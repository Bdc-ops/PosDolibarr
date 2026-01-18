// API Tiers/Clients - CRUD complet
import { dolibarrClient } from "./dolibarr.client"
import type { ThirdParty, ApiResponse } from "../types/dolibarr.types"
import type { ThirdPartyMode } from "../utils/dolibarrMode"
import { isValidDolibarrFilter } from "../utils/dolibarrFilters"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { demoThirdParties, demoCustomerCategories, filterDemoData } from "../utils/demoData"
import { buildSortParams } from "../utils/dolibarrSort"

let thirdpartiesUnavailable = false

async function isDemoMode(): Promise<boolean> {
  const demoMode = await AsyncStorage.getItem("demo_mode")
  return demoMode === "true"
}

export const ThirdPartiesAPI = {
  // Récupérer tous les tiers
  async getAll(params?: {
    sortfield?: string
    sortorder?: "ASC" | "DESC"
    limit?: number
    page?: number
    mode?: ThirdPartyMode
    sqlfilters?: string
  }): Promise<ThirdParty[]> {
    if (await isDemoMode()) {
      let filtered = filterDemoData(demoThirdParties, params)
      if (params?.mode === "customer") {
        filtered = filtered.filter((t) => t.client === "1" || t.client === 1)
      }
      return filtered
    }
    if (thirdpartiesUnavailable) {
      return []
    }
    // Préparer les paramètres pour l'API
    const apiParams: any = {
      sortfield: params?.sortfield,
      sortorder: params?.sortorder,
      limit: params?.limit || 100,
      page: params?.page,
    }

    // Utiliser uniquement les filtres explicitement fournis (pas de filtre auto côté API)
    if (params?.sqlfilters) {
      if (!isValidDolibarrFilter(params.sqlfilters)) {
        console.warn(
          `⚠️ Filtre Dolibarr invalide détecté: "${params.sqlfilters}". Format attendu: (field:operator:value). Le filtre sera ignoré.`,
        )
      } else {
        apiParams.sqlfilters = params.sqlfilters
      }
    }

    // Logger les paramètres envoyés pour debug
    console.log("📤 Appel API /thirdparties avec params:", JSON.stringify(apiParams))

    try {
      const result = await dolibarrClient.get<ThirdParty[]>("/thirdparties", apiParams)
      if (!params?.mode) {
        return result
      }
      if (params.mode === "customer") {
        return result.filter((t: any) => t.client === "1" || t.client === 1 || t.client === "3" || t.client === 3)
      }
      if (params.mode === "supplier") {
        return result.filter((t: any) => t.fournisseur === "1" || t.fournisseur === 1 || t.fournisseur === "3" || t.fournisseur === 3)
      }
      return result
    } catch (error: any) {
      const status = error.response?.status
      const errorMessage = error.response?.data?.error?.message || error.message || ""
      
      // Si erreur 404, éviter les retries en boucle
      if (status === 404) {
        thirdpartiesUnavailable = true
        console.warn(
          `⚠️ GET /thirdparties renvoie 404: ${errorMessage}. Lecture désactivée pour cette session.`,
        )
        return []
      }
      
      throw error
    }
  },

  // Récupérer un tiers par ID
  async getById(id: string): Promise<ThirdParty> {
    if (await isDemoMode()) {
      const thirdParty = demoThirdParties.find((t) => t.id === id)
      if (!thirdParty) throw new Error("Tiers non trouvé")
      return thirdParty
    }
    return dolibarrClient.get<ThirdParty>(`/thirdparties/${id}`)
  },

  // Rechercher des tiers
  async search(query: string): Promise<ThirdParty[]> {
    // Syntaxe Dolibarr correcte pour la recherche
    // Format: (field:like:'%text%')
    const sortParams = buildSortParams("thirdparties", "DESC", "date")
    const sqlfilters = `(nom:like:'%${query}%') OR (email:like:'%${query}%')`
    return this.getAll({ sqlfilters, limit: 50, page: 0, ...sortParams })
  },

  // Récupérer les catégories d'un tiers
  async getCategories(thirdpartyId: string | number): Promise<any[]> {
    if (await isDemoMode()) {
      // Assigner des catégories selon l'ID du client
      const categoryMap: Record<string, string[]> = {
        "1": ["11"], // Entreprise
        "2": ["11"], // Entreprise
        "3": ["10"], // Particulier
        "4": ["12"], // Revendeur
      }
      const categoryIds = categoryMap[String(thirdpartyId)] || []
      return categoryIds.map((id) => ({
        id,
        label: demoCustomerCategories.find((c) => c.id === id)?.label || "",
      }))
    }
    try {
      const response = await dolibarrClient.get<any[]>(`/thirdparties/${thirdpartyId}/categories`)
      return Array.isArray(response) ? response : []
    } catch (error: any) {
      const status = error?.response?.status
      // 404 = aucune catégorie pour ce client (cas normal)
      if (status === 404) return []
      // 503 ou autres erreurs: log léger et retourner vide
      console.warn(`⚠️ Erreur catégories client ${thirdpartyId}:`, error?.message)
      return []
    }
  },

  // Créer un nouveau tiers
  async create(thirdParty: Partial<ThirdParty>): Promise<ApiResponse<{ id: string }>> {
    try {
      console.log("📤 Requête POST /thirdparties:", JSON.stringify(thirdParty))
      const id = await dolibarrClient.post<string>("/thirdparties", thirdParty)
      return { success: true, data: { id } }
    } catch (error: any) {
      console.warn("❌ Erreur POST /thirdparties:", error?.message || error)
      return { success: false, error: error.message }
    }
  },

  // Mettre à jour un tiers
  async update(id: string, thirdParty: Partial<ThirdParty>): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.put(`/thirdparties/${id}`, thirdParty)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Supprimer un tiers
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.delete(`/thirdparties/${id}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Récupérer les commandes d'un tiers
  async getOrders(thirdPartyId: string): Promise<any[]> {
    return dolibarrClient.get(`/thirdparties/${thirdPartyId}/orders`)
  },

  // Récupérer les factures d'un tiers
  async getInvoices(thirdPartyId: string): Promise<any[]> {
    return dolibarrClient.get(`/thirdparties/${thirdPartyId}/invoices`)
  },
}
