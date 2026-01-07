/**
 * Helper pour formater les prix de manière robuste
 * Gère les cas où price peut être string, number, null ou undefined
 * 
 * @param value - La valeur à formater (peut être string, number, null ou undefined)
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns String formatée avec "0.00" par défaut si la valeur est invalide
 */
export function formatPrice(
  value: string | number | null | undefined,
  decimals: number = 2,
): string {
  // Si la valeur est null ou undefined, retourner "0.00"
  if (value === null || value === undefined) {
    return "0.00"
  }

  // Convertir en number
  const numValue = Number(value)

  // Vérifier si la conversion a échoué (NaN)
  if (isNaN(numValue)) {
    return "0.00"
  }

  // Formater avec le nombre de décimales demandé et séparateurs de milliers
  const fixed = numValue.toFixed(decimals)
  // Ajouter des séparateurs de milliers (espaces pour la France)
  const parts = fixed.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return parts.join(".")
}

/**
 * Helper pour formater les prix avec le symbole €
 * 
 * @param value - La valeur à formater
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns String formatée avec "0.00 €" par défaut si la valeur est invalide
 */
export function formatPriceWithCurrency(
  value: string | number | null | undefined,
  decimals: number = 2,
): string {
  return `${formatPrice(value, decimals)} €`
}

