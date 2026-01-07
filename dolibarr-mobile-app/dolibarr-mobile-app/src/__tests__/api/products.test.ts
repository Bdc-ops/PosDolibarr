import { ProductsAPI } from "../../api/products"
import { dolibarrClient } from "../../api/dolibarr.client"

// Mock du client
jest.mock("../../api/dolibarr.client", () => ({
  dolibarrClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

describe("ProductsAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getAll", () => {
    it("devrait récupérer tous les produits", async () => {
      const mockProducts = [
        {
          id: "1",
          ref: "PROD001",
          label: "Produit 1",
          price: 10.0,
          price_ttc: 12.0,
          tva_tx: 20,
          stock_reel: 100,
          status: "1",
        },
      ]

      ;(dolibarrClient.get as jest.Mock).mockResolvedValue(mockProducts)

      const result = await ProductsAPI.getAll()

      expect(dolibarrClient.get).toHaveBeenCalledWith("/products", undefined)
      expect(result).toEqual(mockProducts)
    })

    it("devrait récupérer les produits avec des paramètres", async () => {
      const params = { limit: 10, page: 1 }
      const mockProducts = []

      ;(dolibarrClient.get as jest.Mock).mockResolvedValue(mockProducts)

      await ProductsAPI.getAll(params)

      expect(dolibarrClient.get).toHaveBeenCalledWith("/products", params)
    })
  })

  describe("getById", () => {
    it("devrait récupérer un produit par ID", async () => {
      const mockProduct = {
        id: "1",
        ref: "PROD001",
        label: "Produit 1",
        price: 10.0,
      }

      ;(dolibarrClient.get as jest.Mock).mockResolvedValue(mockProduct)

      const result = await ProductsAPI.getById("1")

      expect(dolibarrClient.get).toHaveBeenCalledWith("/products/1")
      expect(result).toEqual(mockProduct)
    })
  })

  describe("search", () => {
    it("devrait rechercher des produits", async () => {
      const query = "test"
      const mockProducts = [
        {
          id: "1",
          ref: "TEST001",
          label: "Produit test",
          price: 10.0,
        },
      ]

      ;(dolibarrClient.get as jest.Mock).mockResolvedValue(mockProducts)

      const result = await ProductsAPI.search(query)

      expect(dolibarrClient.get).toHaveBeenCalledWith("/products", {
        sqlfilters: "(t.ref:like:'%test%') OR (t.label:like:'%test%')",
      })
      expect(result).toEqual(mockProducts)
    })
  })

  describe("create", () => {
    it("devrait créer un nouveau produit", async () => {
      const newProduct = {
        ref: "PROD002",
        label: "Nouveau produit",
        price: 15.0,
      }

      ;(dolibarrClient.post as jest.Mock).mockResolvedValue("2")

      const result = await ProductsAPI.create(newProduct)

      expect(dolibarrClient.post).toHaveBeenCalledWith("/products", newProduct)
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe("2")
    })

    it("devrait gérer les erreurs lors de la création", async () => {
      const newProduct = { ref: "PROD002" }
      const error = new Error("Erreur de création")

      ;(dolibarrClient.post as jest.Mock).mockRejectedValue(error)

      const result = await ProductsAPI.create(newProduct)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Erreur de création")
    })
  })

  describe("update", () => {
    it("devrait mettre à jour un produit", async () => {
      const updatedProduct = { label: "Produit modifié" }

      ;(dolibarrClient.put as jest.Mock).mockResolvedValue(undefined)

      const result = await ProductsAPI.update("1", updatedProduct)

      expect(dolibarrClient.put).toHaveBeenCalledWith("/products/1", updatedProduct)
      expect(result.success).toBe(true)
    })
  })

  describe("delete", () => {
    it("devrait supprimer un produit", async () => {
      ;(dolibarrClient.delete as jest.Mock).mockResolvedValue(undefined)

      const result = await ProductsAPI.delete("1")

      expect(dolibarrClient.delete).toHaveBeenCalledWith("/products/1")
      expect(result.success).toBe(true)
    })
  })
})

