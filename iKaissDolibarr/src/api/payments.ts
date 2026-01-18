/**
 * Service API Dolibarr - Paiements
 * Gère les interactions avec l'API REST Dolibarr pour les paiements
 * Note: Les paiements sont généralement gérés via les factures
 */

import { dolibarrApi } from './dolibarr';
import { addPaymentToInvoice } from './orders';

/**
 * Interface pour un paiement Dolibarr
 */
export interface DolibarrPayment {
  id?: number;
  fk_facture?: number;
  datep?: string;
  datev?: string;
  amount: number;
  payment_type?: string;
  payment_mode?: string;
  num_payment?: string;
  note?: string;
}

/**
 * Enregistre un paiement dans Dolibarr
 * @param invoiceId - ID de la facture
 * @param amount - Montant du paiement
 * @param paymentType - Type de paiement (cash, card, check, etc.)
 * @param reference - Référence du paiement (optionnel)
 * @returns Paiement enregistré
 */
export async function recordPayment(
  invoiceId: number,
  amount: number,
  paymentType: string = 'cash',
  reference?: string
): Promise<DolibarrPayment> {
  try {
    return await addPaymentToInvoice(invoiceId, amount, paymentType);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error);
    throw error;
  }
}

/**
 * Récupère les paiements d'une facture
 * @param invoiceId - ID de la facture
 * @returns Liste des paiements
 */
export async function getInvoicePayments(
  invoiceId: number
): Promise<DolibarrPayment[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrPayment[]>(
      `/api/index.php/invoices/${invoiceId}/payments`
    );
    return response.data || [];
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des paiements de la facture ${invoiceId}:`,
      error
    );
    throw error;
  }
}
