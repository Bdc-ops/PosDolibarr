// Types TypeScript pour l'API Dolibarr

export interface DolibarrConfig {
  apiUrl: string
  apiKey: string
}

export interface Product {
  id: string
  ref: string
  label: string
  description?: string
  price: number
  price_ttc: number
  tva_tx: number
  stock_reel: number
  stock_theorique: number
  barcode?: string
  photo?: string
  status: "0" | "1" // 0=draft, 1=active
  array_options?: Record<string, any>
  // Catégories et tags Dolibarr
  categories?: Array<{ id: string; label: string }>
  tags?: Array<{ id: string; label: string }>
  fk_product_type?: string
  type?: string
}

export interface Stock {
  product_id: string
  warehouse_id: string
  warehouse_label: string
  stock_reel: number
  stock_theorique: number
  pmp: number // Prix moyen pondéré
}

export interface ThirdParty {
  id: string
  name: string
  nom?: string // Alias pour compatibilité API Dolibarr
  name_alias?: string
  email?: string
  phone?: string
  address: string
  zip: string
  town: string
  country_id?: string
  client: "0" | "1" | "2" | "3" // 0=no, 1=customer, 2=prospect, 3=not prospect
  fournisseur: "0" | "1" // 0=no, 1=supplier
  code_client?: string
  tva_intra?: string
  // Tags et catégories
  tags?: Array<{ id: string; label: string }>
  categories?: Array<{ id: string; label: string }>
}

export interface Order {
  id?: string
  ref?: string
  ref_client?: string
  socid: string // Third party ID
  date: number // Unix timestamp
  date_commande?: number // Date de commande (Unix timestamp)
  date_creation?: number // Date de création (Unix timestamp)
  date_livraison?: number // Date de livraison (Unix timestamp)
  lines: OrderLine[]
  note_private?: string
  note_public?: string
  status?: number
  total_ht: number
  total_ttc: number
  total_tva: number
  mode_reglement_id?: string | number // Mode de paiement
  shipping_method_id?: string | number // Mode d'expédition
  deposit_percent?: number // Acompte en pourcentage
  deposit_amount?: number // Acompte en montant fixe
}

export interface OrderLine {
  fk_product?: string
  product_ref?: string
  product_label?: string
  desc?: string
  qty: number
  subprice: number
  tva_tx: number
  total_ht: number
  total_tva: number
  total_ttc: number
}

export interface Invoice {
  id: string
  ref: string
  socid: string
  date: number
  date_echeance?: number
  datef?: number // Date formatée (Unix timestamp)
  date_creation?: number // Date de création (Unix timestamp)
  datec?: number // Date de création (alias)
  total_ht: number
  total_ttc: number
  total_tva: number
  status: "0" | "1" | "2" | "3" // 0=draft, 1=validated, 2=paid, 3=abandoned
  paye: "0" | "1"
  lines: OrderLine[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
