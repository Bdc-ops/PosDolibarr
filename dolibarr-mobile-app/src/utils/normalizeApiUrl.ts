/**
 * Normalise l'URL de l'API Dolibarr
 * 
 * - Ajoute automatiquement /api/index.php si absent
 * - Nettoie les slashes en double
 * - Gère les URLs avec ou sans trailing slash
 * 
 * @param url - L'URL saisie par l'utilisateur (ex: "https://domaine" ou "https://domaine/api/index.php")
 * @returns L'URL normalisée avec /api/index.php
 * 
 * @example
 * normalizeApiUrl("https://dolibarr.example.com") 
 * // => "https://dolibarr.example.com/api/index.php"
 * 
 * normalizeApiUrl("https://dolibarr.example.com/") 
 * // => "https://dolibarr.example.com/api/index.php"
 * 
 * normalizeApiUrl("https://dolibarr.example.com/api/index.php") 
 * // => "https://dolibarr.example.com/api/index.php"
 * 
 * normalizeApiUrl("https://dolibarr.example.com//api//index.php") 
 * // => "https://dolibarr.example.com/api/index.php"
 */
export function normalizeApiUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return url
  }

  // Supprimer les espaces en début et fin
  let normalized = url.trim()

  // Si l'URL est vide, retourner tel quel
  if (!normalized) {
    return normalized
  }

  // Supprimer le trailing slash s'il existe
  normalized = normalized.replace(/\/+$/, "")

  // Vérifier si /api/index.php est déjà présent (insensible à la casse)
  const apiPath = "/api/index.php"
  const apiPathPattern = /\/+api\/+index\.php\/?/gi
  
  // Créer une nouvelle regex pour chaque test (car test() consomme l'état)
  const hasApiPath = /\/+api\/+index\.php\/?/gi.test(normalized)

  if (!hasApiPath) {
    // Ajouter /api/index.php si absent
    normalized = `${normalized}${apiPath}`
  } else {
    // Si présent, remplacer toutes les occurrences par une seule version normalisée
    normalized = normalized.replace(apiPathPattern, apiPath)
  }

  // Nettoyer les slashes en double (sauf après le protocole https:// ou http://)
  normalized = normalized.replace(/([^:]\/)\/+/g, "$1")

  return normalized
}

