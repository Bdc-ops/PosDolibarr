// API Dictionnaires Dolibarr - Modes de paiement, expédition, etc.
import { dolibarrClient } from "./dolibarr.client"

export interface PaymentType {
  id: string
  code: string
  label: string
  active: string | number
}

export interface ShippingMethod {
  id: string
  code: string
  label: string
  active: string | number
}

export const DictionariesAPI = {
  // Récupérer les modes de paiement
  async getPaymentTypes(): Promise<PaymentType[]> {
    try {
      // Passer active=1 comme paramètre d'URL (pas filtrer après)
      const response = await dolibarrClient.get<PaymentType[]>("/setup/dictionary/payment_types", {
        sortfield: "code",
        sortorder: "ASC",
        limit: 100,
        active: 1
      })
      // L'API retourne déjà les modes actifs grâce au paramètre active=1
      const result = Array.isArray(response) ? response : []
      return result
    } catch (error: any) {
      console.warn("⚠️ Impossible de récupérer les modes de paiement:", error)
      // Fallback avec modes de paiement par défaut
      const fallback = [
        { id: "1", code: "CB", label: "Carte bancaire", active: "1" },
        { id: "2", code: "CHQ", label: "Chèque", active: "1" },
        { id: "3", code: "VIR", label: "Virement", active: "1" },
        { id: "4", code: "LIQ", label: "Espèces", active: "1" },
        { id: "5", code: "VAD", label: "Paiement en ligne", active: "1" },
      ]
      return fallback
    }
  },

  // Récupérer les modes d'expédition
  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      // Passer active=1 comme paramètre d'URL (pas filtrer après)
      const response = await dolibarrClient.get<ShippingMethod[]>("/setup/dictionary/shipping_methods", {
        limit: 100,
        active: 1
      })
      // L'API retourne déjà les modes actifs grâce au paramètre active=1
      const result = Array.isArray(response) ? response : []
      return result
    } catch (error: any) {
      console.warn("⚠️ Impossible de récupérer les modes d'expédition:", error)
      // Fallback avec modes d'expédition par défaut
      const fallback = [
        { id: "1", code: "TRANS", label: "Transporteur", active: "1" },
        { id: "2", code: "COLISSIMO", label: "Colissimo", active: "1" },
        { id: "3", code: "CHRONO", label: "Chronopost", active: "1" },
        { id: "4", code: "RETRAIT", label: "Retrait sur place", active: "1" },
        { id: "5", code: "MAIN", label: "Remise en main propre", active: "1" },
      ]
      return fallback
    }
  },
}

