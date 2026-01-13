/**
 * Mapping centralisé entre les valeurs métier et les valeurs API Dolibarr pour le paramètre "mode"
 * 
 * L'API Dolibarr attend un entier :
 * - 1 = client
 * - 2 = fournisseur
 * - 3 = client + fournisseur
 */

export type ThirdPartyMode = "customer" | "supplier" | "both" | "all"

/**
 * Mapping des valeurs métier vers les valeurs API Dolibarr
 */
const MODE_MAPPING: Record<ThirdPartyMode, number> = {
  customer: 1, // Client uniquement
  supplier: 2, // Fournisseur uniquement
  both: 3, // Client + fournisseur
  all: 3, // Tous (équivalent à both)
}

/**
 * Valeur par défaut sécurisée (client uniquement)
 */
const DEFAULT_MODE = 1

/**
 * Convertit une valeur métier en valeur API Dolibarr
 * 
 * @param mode - Valeur métier ("customer", "supplier", "both", "all")
 * @returns Valeur numérique pour l'API Dolibarr (1, 2, ou 3)
 * 
 * @example
 * mapModeToApi("customer") // => 1
 * mapModeToApi("supplier") // => 2
 * mapModeToApi("both") // => 3
 */
export function mapModeToApi(mode: ThirdPartyMode | undefined): number {
  if (!mode) {
    console.warn("⚠️ Mode non défini, utilisation de la valeur par défaut (1 = client)")
    return DEFAULT_MODE
  }

  const apiMode = MODE_MAPPING[mode]

  if (apiMode === undefined) {
    console.warn(
      `⚠️ Mode métier inconnu: "${mode}". Valeurs acceptées: "customer", "supplier", "both", "all". Utilisation de la valeur par défaut (1 = client)`,
    )
    return DEFAULT_MODE
  }

  return apiMode
}

/**
 * Valide qu'une valeur est un mode valide
 */
export function isValidMode(mode: any): mode is ThirdPartyMode {
  return typeof mode === "string" && mode in MODE_MAPPING
}

