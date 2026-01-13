/**
 * Helpers centralisés pour les appels API Dolibarr
 * Uniformise la recherche, la pagination et l'affichage
 */

// Limite d'affichage standard pour tous les écrans
export const DISPLAY_LIMIT = 25

// Limite de chargement depuis l'API (peut être plus grande que DISPLAY_LIMIT)
export const API_FETCH_LIMIT = 500

/**
 * Paramètres standardisés pour les appels API
 */
export interface StandardApiParams {
  sortfield?: string
  sortorder?: "ASC" | "DESC"
  limit?: number
  page?: number
  sqlfilters?: string
  search?: string
}

/**
 * Construit les paramètres API standardisés avec recherche
 * @param searchQuery - Terme de recherche (optionnel)
 * @param additionalParams - Paramètres additionnels
 * @returns Paramètres API standardisés
 */
export function buildStandardApiParams(
  searchQuery?: string,
  additionalParams?: Partial<StandardApiParams>
): StandardApiParams {
  const params: StandardApiParams = {
    limit: additionalParams?.limit || API_FETCH_LIMIT,
    page: additionalParams?.page || 0,
    ...additionalParams,
  }

  // Si une recherche est fournie, construire sqlfilters
  if (searchQuery && searchQuery.trim().length > 0) {
    // La recherche sera gérée par chaque endpoint spécifique
    // car la syntaxe sqlfilters varie selon les champs disponibles
    params.search = searchQuery.trim()
  }

  return params
}

/**
 * Limite un tableau à DISPLAY_LIMIT éléments pour l'affichage
 * @param items - Tableau à limiter
 * @returns Tableau limité à DISPLAY_LIMIT éléments
 */
export function limitForDisplay<T>(items: T[]): T[] {
  return items.slice(0, DISPLAY_LIMIT)
}

/**
 * Formate le message d'affichage "X documents sur Y"
 * @param displayedCount - Nombre d'éléments affichés
 * @param totalCount - Nombre total d'éléments
 * @param resourceName - Nom de la ressource (ex: "factures", "commandes")
 * @returns Message formaté
 */
export function formatDisplayCount(
  displayedCount: number,
  totalCount: number,
  resourceName: string
): string {
  if (displayedCount >= totalCount) {
    return `${totalCount.toLocaleString("fr-FR")} ${resourceName}`
  }
  return `Affichage de ${displayedCount} ${resourceName} sur ${totalCount.toLocaleString("fr-FR")}`
}

/**
 * Construit un filtre de recherche sqlfilters pour les produits
 * @param query - Terme de recherche
 * @returns Filtre sqlfilters formaté
 */
export function buildProductSearchFilter(query: string): string {
  return `(t.ref:like:'%${query}%') OR (t.label:like:'%${query}%')`
}

/**
 * Construit un filtre de recherche sqlfilters pour les tiers/clients
 * @param query - Terme de recherche
 * @returns Filtre sqlfilters formaté
 */
export function buildThirdPartySearchFilter(query: string): string {
  return `(nom:like:'%${query}%') OR (email:like:'%${query}%') OR (ref:like:'%${query}%')`
}

/**
 * Construit un filtre de recherche sqlfilters pour les factures
 * @param query - Terme de recherche
 * @returns Filtre sqlfilters formaté
 */
export function buildInvoiceSearchFilter(query: string): string {
  return `(ref:like:'%${query}%')`
}

/**
 * Construit un filtre de recherche sqlfilters pour les commandes
 * @param query - Terme de recherche
 * @returns Filtre sqlfilters formaté
 */
export function buildOrderSearchFilter(query: string): string {
  return `(ref:like:'%${query}%')`
}

