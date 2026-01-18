/**
 * Types TypeScript pour les clients Dolibarr
 */

/**
 * Client Dolibarr (API)
 */
export interface DolibarrClient {
  id: number;
  ref?: string;
  ref_ext?: string;
  name: string;
  name_alias?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  phone_mobile?: string;
  address?: string;
  zip?: string;
  town?: string;
  country?: string;
  status?: number;
  client?: number;
  price_level?: number;
  note_public?: string;
  note_private?: string;
}

/**
 * Client en local (avec données de synchronisation)
 */
export interface LocalClient extends DolibarrClient {
  synced_at: number;
  last_order_at?: number;
  total_orders?: number;
  total_amount?: number;
}

/**
 * Client sélectionné pour une vente
 */
export interface SelectedClient extends DolibarrClient {
  price_level?: number;
  specific_prices?: ProductSpecificPrice[];
  contacts?: Contact[];
  outstanding_invoices?: OutstandingInvoice[];
  bank_accounts?: BankAccount[];
}

/**
 * Contact d'un client
 */
export interface Contact {
  id: number;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  email?: string;
  phone_pro?: string;
  phone_mobile?: string;
  poste?: string;
  roles?: string[];
}

/**
 * Facture en attente
 */
export interface OutstandingInvoice {
  id: number;
  ref?: string;
  total_ttc?: number;
  total_ht?: number;
  date?: string;
  date_lim_reglement?: string;
}

/**
 * Compte bancaire
 */
export interface BankAccount {
  id: number;
  label?: string;
  bank?: string;
  account_number?: string;
  currency_code?: string;
}

/**
 * Prix spécifique client
 */
export interface ProductSpecificPrice {
  product_id: number;
  product_ref: string;
  price: number;
  price_ttc: number;
}
