/**
 * Types TypeScript pour les produits Dolibarr
 */

/**
 * Produit Dolibarr (API)
 */
export interface DolibarrProduct {
  id: number;
  ref: string;
  label: string;
  description?: string;
  price: number;
  price_ttc?: number;
  price_min?: number;
  price_base_type?: 'TTC' | 'HT';
  tva_tx?: number;
  stock_reel?: number;
  stock_available?: number;
  barcode?: string;
  fk_product_type?: number;
  tosell?: number;
  tobuy?: number;
  status?: number;
  product_image?: string;
  fk_default_warehouse?: number;
  categories?: DolibarrCategory[];
}

/**
 * Catégorie de produit Dolibarr
 */
export interface DolibarrCategory {
  id: number;
  label: string;
  description?: string;
  color?: string;
  fk_parent?: number;
  children?: DolibarrCategory[];
}

/**
 * Produit en local (avec données de synchronisation)
 */
export interface LocalProduct extends Omit<DolibarrProduct, 'categories'> {
  synced_at: number;
  category_ids: string;
  image_path?: string;
}

/**
 * Produit dans le panier
 */
export interface CartProduct {
  id: number;
  ref: string;
  label: string;
  price: number;
  price_ttc: number;
  tva_tx: number;
  quantity: number;
  discount_amount: number;
  discount_percent: number;
  subtotal: number;
  subtotal_ttc: number;
  total: number;
  total_ttc: number;
}

/**
 * Variante de produit (taille, couleur, etc.)
 */
export interface ProductVariant {
  id: number;
  label: string;
  price_modifier: number;
  stock_reel?: number;
}
