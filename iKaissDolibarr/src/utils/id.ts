/**
 * Utilitaires pour générer des IDs uniques
 */

/**
 * Génère un ID unique simple
 * Format: timestamp + random
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Génère un ID court (pour codes, références)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}
