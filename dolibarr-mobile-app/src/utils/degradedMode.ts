/**
 * Gestion du mode dégradé (offline/cache) pour l'application
 */

import AsyncStorage from "@react-native-async-storage/async-storage"

const DEGRADED_MODE_KEY = "dolibarr_degraded_mode"
const DEGRADED_MODE_TIMESTAMP_KEY = "dolibarr_degraded_mode_timestamp"

export interface DegradedModeInfo {
  active: boolean
  reason: string
  timestamp: number
}

/**
 * Active le mode dégradé avec une raison
 */
export async function setDegradedMode(reason: string): Promise<void> {
  const info: DegradedModeInfo = {
    active: true,
    reason,
    timestamp: Date.now(),
  }
  await AsyncStorage.setItem(DEGRADED_MODE_KEY, JSON.stringify(info))
  await AsyncStorage.setItem(DEGRADED_MODE_TIMESTAMP_KEY, String(Date.now()))
}

/**
 * Désactive le mode dégradé
 */
export async function clearDegradedMode(): Promise<void> {
  await AsyncStorage.removeItem(DEGRADED_MODE_KEY)
  await AsyncStorage.removeItem(DEGRADED_MODE_TIMESTAMP_KEY)
}

/**
 * Vérifie si le mode dégradé est actif
 */
export async function isDegradedModeActive(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(DEGRADED_MODE_KEY)
  if (!stored) return false
  
  try {
    const info: DegradedModeInfo = JSON.parse(stored)
    return info.active === true
  } catch {
    return false
  }
}

/**
 * Récupère les informations du mode dégradé
 */
export async function getDegradedModeInfo(): Promise<DegradedModeInfo | null> {
  const stored = await AsyncStorage.getItem(DEGRADED_MODE_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as DegradedModeInfo
  } catch {
    return null
  }
}

/**
 * Message utilisateur pour le mode dégradé
 */
export function getDegradedModeMessage(): string {
  return "Mode dégradé activé : Les données affichées proviennent du cache local. Certaines fonctionnalités peuvent être limitées."
}

