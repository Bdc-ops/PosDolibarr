/**
 * Service API Dolibarr - Produits
 * Gère toutes les interactions avec l'API REST Dolibarr pour les produits
 */

import { dolibarrApi } from './dolibarr';
import { DolibarrProduct, DolibarrCategory } from '../types/product';

function toNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const n = Number.parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeProduct(p: any): DolibarrProduct {
  const id = typeof p?.id === 'number' ? p.id : Number.parseInt(String(p?.id ?? p?.rowid ?? '0'), 10);
  const price = toNum(p?.price) ?? 0;
  const tva_tx = toNum(p?.tva_tx) ?? 0;
  const price_ttc = toNum(p?.price_ttc) ?? price * (1 + tva_tx / 100);
  const stock_reel = toNum(p?.stock_reel);
  const stock_available = toNum(p?.stock_available);
  return {
    ...p,
    id,
    price,
    price_ttc,
    tva_tx,
    stock_reel,
    stock_available,
  } as DolibarrProduct;
}

/**
 * Récupère la liste des produits depuis Dolibarr
 * @param limit - Nombre maximum de résultats
 * @param offset - Décalage pour la pagination
 * @param sortfield - Champ de tri
 * @param sortorder - Ordre de tri (ASC/DESC)
 * @returns Liste des produits
 */
export async function getProducts(
  limit: number = 100,
  offset: number = 0,
  sortfield: string = 't.ref',
  sortorder: string = 'ASC'
): Promise<DolibarrProduct[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrProduct[]>(
      '/api/index.php/products',
      {
        params: {
          limit,
          sortfield,
          sortorder,
          offset,
        },
      }
    );
    const rows = (response.data || []).map((p: any) => normalizeProduct(p));
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
}

/**
 * Récupère des produits pour la caisse (POS)
 * - filtrés sur "tosell=1" quand possible
 * - triés par libellé
 */
