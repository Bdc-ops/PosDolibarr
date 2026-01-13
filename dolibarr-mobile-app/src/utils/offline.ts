// Utilitaires pour la gestion du mode offline
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Network from "expo-network"

const CACHE_PREFIX = "dolibarr_cache_"
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 heures

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

export class OfflineManager {
  // Vérifier la connectivité (simplifié pour Expo)
  // Note: Pour une détection réseau complète, installez @react-native-community/netinfo
  static async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync()
      if (state.isInternetReachable === false) return false
      if (state.isConnected === false) return false
      return true
    } catch (error) {
      console.error("Erreur lors de la vérification de la connectivité:", error)
      return false
    }
  }

  // Sauvegarder dans le cache
  static async setCache<T>(key: string, data: T, customExpiry?: number): Promise<void> {
    try {
      const expiry = customExpiry || CACHE_EXPIRY
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiry,
      }
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(entry),
      )
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du cache:", error)
    }
  }

  // Récupérer du cache
  static async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)

      // Vérifier l'expiration
      if (Date.now() > entry.expiry) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`)
        return null
      }

      return entry.data
    } catch (error) {
      console.error("Erreur lors de la récupération du cache:", error)
      return null
    }
  }

  // Supprimer du cache
  static async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`)
    } catch (error) {
      console.error("Erreur lors de la suppression du cache:", error)
    }
  }

  // Nettoyer le cache expiré
  static async cleanExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX))

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key)
        if (cached) {
          const entry: CacheEntry<any> = JSON.parse(cached)
          if (Date.now() > entry.expiry) {
            await AsyncStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage du cache:", error)
    }
  }

  // Obtenir la taille du cache
  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX))
      return cacheKeys.length
    } catch (error) {
      console.error("Erreur lors du calcul de la taille du cache:", error)
      return 0
    }
  }

  // Vider complètement le cache
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX))
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys)
        console.log(`✅ Cache vidé: ${cacheKeys.length} entrées supprimées`)
      }
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error)
    }
  }
}
