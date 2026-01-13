// API Commandes - Génération et gestion des commandes
import { dolibarrClient } from "./dolibarr.client"
import type { Order, ApiResponse } from "../types/dolibarr.types"

export const OrdersAPI = {
  // Récupérer toutes les commandes
  async getAll(params?: {
    sortfield?: string
    sortorder?: "ASC" | "DESC"
    limit?: number
    page?: number
    thirdparty_ids?: string
    sqlfilters?: string
  }): Promise<Order[]> {
    return dolibarrClient.get<Order[]>("/orders", params)
  },

  // Récupérer une commande par ID
  async getById(id: string): Promise<Order> {
    return dolibarrClient.get<Order>(`/orders/${id}`)
  },

  // Créer une nouvelle commande
  async create(order: Order): Promise<ApiResponse<{ id: string }>> {
    try {
      const id = await dolibarrClient.post<string>("/orders", order)
      return { success: true, data: { id } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Valider une commande (passer du brouillon à validée)
  async validate(orderId: string, notrigger?: boolean): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/orders/${orderId}/validate`, {
        notrigger: notrigger ? 1 : 0,
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Mettre à jour une commande
  async update(id: string, order: Partial<Order>): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.put(`/orders/${id}`, order)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Supprimer une commande
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.delete(`/orders/${id}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Clôturer une commande
  async close(orderId: string): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/orders/${orderId}/close`, {})
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Ajouter une ligne à une commande
  async addLine(
    orderId: string,
    line: {
      fk_product?: string
      desc?: string
      qty: number
      subprice: number
      tva_tx: number
    },
  ): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/orders/${orderId}/lines`, line)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
