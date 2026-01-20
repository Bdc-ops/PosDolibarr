/**
 * Types TypeScript pour le système de caisse (POS)
 */

import { CartProduct } from './product';
import { SelectedClient } from './client';

/**
 * État d'une vente
 */
export type SaleStatus = 'draft' | 'pending' | 'completed' | 'cancelled' | 'on_hold';

/**
 * Ligne de remise (ligne ou globale)
 */
export interface Discount {
  type: 'line' | 'global';
  line_index?: number;
  amount: number;
  percent: number;
  requires_authorization: boolean;
  authorized_by?: string;
  reason?: string;
}

/**
 * Paiement
 */
export interface Payment {
  id?: string;
  type: PaymentType;
  amount: number;
  reference?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: number;
}

/**
 * Type de paiement
 */
/**
 * PaymentType:
 * - Supports legacy app-friendly names (cash/card/...)
 * - Supports Dolibarr codes from c_paiement (LIQ/CB/CHQ/VIR/...)
 */
export type PaymentType =
  | 'cash'
  | 'card'
  | 'giftcard'
  | 'credit'
  | 'check'
  | 'transfer'
  | 'other'
  | 'LIQ'   // Liquide (cash)
  | 'CB'    // Carte bancaire
  | 'CHQ'   // Chèque
  | 'VIR'   // Virement
  | 'TIP'   // TIP/Prélèvement
  | 'TRA'   // Traite
  | 'PRE'   // Prélèvement
  | 'CASH'  // alias used by some TakePOS mapping/constants
  | 'CHEQUE';

/**
 * Carte cadeau / Avoir
 */
export interface GiftCard {
  id?: string;
  code: string;
  amount: number;
  remaining: number;
  used: number;
  expires_at?: number;
  client_id?: number;
  status: 'active' | 'expired' | 'used';
}

/**
 * Ticket / Facture en attente
 */
export interface PendingSale {
  id: string;
  status: SaleStatus;
  client_id?: number;
  client?: SelectedClient;
  products: CartProduct[];
  discounts: Discount[];
  subtotal: number;
  subtotal_ttc: number;
  total_discount: number;
  total_tax: number;
  total: number;
  total_ttc: number;
  payments: Payment[];
  payment_total: number;
  remaining: number;
  created_at: number;
  updated_at: number;
  notes?: string;
}

/**
 * Vente complétée (ticket/facture)
 */
export interface CompletedSale extends PendingSale {
  ticket_number: string;
  invoice_ref?: string;
  invoice_id?: number;
  synced: boolean;
  synced_at?: number;
  dolibarr_invoice_id?: number;
  dolibarr_order_id?: number;
}

/**
 * Retour / Avoir
 */
export interface ReturnSale {
  id: string;
  original_sale_id?: string;
  original_ticket_number?: string;
  client_id?: number;
  products: Array<{
    product_id: number;
    quantity: number;
    refund_amount: number;
  }>;
  total_refund: number;
  create_credit: boolean;
  credit_id?: string;
  status: 'pending' | 'completed';
  created_at: number;
}

/**
 * Paramètres de ticket
 */
export interface ReceiptSettings {
  show_prices: boolean;
  show_taxes: boolean;
  simplified: boolean;
  company_logo?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  legal_notices?: string;
  footer_text?: string;
}

/**
 * Table (pour restauration)
 */
export interface Table {
  id: number;
  number: string;
  label?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_sale_id?: string;
  area?: string;
}

/**
 * Statistiques de vente
 */
export interface SaleStats {
  total_sales: number;
  total_amount: number;
  total_amount_ttc: number;
  average_ticket: number;
  products_sold: number;
  date: string;
}
