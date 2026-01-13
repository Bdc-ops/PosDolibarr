// Contexte pour gérer les catégories globalement (produits et clients)
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { CategoriesAPI, type Category } from "../api/categories"

interface CategoriesContextType {
  productCategories: Category[]
  customerCategories: Category[]
  loading: boolean
  productCategoriesMap: Map<string, Category[]> // Map productId -> categories[]
  loadCategories: () => Promise<void>
  getProductCategories: (productId: string) => Category[]
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [productCategories, setProductCategories] = useState<Category[]>([])
  const [customerCategories, setCustomerCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [productCategoriesMap, setProductCategoriesMap] = useState<Map<string, Category[]>>(new Map())

  const loadCategories = async () => {
    setLoading(true)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CategoriesContext.tsx:25',message:'Loading all categories',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      // Charger toutes les catégories en parallèle
      const [productCats, customerCats] = await Promise.all([
        CategoriesAPI.getProductCategories(),
        CategoriesAPI.getCustomerCategories(),
      ])

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CategoriesContext.tsx:33',message:'Categories loaded',data:{productCatsCount:productCats.length,customerCatsCount:customerCats.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion

      setProductCategories(productCats)
      setCustomerCategories(customerCats)
    } catch (err: any) {
      console.warn("⚠️ [CategoriesContext] Erreur chargement catégories:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // Charger les catégories d'un produit spécifique et les mettre en cache
  const loadProductCategories = async (productId: string) => {
    // Si déjà en cache, ne pas recharger
    if (productCategoriesMap.has(productId)) {
      return
    }

    try {
      const categories = await CategoriesAPI.getProductCategoriesById(productId)
      if (categories.length > 0) {
        setProductCategoriesMap(prev => {
          const newMap = new Map(prev)
          newMap.set(productId, categories)
          return newMap
        })
      }
    } catch (err: any) {
      // Erreur silencieuse - le produit n'a peut-être pas de catégories
    }
  }

  // Obtenir les catégories d'un produit (depuis le cache)
  const getProductCategories = (productId: string): Category[] => {
    return productCategoriesMap.get(productId) || []
  }

  return (
    <CategoriesContext.Provider
      value={{
        productCategories,
        customerCategories,
        loading,
        productCategoriesMap,
        loadCategories,
        getProductCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider")
  }
  return context
}

