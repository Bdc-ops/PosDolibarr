// API Produits - Fonctions CRUD complètes
import { dolibarrClient } from "./dolibarr.client"
import type { Product, Stock, ApiResponse } from "../types/dolibarr.types"

export const ProductsAPI = {
  // Récupérer tous les produits
  async getAll(params?: {
    sortfield?: string
    sortorder?: "ASC" | "DESC"
    limit?: number
    page?: number
    category?: string
    sqlfilters?: string
  }): Promise<Product[]> {
    return dolibarrClient.get<Product[]>("/products", params)
  },

  // Récupérer le nombre total réel de produits depuis l'API Dolibarr
  // Utilise les headers de réponse (X-Total-Count) ou une estimation via pagination
  async getTotal(): Promise<number> {
    try {
      // Essayer d'obtenir le total depuis les headers HTTP (X-Total-Count est un standard REST)
      // Note: dolibarrClient.get ne retourne pas directement les headers
      // On va donc utiliser une approche de pagination pour estimer le total
      
      // Stratégie : faire une requête avec limit=1 pour voir s'il y a des produits
      // Puis une requête avec limit=5000 pour obtenir le maximum possible
      // Si on obtient 5000 résultats, il y a probablement plus (on retourne 5001 pour indiquer "5000+")
      
      const firstPage = await dolibarrClient.get<Product[]>("/products", { limit: 1, page: 0 })
      
      if (!Array.isArray(firstPage)) {
        return 0
      }
      
      if (firstPage.length === 0) {
        return 0
      }
      
      // Faire une requête avec limit=5000 pour obtenir le maximum chargé
      const maxPage = await dolibarrClient.get<Product[]>("/products", { limit: 5000, page: 0 })
      
      if (!Array.isArray(maxPage)) {
        return firstPage.length
      }
      
      // Si on a exactement 5000 résultats, il y a probablement plus
      // On retourne 5001 pour indiquer "5000+" dans l'affichage
      if (maxPage.length === 5000) {
        return 5001 // Indique "5000+" dans l'affichage
      }
      
      // Sinon, c'est le total réel
      return maxPage.length
    } catch (error: any) {
      console.warn("⚠️ Erreur lors de la récupération du total produits:", error.message)
      
      // En cas d'erreur (timeout, 503, etc.), essayer de récupérer depuis le cache
      try {
        const cached = await dolibarrClient.get<Product[]>("/products", { limit: 5000, page: 0 })
        if (Array.isArray(cached)) {
          // Si on a un cache avec 5000 éléments, c'est probablement le maximum chargé
          return cached.length === 5000 ? 5001 : cached.length
        }
      } catch (cacheError) {
        // Ignorer l'erreur de cache
      }
      
      // En cas d'erreur totale, retourner 0 pour ne pas bloquer l'app
      return 0
    }
  },

  // Récupérer un produit par ID
  async getById(id: string): Promise<Product> {
    return dolibarrClient.get<Product>(`/products/${id}`)
  },

  // Rechercher des produits
  async search(query: string): Promise<Product[]> {
    const sqlfilters = `(t.ref:like:'%${query}%') OR (t.label:like:'%${query}%')`
    return this.getAll({ sqlfilters })
  },

  // Créer un nouveau produit
  async create(product: Partial<Product>): Promise<ApiResponse<{ id: string }>> {
    try {
      const id = await dolibarrClient.post<string>("/products", product)
      return { success: true, data: { id } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Mettre à jour un produit
  async update(id: string, product: Partial<Product>): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.put(`/products/${id}`, product)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Supprimer un produit
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.delete(`/products/${id}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Récupérer le stock d'un produit
  async getStock(productId: string): Promise<Stock[]> {
    return dolibarrClient.get<Stock[]>(`/products/${productId}/stock`)
  },

  // Mettre à jour le stock
  async updateStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    type: "in" | "out",
    label: string,
  ): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/products/${productId}/stock`, {
        warehouse_id: warehouseId,
        qty: type === "in" ? quantity : -quantity,
        label,
        type: type === "in" ? 3 : 1, // 3=entrée, 1=sortie
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Récupérer les catégories d'un produit
  async getCategories(productId: string | number): Promise<any[]> {
    try {
      // Appel simple sans paramètres de tri (comme demandé)
      const response = await dolibarrClient.get<any[]>(`/products/${productId}/categories`)
      
      // L'intercepteur peut retourner { data: [], is404: true } pour les 404
      const categories = (response as any)?.data !== undefined ? (response as any).data : response
      
      const categoriesArray = Array.isArray(categories) ? categories : []
      return categoriesArray
    } catch (error: any) {
      // Gestion robuste des erreurs pour éviter de bloquer l'app
      const status = error?.response?.status
      
      // Erreur 404 = produit sans catégories (normal, ne pas logger comme erreur)
      if (status === 404) {
        // Produit sans catégories - c'est normal, retourner tableau vide
        return []
      }
      
      // Erreur 503 = problème serveur Dolibarr
      if (status === 503) {
        console.warn(`⚠️ Erreur 503 pour les catégories du produit ${productId} - Ignoré pour ne pas bloquer l'app`)
        return []
      }
      
      // Pour les autres erreurs, logger et retourner vide
      console.warn(`⚠️ Erreur lors de la récupération des catégories pour le produit ${productId}:`, error.message)
      return []
    }
  },
}
