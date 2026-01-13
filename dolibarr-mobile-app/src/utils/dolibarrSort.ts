/**
 * Helper pour gérer les champs de tri compatibles avec l'API Dolibarr
 * Évite les erreurs SQL liées aux colonnes inexistantes
 */

export type ResourceType = "orders" | "invoices" | "products" | "thirdparties"

/**
 * Champs de tri compatibles par ressource
 * Ordre de priorité : le premier champ est utilisé en priorité, avec fallback automatique
 */
const COMPATIBLE_SORT_FIELDS: Record<ResourceType, string[]> = {
  orders: ["date_commande", "date_creation", "t.date_commande", "t.date_creation", "ref"],
  invoices: ["datef", "date_creation", "t.datef", "t.date_creation", "ref"],
  products: ["ref", "label", "price", "t.ref", "t.label"],
  thirdparties: ["nom", "ref", "code_client", "datec", "t.nom", "t.ref"],
}

/**
 * Construit les paramètres de tri compatibles pour une ressource
 * 
 * @param resourceType - Type de ressource (orders, invoices, etc.)
 * @param sortOrder - Ordre de tri (ASC ou DESC)
 * @param preferredField - Champ préféré (optionnel, sera mappé si nécessaire)
 * @returns Paramètres de tri avec un champ compatible
 * 
 * @example
 * buildSortParams("orders", "DESC", "date")
 * // => { sortfield: "date_commande", sortorder: "DESC" }
 */
export function buildSortParams(
  resourceType: ResourceType,
  sortOrder: "ASC" | "DESC" = "DESC",
  preferredField?: string,
): { sortfield: string; sortorder: "ASC" | "DESC" } {
  const compatibleFields = COMPATIBLE_SORT_FIELDS[resourceType]

  // Si un champ préféré est fourni, vérifier s'il est compatible
  if (preferredField) {
    // Mapper "date" vers le champ compatible selon la ressource
    if (preferredField === "date") {
      return {
        sortfield: compatibleFields[0], // Utiliser le premier champ compatible
        sortorder: sortOrder,
      }
    }

    // Si le champ préféré est dans la liste compatible, l'utiliser
    if (compatibleFields.includes(preferredField)) {
      return {
        sortfield: preferredField,
        sortorder: sortOrder,
      }
    }
  }

  // Par défaut, utiliser le premier champ compatible
  return {
    sortfield: compatibleFields[0],
    sortorder: sortOrder,
  }
}

/**
 * Vérifie si une erreur est liée à un problème SQL (colonne inexistante)
 * Spécifiquement pour les erreurs 503 avec "Unknown column"
 */
export function isSqlError(error: any): boolean {
  if (!error) return false

  const errorMessage = String(error.message || error.response?.data?.error || error.response?.data || "")
  const errorStatus = error.response?.status || error.status
  const errorCode = error.code || error.response?.status

  // Erreur 503 avec "Unknown column" dans le message
  if (errorStatus === 503 || errorCode === 503) {
    if (/Unknown column/i.test(errorMessage)) {
      return true
    }
    // Toute erreur 503 est considérée comme SQL pour Dolibarr
    return true
  }

  // Vérifier les messages d'erreur SQL courants
  const sqlErrorPatterns = [
    /Unknown column/i,
    /column.*doesn't exist/i,
    /ORDER BY/i,
    /SQL.*error/i,
  ]

  return sqlErrorPatterns.some((pattern) => pattern.test(errorMessage))
}

/**
 * Vérifie spécifiquement si c'est une erreur 503 avec "Unknown column"
 * Utilisé pour activer le mode dégradé immédiatement
 */
export function is503UnknownColumnError(error: any): boolean {
  if (!error) return false

  const errorStatus = error.response?.status || error.status || error.code
  const errorMessage = String(error.message || error.response?.data?.error || error.response?.data || "")

  return errorStatus === 503 && /Unknown column/i.test(errorMessage)
}

