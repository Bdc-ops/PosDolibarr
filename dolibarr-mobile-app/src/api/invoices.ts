// API Factures - Consultation et gestion
import { dolibarrClient } from "./dolibarr.client"
import type { Invoice, ApiResponse } from "../types/dolibarr.types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { demoInvoices, filterDemoData } from "../utils/demoData"

async function isDemoMode(): Promise<boolean> {
  const demoMode = await AsyncStorage.getItem("demo_mode")
  return demoMode === "true"
}

export const InvoicesAPI = {
  // Récupérer toutes les factures
  async getAll(params?: {
    sortfield?: string
    sortorder?: "ASC" | "DESC"
    limit?: number
    page?: number
    thirdparty_ids?: string
    sqlfilters?: string
  }): Promise<Invoice[]> {
    if (await isDemoMode()) {
      return filterDemoData(demoInvoices, params)
    }
    return dolibarrClient.get<Invoice[]>("/invoices", params)
  },

  // Récupérer une facture par ID
  async getById(id: string): Promise<Invoice> {
    if (await isDemoMode()) {
      const invoice = demoInvoices.find((inv) => inv.id === id)
      if (!invoice) throw new Error("Facture non trouvée")
      return invoice
    }
    return dolibarrClient.get<Invoice>(`/invoices/${id}`)
  },

  // Créer une facture depuis une commande
  async createFromOrder(orderId: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const id = await dolibarrClient.post<string>(`/orders/${orderId}/createinvoice`, {})
      return { success: true, data: { id } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Valider une facture
  async validate(invoiceId: string): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/invoices/${invoiceId}/validate`, {})
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Enregistrer un paiement
  async addPayment(
    invoiceId: string,
    payment: {
      datepaye: number // Unix timestamp
      paiementid: string // Type de paiement
      closepaidinvoices: "yes" | "no"
      accountid: string // Compte bancaire
      num_paiement?: string
      comment?: string
      chqemetteur?: string
      chqbank?: string
    },
  ): Promise<ApiResponse<void>> {
    try {
      await dolibarrClient.post(`/invoices/${invoiceId}/payments`, payment)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Télécharger PDF de la facture
  async downloadPDF(invoiceId: string): Promise<string> {
    // Retourne l'URL du PDF
    return `${dolibarrClient["config"].apiUrl}/documents/download?modulepart=invoice&original_file=${invoiceId}/${invoiceId}.pdf`
  },
}
