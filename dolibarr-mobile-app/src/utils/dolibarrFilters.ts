/**
 * Helper pour construire les filtres Dolibarr au format correct
 * 
 * Syntaxe Dolibarr pour sqlfilters :
 * - (field:=:value) : égalité
 * - (field:in:value1,value2) : dans une liste
 * - (field:like:'%text%') : recherche textuelle
 * 
 * IMPORTANT: Ne pas utiliser de SQL brut, uniquement la syntaxe Dolibarr
 */

import type { ThirdPartyMode } from "./dolibarrMode"

/**
 * Construit un filtre Dolibarr pour les tiers selon le type
 * 
 * @param type - Type de tiers ("customer", "supplier", "both", "all")
 * @returns Filtre au format Dolibarr ou undefined si aucun filtre
 * 
 * @example
 * buildThirdPartyFilters("customer") // => "(client:=:1)"
 * buildThirdPartyFilters("both") // => "(client:in:1,3)"
 */
export function buildThirdPartyFilters(type: ThirdPartyMode): string | undefined {
  switch (type) {
    case "customer":
      // Client uniquement - Essayer plusieurs syntaxes possibles
      // Syntaxe 1: (client:=:1) - égalité simple
      // Syntaxe 2: (t.client:=:1) - avec préfixe table
      // Syntaxe 3: (client:in:1,3) - pour inclure clients et prospects
      // On utilise la syntaxe la plus simple d'abord
      return "(client:=:1)"
    
    case "supplier":
      // Fournisseur uniquement
      return "(fournisseur:=:1)"
    
    case "both":
    case "all":
      // Client + prospect - Utiliser IN pour inclure les deux types
      // 1 = client, 3 = prospect (client non prospect)
      return "(client:in:1,3)"
    
    default:
      console.warn(
        `⚠️ Type de tiers inconnu: "${type}". Valeurs acceptées: "customer", "supplier", "both", "all". Aucun filtre appliqué.`,
      )
      return undefined
  }
}

/**
 * Combine plusieurs filtres Dolibarr avec AND
 * 
 * @param filters - Tableau de filtres Dolibarr
 * @returns Filtre combiné ou undefined si aucun filtre
 */
export function combineFilters(filters: Array<string | undefined>): string | undefined {
  const validFilters = filters.filter((f): f is string => f !== undefined && f.trim() !== "")
  
  if (validFilters.length === 0) {
    return undefined
  }
  
  if (validFilters.length === 1) {
    return validFilters[0]
  }
  
  // Combiner avec AND : (filter1) AND (filter2)
  return validFilters.map((f) => `(${f})`).join(" AND ")
}

/**
 * Valide qu'un filtre est au format Dolibarr correct
 * 
 * @param filter - Filtre à valider
 * @returns true si le filtre est valide
 */
export function isValidDolibarrFilter(filter: string): boolean {
  // Vérifier la syntaxe de base Dolibarr
  // Format attendu: (field:operator:value) ou combinaisons avec AND/OR
  const dolibarrPattern = /^\([^:]+:[^:]+:[^)]+\)(\s+(AND|OR)\s+\([^:]+:[^:]+:[^)]+\))*$/
  return dolibarrPattern.test(filter.trim())
}

