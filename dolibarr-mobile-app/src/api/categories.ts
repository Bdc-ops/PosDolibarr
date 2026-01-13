// API Catégories - Chargement en amont de toutes les catégories
import { dolibarrClient } from "./dolibarr.client"

export interface Category {
  id: string
  label: string
  description?: string
  color?: string
  type?: string
  [key: string]: any
}

export const CategoriesAPI = {
  // Récupérer toutes les catégories de produits
  async getProductCategories(): Promise<Category[]> {
    try {
      const data = await dolibarrClient.get<Category[]>("/categories", {
        sortfield: "rowid",
        sortorder: "ASC",
        limit: 100,
        type: "product",
      })
      return Array.isArray(data) ? data : []
    } catch (err: any) {
      console.warn("⚠️ [CategoriesAPI] Erreur chargement catégories produits:", err.message)
      return []
    }
  },

  // Récupérer toutes les catégories de clients (tags)
  async getCustomerCategories(): Promise<Category[]> {
    try {
      const data = await dolibarrClient.get<Category[]>("/categories", {
        sortfield: "rowid",
        sortorder: "ASC",
        limit: 100,
        type: "customer",
      })
      return Array.isArray(data) ? data : []
    } catch (err: any) {
      console.warn("⚠️ [CategoriesAPI] Erreur chargement catégories clients:", err.message)
      return []
    }
  },

  // Récupérer les catégories d'un produit spécifique (via la relation produit-catégorie)
  async getProductCategoriesById(productId: string): Promise<Category[]> {
    try {
      const data = await dolibarrClient.get<Category[]>(`/products/${productId}/categories`, {})
      return Array.isArray(data) ? data : []
    } catch (err: any) {
      // 404 est normal si le produit n'a pas de catégories
      if (err?.response?.status === 404) {
        return []
      }
      console.warn(`⚠️ [CategoriesAPI] Erreur catégories produit ${productId}:`, err.message)
      return []
    }
  },
}

