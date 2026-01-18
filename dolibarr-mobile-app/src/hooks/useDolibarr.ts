// 🚀 Hook personnalisé avec Lazy Loading optimisé
// Stratégie: 25 docs initial → 500 en background → Scroll infini
import { useState, useEffect, useCallback, useRef } from "react"
import { ProductsAPI } from "../api/products"
import { OrdersAPI } from "../api/orders"
import { InvoicesAPI } from "../api/invoices"
import { ThirdPartiesAPI } from "../api/thirdparties"
import { buildSortParams } from "../utils/dolibarrSort"
import { useLoading } from "../contexts/LoadingContext"

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 useProducts - Lazy Loading optimisé
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useProducts(autoLoad = true) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const backgroundLoadingRef = useRef(false)
  const { startLoading, stopLoading } = useLoading()

  const INITIAL_SIZE = 25 // Affichage rapide
  const PAGE_SIZE = 50 // Pages suivantes
  const MAX_BACKGROUND = 500 // Limite du chargement automatique

  // 🎯 Chargement initial ou recherche
  const loadProducts = async (searchQuery?: string, categoryFilterParam?: string, initialLoad = true) => {
    if (initialLoad) {
      setLoading(true)
      startLoading("products", "Chargement des produits...")
      setCurrentPage(0)
      setHasMore(true)
      backgroundLoadingRef.current = false
      // Mettre à jour le filtre de catégorie
      if (categoryFilterParam !== undefined) {
        setCategoryFilter(categoryFilterParam)
      }
    } else {
      setLoadingMore(true)
    }
    
    setError(null)
    
    // Utiliser le filtre de catégorie stocké si pas de paramètre fourni
    const activeCategoryFilter = categoryFilterParam !== undefined ? categoryFilterParam : categoryFilter
    
    try {
      if (searchQuery) {
        // Mode recherche: tout charger
        const data = await ProductsAPI.search(searchQuery)
        setProducts(Array.isArray(data) ? data : [])
        setHasMore(false)
        backgroundLoadingRef.current = false
      } else {
        // Mode liste: chargement progressif
        const pageSize = initialLoad ? INITIAL_SIZE : PAGE_SIZE
        const page = initialLoad ? 0 : currentPage + 1
        
        // Préparer les paramètres avec le filtre de catégorie si présent
        const sortParams = buildSortParams("products", "DESC", "date")
        const apiParams: any = { limit: pageSize, page, ...sortParams }
        if (activeCategoryFilter) {
          // Utiliser le paramètre category de l'API Dolibarr
          apiParams.category = activeCategoryFilter
        }
        
        const pageData = await ProductsAPI.getAll(apiParams)
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          if (initialLoad) {
            setProducts(pageData)
            // Arrêter le loading IMMÉDIATEMENT pour afficher les produits tout de suite
            setLoading(false)
            stopLoading("products")
            // ⚡ Lancer le chargement background après un délai très court
            if (pageData.length >= INITIAL_SIZE) {
              setTimeout(() => {
                if (!backgroundLoadingRef.current) {
                  backgroundLoadingRef.current = true
                  loadMoreInBackground()
                }
              }, 50) // Délai très court pour charger en background rapidement
            }
          } else {
            setProducts(prev => [...prev, ...pageData])
          }
          
          setCurrentPage(page)
          setHasMore(pageData.length >= pageSize)
        } else {
          if (!initialLoad) {
            setProducts(prev => prev) // Garder les données existantes
          }
          setHasMore(false)
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Erreur lors du chargement des produits"
      console.warn("⚠️ [useProducts]", errorMessage)
      setError(errorMessage)
      
      if (initialLoad && products.length === 0) {
        setProducts([])
      }
    } finally {
      // Le loading est déjà arrêté dans le if (initialLoad) pour afficher immédiatement
      // Ne le réarrêter que si ce n'était pas un chargement initial
      if (initialLoad && products.length === 0) {
        // Seulement si on n'a pas réussi à charger de produits
        setLoading(false)
        stopLoading("products")
      } else if (!initialLoad) {
        setLoadingMore(false)
      }
    }
  }

  // 🔄 Chargement background (silencieux)
  const loadMoreInBackground = async () => {
    if (products.length >= MAX_BACKGROUND || !hasMore || loadingMore) {
      backgroundLoadingRef.current = false
      return
    }

    try {
      const sortParams = buildSortParams("products", "DESC", "date")
      const page = currentPage + 1
      const apiParams: any = { limit: PAGE_SIZE, page, ...sortParams }
      if (categoryFilter) {
        apiParams.category = categoryFilter
      }
      const pageData = await ProductsAPI.getAll(apiParams)
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        setProducts(prev => {
          const newProducts = [...prev, ...pageData]
          console.log(`🔄 [Background] Produits: ${prev.length} → ${newProducts.length}`)
          return newProducts
        })
        setCurrentPage(page)
        setHasMore(pageData.length >= PAGE_SIZE)
        
        // Continuer en background si on n'a pas atteint la limite
        if (products.length + pageData.length < MAX_BACKGROUND && pageData.length >= PAGE_SIZE) {
          setTimeout(() => loadMoreInBackground(), 200)
        } else {
          backgroundLoadingRef.current = false
        }
      } else {
        setHasMore(false)
        backgroundLoadingRef.current = false
      }
    } catch (err: any) {
      console.warn(`⚠️ [Background] Erreur chargement produits:`, err.message)
      setHasMore(false)
      backgroundLoadingRef.current = false
    }
  }

  // 📜 Scroll infini (sur demande utilisateur)
  const loadMore = () => {
    if (!hasMore || loadingMore || loading || backgroundLoadingRef.current) return
    console.log("📜 [Scroll] Chargement de produits supplémentaires...")
    loadProducts(undefined, undefined, false)
  }

  // 🔢 Charger le total réel
  const loadTotal = async () => {
    try {
      const total = await ProductsAPI.getTotal()
      setTotalProducts(total)
    } catch (err: any) {
      console.warn("⚠️ Erreur total produits:", err.message)
      setTotalProducts(null)
    }
  }

  useEffect(() => {
    if (autoLoad) {
      loadProducts()
      loadTotal()
    }
  }, [autoLoad])

  const reload = useCallback((categoryFilter?: string) => {
    return loadProducts(undefined, categoryFilter, true)
  }, [])

  return { 
    products, 
    loading, 
    loadingMore,
    error, 
    totalProducts, 
    hasMore,
    reload,
    loadMore,
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 useThirdParties - Lazy Loading optimisé
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useThirdParties(mode: "customer" | "supplier" | "all" = "customer") {
  const [thirdParties, setThirdParties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const backgroundLoadingRef = useRef(false)
  const { startLoading, stopLoading } = useLoading()

  const INITIAL_SIZE = 25
  const PAGE_SIZE = 50
  const MAX_BACKGROUND = 500

  const loadThirdParties = async (initialLoad = true) => {
    if (initialLoad) {
      setLoading(true)
      startLoading("thirdparties", "Chargement des clients...")
      setCurrentPage(0)
      setHasMore(true)
      backgroundLoadingRef.current = false
    } else {
      setLoadingMore(true)
    }
    
    setError(null)
    
    try {
      const sortParams = buildSortParams("thirdparties", "DESC", "date")
      const pageSize = initialLoad ? INITIAL_SIZE : PAGE_SIZE
      const page = initialLoad ? 0 : currentPage + 1
      
      const pageData = await ThirdPartiesAPI.getAll({ mode, limit: pageSize, page, ...sortParams })
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        if (initialLoad) {
          // Dédupliquer par ID avant de définir
          const uniqueClients = pageData.filter((client, index, self) => 
            index === self.findIndex(c => c.id === client.id)
          )
          setThirdParties(uniqueClients)
          // Lancer le chargement background
          if (uniqueClients.length >= INITIAL_SIZE) {
            setTimeout(() => {
              if (!backgroundLoadingRef.current) {
                backgroundLoadingRef.current = true
                loadMoreInBackground()
              }
            }, 300)
          }
        } else {
          setThirdParties(prev => {
            // Dédupliquer : ne garder que les nouveaux clients qui n'existent pas déjà
            const existingIds = new Set(prev.map(c => c.id))
            const newClients = pageData.filter(c => !existingIds.has(c.id))
            return [...prev, ...newClients]
          })
        }
        
        setCurrentPage(page)
        setHasMore(pageData.length >= pageSize)
      } else {
        if (!initialLoad) {
          setThirdParties(prev => prev)
        }
        setHasMore(false)
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Erreur lors du chargement des clients"
      console.warn("⚠️ [useThirdParties]", errorMessage)
      setError(errorMessage)
      
      if (initialLoad && thirdParties.length === 0) {
        setThirdParties([])
      }
    } finally {
      if (initialLoad) {
        setLoading(false)
        stopLoading("thirdparties")
      } else {
        setLoadingMore(false)
      }
    }
  }

  const loadMoreInBackground = async () => {
    if (thirdParties.length >= MAX_BACKGROUND || !hasMore || loadingMore) {
      backgroundLoadingRef.current = false
      return
    }

    try {
      const sortParams = buildSortParams("thirdparties", "DESC", "date")
      const page = currentPage + 1
      const pageData = await ThirdPartiesAPI.getAll({ mode, limit: PAGE_SIZE, page, ...sortParams })
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        setThirdParties(prev => {
          // Dédupliquer : ne garder que les nouveaux clients qui n'existent pas déjà
          const existingIds = new Set(prev.map(c => c.id))
          const newClients = pageData.filter(c => !existingIds.has(c.id))
          const updatedClients = [...prev, ...newClients]
          console.log(`🔄 [Background] Clients: ${prev.length} → ${updatedClients.length} (${newClients.length} nouveaux)`)
          return updatedClients
        })
        setCurrentPage(page)
        setHasMore(pageData.length >= PAGE_SIZE)
        
        if (thirdParties.length + pageData.length < MAX_BACKGROUND && pageData.length >= PAGE_SIZE) {
          setTimeout(() => loadMoreInBackground(), 200)
        } else {
          backgroundLoadingRef.current = false
        }
      } else {
        setHasMore(false)
        backgroundLoadingRef.current = false
      }
    } catch (err: any) {
      console.warn(`⚠️ [Background] Erreur chargement clients:`, err.message)
      setHasMore(false)
      backgroundLoadingRef.current = false
    }
  }

  const loadMore = () => {
    if (!hasMore || loadingMore || loading || backgroundLoadingRef.current) return
    console.log("📜 [Scroll] Chargement de clients supplémentaires...")
    loadThirdParties(false)
  }

  useEffect(() => {
    loadThirdParties(true)
  }, [mode])

  return { thirdParties, loading, loadingMore, error, hasMore, reload: loadThirdParties, loadMore }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛒 useOrders - Lazy Loading optimisé
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useOrders(thirdPartyId?: string) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const backgroundLoadingRef = useRef(false)
  const { startLoading, stopLoading } = useLoading()

  const INITIAL_SIZE = 25
  const PAGE_SIZE = 50
  const MAX_BACKGROUND = 500

  const loadOrders = useCallback(async (initialLoad = true) => {
    if (initialLoad) {
      setLoading(true)
      startLoading("orders", "Chargement des commandes...")
      setCurrentPage(0)
      setHasMore(true)
      backgroundLoadingRef.current = false
    } else {
      setLoadingMore(true)
    }
    
    setError(null)
    
    try {
      const sortParams = buildSortParams("orders", "DESC", "date")
      const pageSize = initialLoad ? INITIAL_SIZE : PAGE_SIZE
      const page = initialLoad ? 0 : currentPage + 1
      
      const pageData = await OrdersAPI.getAll({
        thirdparty_ids: thirdPartyId,
        limit: pageSize,
        page,
        ...sortParams,
      })
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        if (initialLoad) {
          setOrders(pageData)
          // Arrêter le loading IMMÉDIATEMENT pour afficher les commandes tout de suite
          setLoading(false)
          stopLoading("orders")
          // Lancer le chargement background
          if (pageData.length >= INITIAL_SIZE) {
            setTimeout(() => {
              if (!backgroundLoadingRef.current) {
                backgroundLoadingRef.current = true
                loadMoreInBackground()
              }
            }, 50) // Délai très court
          }
        } else {
          setOrders(prev => [...prev, ...pageData])
        }
        
        setCurrentPage(page)
        setHasMore(pageData.length >= pageSize)
      } else {
        if (!initialLoad) {
          setOrders(prev => prev)
        }
        setHasMore(false)
      }
    } catch (err: any) {
      if (err.degradedMode || err.is503UnknownColumn) {
        setError(null)
        if (err.data && Array.isArray(err.data)) {
          setOrders(err.data)
          // Arrêter le loading si on a des données
          if (initialLoad && err.data.length > 0) {
            setLoading(false)
            stopLoading("orders")
          }
        } else if (!initialLoad) {
          setOrders(prev => prev)
        } else {
          setOrders([])
        }
      } else {
        const errorMessage = err?.message || "Erreur lors du chargement des commandes"
        console.warn("⚠️ [useOrders]", errorMessage)
        setError(errorMessage)
        
        if (initialLoad && orders.length === 0) {
          setOrders([])
        }
      }
    } finally {
      // Le loading est déjà arrêté dans le if (initialLoad) pour afficher immédiatement
      if (!initialLoad) {
        setLoadingMore(false)
      } else if (orders.length === 0) {
        // Seulement si on n'a vraiment aucune donnée
        setLoading(false)
        stopLoading("orders")
      }
    }

    async function loadMoreInBackground() {
      if (orders.length >= MAX_BACKGROUND || !hasMore || loadingMore) {
        backgroundLoadingRef.current = false
        return
      }

      try {
        const sortParams = buildSortParams("orders", "DESC", "date")
        const page = currentPage + 1
        const pageData = await OrdersAPI.getAll({
          thirdparty_ids: thirdPartyId,
          limit: PAGE_SIZE,
          page,
          ...sortParams,
        })
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          setOrders(prev => {
            const newOrders = [...prev, ...pageData]
            console.log(`🔄 [Background] Commandes: ${prev.length} → ${newOrders.length}`)
            return newOrders
          })
          setCurrentPage(page)
          setHasMore(pageData.length >= PAGE_SIZE)
          
          if (orders.length + pageData.length < MAX_BACKGROUND && pageData.length >= PAGE_SIZE) {
            setTimeout(() => loadMoreInBackground(), 200)
          } else {
            backgroundLoadingRef.current = false
          }
        } else {
          setHasMore(false)
          backgroundLoadingRef.current = false
        }
      } catch (err: any) {
        console.warn(`⚠️ [Background] Erreur chargement commandes:`, err.message)
        setHasMore(false)
        backgroundLoadingRef.current = false
      }
    }
  }, [thirdPartyId])

  const loadMore = () => {
    if (!hasMore || loadingMore || loading || backgroundLoadingRef.current) return
    console.log("📜 [Scroll] Chargement de commandes supplémentaires...")
    loadOrders(false)
  }

  useEffect(() => {
    loadOrders(true)
  }, [loadOrders])

  return { orders, loading, loadingMore, error, hasMore, reload: loadOrders, loadMore }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 useInvoices - Lazy Loading optimisé
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useInvoices(thirdPartyId?: string) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const backgroundLoadingRef = useRef(false)
  const { startLoading, stopLoading } = useLoading()

  const INITIAL_SIZE = 25
  const PAGE_SIZE = 50
  const MAX_BACKGROUND = 500

  const loadInvoices = useCallback(async (initialLoad = true) => {
    if (initialLoad) {
      setLoading(true)
      startLoading("invoices", "Chargement des factures...")
      setCurrentPage(0)
      setHasMore(true)
      backgroundLoadingRef.current = false
    } else {
      setLoadingMore(true)
    }
    
    setError(null)
    
    try {
      const sortParams = buildSortParams("invoices", "DESC", "date")
      const pageSize = initialLoad ? INITIAL_SIZE : PAGE_SIZE
      const page = initialLoad ? 0 : currentPage + 1
      
      const pageData = await InvoicesAPI.getAll({
        thirdparty_ids: thirdPartyId,
        limit: pageSize,
        page,
        ...sortParams,
      })
      
      if (Array.isArray(pageData) && pageData.length > 0) {
        if (initialLoad) {
          setInvoices(pageData)
          // Arrêter le loading IMMÉDIATEMENT pour afficher les factures tout de suite
          setLoading(false)
          stopLoading("invoices")
          // Lancer le chargement background
          if (pageData.length >= INITIAL_SIZE) {
            setTimeout(() => {
              if (!backgroundLoadingRef.current) {
                backgroundLoadingRef.current = true
                loadMoreInBackground()
              }
            }, 50) // Délai très court
          }
        } else {
          setInvoices(prev => [...prev, ...pageData])
        }
        
        setCurrentPage(page)
        setHasMore(pageData.length >= pageSize)
      } else {
        if (!initialLoad) {
          setInvoices(prev => prev)
        }
        setHasMore(false)
      }
    } catch (err: any) {
      if (err.degradedMode || err.is503UnknownColumn || err.is500Error) {
        setError(null)
        if (err.data && Array.isArray(err.data)) {
          setInvoices(err.data)
          // Arrêter le loading si on a des données
          if (initialLoad && err.data.length > 0) {
            setLoading(false)
            stopLoading("invoices")
          }
        } else if (!initialLoad) {
          setInvoices(prev => prev)
        } else {
          setInvoices([])
        }
      } else {
        const errorMessage = err?.message || "Erreur lors du chargement des factures"
        console.warn("⚠️ [useInvoices]", errorMessage)
        setError(errorMessage)
        
        if (initialLoad && invoices.length === 0) {
          setInvoices([])
        }
      }
    } finally {
      // Le loading est déjà arrêté dans le if (initialLoad) pour afficher immédiatement
      if (!initialLoad) {
        setLoadingMore(false)
      } else if (invoices.length === 0) {
        // Seulement si on n'a vraiment aucune donnée
        setLoading(false)
        stopLoading("invoices")
      }
    }

    async function loadMoreInBackground() {
      if (invoices.length >= MAX_BACKGROUND || !hasMore || loadingMore) {
        backgroundLoadingRef.current = false
        return
      }

      try {
        const sortParams = buildSortParams("invoices", "DESC", "date")
        const page = currentPage + 1
        const pageData = await InvoicesAPI.getAll({
          thirdparty_ids: thirdPartyId,
          limit: PAGE_SIZE,
          page,
          ...sortParams,
        })
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          setInvoices(prev => {
            const newInvoices = [...prev, ...pageData]
            console.log(`🔄 [Background] Factures: ${prev.length} → ${newInvoices.length}`)
            return newInvoices
          })
          setCurrentPage(page)
          setHasMore(pageData.length >= PAGE_SIZE)
          
          if (invoices.length + pageData.length < MAX_BACKGROUND && pageData.length >= PAGE_SIZE) {
            setTimeout(() => loadMoreInBackground(), 200)
          } else {
            backgroundLoadingRef.current = false
          }
        } else {
          setHasMore(false)
          backgroundLoadingRef.current = false
        }
      } catch (err: any) {
        console.warn(`⚠️ [Background] Erreur chargement factures:`, err.message)
        setHasMore(false)
        backgroundLoadingRef.current = false
      }
    }
  }, [thirdPartyId])

  const loadMore = () => {
    if (!hasMore || loadingMore || loading || backgroundLoadingRef.current) return
    console.log("📜 [Scroll] Chargement de factures supplémentaires...")
    loadInvoices(false)
  }

  useEffect(() => {
    loadInvoices(true)
  }, [loadInvoices])

  return { invoices, loading, loadingMore, error, hasMore, reload: loadInvoices, loadMore }
}
