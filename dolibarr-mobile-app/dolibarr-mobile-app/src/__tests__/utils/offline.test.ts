import { OfflineManager } from "../../utils/offline"
import AsyncStorage from "@react-native-async-storage/async-storage"

jest.mock("@react-native-async-storage/async-storage")

describe("OfflineManager", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([])
  })

  describe("isOnline", () => {
    it("devrait retourner un booléen", async () => {
      const result = await OfflineManager.isOnline()

      expect(typeof result).toBe("boolean")
    })
  })

  describe("setCache", () => {
    it("devrait sauvegarder des données dans le cache", async () => {
      const key = "test_key"
      const data = { test: "data" }

      await OfflineManager.setCache(key, data)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "dolibarr_cache_test_key",
        expect.stringContaining('"data"'),
      )
    })
  })

  describe("getCache", () => {
    it("devrait récupérer des données du cache", async () => {
      const key = "test_key"
      const cachedData = {
        data: { test: "data" },
        timestamp: Date.now(),
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedData),
      )

      const result = await OfflineManager.getCache(key)

      expect(result).toEqual({ test: "data" })
    })

    it("devrait retourner null si le cache est expiré", async () => {
      const key = "test_key"
      const expiredCache = {
        data: { test: "data" },
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        expiry: Date.now() - 60 * 60 * 1000,
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(expiredCache),
      )

      const result = await OfflineManager.getCache(key)

      expect(result).toBeNull()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("dolibarr_cache_test_key")
    })

    it("devrait retourner null si le cache n'existe pas", async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await OfflineManager.getCache("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("removeCache", () => {
    it("devrait supprimer un élément du cache", async () => {
      const key = "test_key"

      await OfflineManager.removeCache(key)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("dolibarr_cache_test_key")
    })
  })

  describe("cleanExpiredCache", () => {
    it("devrait nettoyer le cache expiré", async () => {
      const keys = ["dolibarr_cache_key1", "dolibarr_cache_key2", "other_key"]
      const expiredCache = {
        data: { test: "data" },
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        expiry: Date.now() - 60 * 60 * 1000,
      }
      const validCache = {
        data: { test: "data" },
        timestamp: Date.now(),
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      }

      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(keys)
      ;(AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(expiredCache))
        .mockResolvedValueOnce(JSON.stringify(validCache))

      await OfflineManager.cleanExpiredCache()

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("dolibarr_cache_key1")
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith("dolibarr_cache_key2")
    })
  })

  describe("getCacheSize", () => {
    it("devrait retourner le nombre d'éléments en cache", async () => {
      const keys = [
        "dolibarr_cache_key1",
        "dolibarr_cache_key2",
        "dolibarr_cache_key3",
        "other_key",
      ]

      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(keys)

      const size = await OfflineManager.getCacheSize()

      expect(size).toBe(3)
    })
  })
})