export async function getProductsForPOS(limit: number = 200): Promise<DolibarrProduct[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<any>('/api/index.php/products', {
      params: {
        limit,
        sortfield: 't.label',
        sortorder: 'ASC',
        // Dolibarr REST supports sqlfilters syntax: field:=:value
        sqlfilters: '(t.tosell:=:1)',
      },
    });

    const rows: DolibarrProduct[] = Array.isArray(response.data)
      ? response.data
      : response.data && Array.isArray(response.data.products)
        ? response.data.products
        : [];
    const normalizedRows = (rows || []).map((p: any) => normalizeProduct(p));

    // #region agent log
    const sample = (rows || []).slice(0, 2).map((p: any) => ({
      idType: typeof p?.id,
      tosell: p?.tosell ?? null,
      stock_reel_type: typeof p?.stock_reel,
      stock_available_type: typeof p?.stock_available,
      price_type: typeof p?.price,
      price_ttc_type: typeof p?.price_ttc,
    }));
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:55',message:'getProductsForPOS',data:{count:rows?.length||0,normalizedCount:normalizedRows.length,sample},timestamp:Date.now(),sessionId:'debug-session',runId:'products-debug',hypothesisId:'PRICE'})}).catch(()=>{});
    // #endregion

    return normalizedRows;
  } catch (error: any) {
    const status = error?.response?.status;
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:73',message:'getProductsForPOS failed',data:{status:typeof status==='number'?status:null},timestamp:Date.now(),sessionId:'debug-session',runId:'products-debug',hypothesisId:'S'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

/**
 * Récupère un produit par son ID
 * @param id - ID du produit
 * @returns Produit
 */
export async function getProductById(id: number): Promise<DolibarrProduct> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrProduct>(
      `/api/index.php/products/${id}`
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit ${id}:`, error);
    throw error;
  }
}

/**
 * Recherche des produits par terme
 * @param term - Terme de recherche (nom, référence, code-barres)
 * @returns Liste des produits correspondants
 */
export async function searchProducts(term: string): Promise<DolibarrProduct[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrProduct[]>(
      '/api/index.php/products',
      {
        params: {
          sqlfilters: `(t.ref LIKE '%${term}%' OR t.label LIKE '%${term}%' OR t.barcode LIKE '%${term}%')`,
          limit: 50,
        },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Erreur lors de la recherche de produits:', error);
    throw error;
  }
}

/**
 * Récupère les catégories de produits
 * @returns Liste des catégories
 */
export async function getCategories(): Promise<DolibarrCategory[]> {
  try {
    const client = await dolibarrApi.getClient();
    // L'API Dolibarr peut retourner soit un tableau, soit un objet avec une propriété
    const response = await client.get<any>(
      '/api/index.php/categories',
      {
        params: {
          type: 'product',
          sortfield: 't.label',
          sortorder: 'ASC',
        },
      }
    );
    
    // Gère différents formats de réponse Dolibarr
    let categories: DolibarrCategory[] = [];
    
    if (Array.isArray(response.data)) {
      categories = response.data;
    } else if (response.data && Array.isArray(response.data.categories)) {
      categories = response.data.categories;
    } else if (response.data && typeof response.data === 'object') {
      // Si c'est un objet avec des IDs comme clés
      categories = Object.values(response.data);
    }

    // Normalisation: certains serveurs renvoient id en string
    const normalized = (categories || [])
      .map((c: any) => {
        const rawId = c?.id ?? c?.rowid;
        const id = typeof rawId === 'number' ? rawId : Number.parseInt(String(rawId), 10);
        const label = typeof c?.label === 'string' ? c.label : typeof c?.libelle === 'string' ? c.libelle : typeof c?.name === 'string' ? c.name : '';
        const fk_parent_raw = c?.fk_parent ?? c?.parent_id;
        const fk_parent =
          typeof fk_parent_raw === 'number'
            ? fk_parent_raw
            : fk_parent_raw !== undefined && fk_parent_raw !== null
              ? Number.parseInt(String(fk_parent_raw), 10)
              : undefined;

        return {
          id,
          label,
          description: typeof c?.description === 'string' ? c.description : undefined,
          color: typeof c?.color === 'string' ? c.color : undefined,
          fk_parent: Number.isFinite(fk_parent as any) ? (fk_parent as number) : undefined,
        } as DolibarrCategory;
      })
      .filter((c) => Number.isFinite(c.id) && c.label.length > 0);

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:118',message:'getCategories success',data:{responseShape:Array.isArray(response.data)?'array':(response.data&&Array.isArray(response.data.categories))?'object.categories':(response.data&&typeof response.data==='object')?'object.values':'unknown',count:categories?.length||0,normalizedCount:normalized.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // #region agent log
    const sample = (categories || []).slice(0, 3).map((c: any) => ({
      idType: typeof c?.id,
      id: typeof c?.id === 'number' ? c.id : null,
      labelType: typeof c?.label,
      colorType: typeof c?.color,
      keysCount: c && typeof c === 'object' ? Object.keys(c).length : null,
    }));
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:129',message:'getCategories sample',data:{sample},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return normalized;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    const status = (error as any)?.response?.status;
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:126',message:'getCategories failed',data:{status:typeof status==='number'?status:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

/**
 * Récupère les produits d'une catégorie
 * @param categoryId - ID de la catégorie
 * @returns Liste des produits de la catégorie
 */
export async function getProductsByCategory(
  categoryId: number
): Promise<DolibarrProduct[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrProduct[]>(
      `/api/index.php/categories/${categoryId}/objects?type=product`
    );
    const rows = (response.data || []).map((p: any) => normalizeProduct(p));
    // #region agent log
    const sample = (response.data || []).slice(0, 1).map((p: any) => ({ price_type: typeof p?.price, price_ttc_type: typeof p?.price_ttc }));
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/products.ts:190',message:'getProductsByCategory',data:{categoryId,count:(response.data||[]).length,normalizedCount:rows.length,sample},timestamp:Date.now(),sessionId:'debug-session',runId:'products-debug',hypothesisId:'PRICE'})}).catch(()=>{});
    // #endregion
    return rows;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des produits de la catégorie ${categoryId}:`,
      error
    );
    throw error;
  }
}

/**
 * Récupère un produit par son code-barres
 * @param barcode - Code-barres du produit
 * @returns Produit trouvé
 */
export async function getProductByBarcode(
  barcode: string
): Promise<DolibarrProduct | null> {
  try {
    const products = await searchProducts(barcode);
    return products.find((p) => p.barcode === barcode) || null;
  } catch (error) {
    console.error('Erreur lors de la recherche par code-barres:', error);
    return null;
  }
}
