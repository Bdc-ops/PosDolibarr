import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useInvoices, useOrders, useProducts, useThirdParties } from "../hooks/useDolibarr"
import { InvoicesAPI } from "../api/invoices"
import { OrdersAPI } from "../api/orders"
import { ThirdPartiesAPI } from "../api/thirdparties"
import { buildSortParams } from "../utils/dolibarrSort"
import type { Invoice, Order, OrderLine, Product, ThirdParty } from "../types/dolibarr.types"
import { formatPriceWithCurrency } from "../utils/formatPrice"
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isWithinInterval,
  eachMonthOfInterval,
} from "date-fns"
import { getInvoiceDate, getOrderDate } from "../utils/invoiceDate"
import WaveFAB from "../components/WaveFAB"

interface ProductSales {
  productId: string
  productRef: string
  productLabel: string
  totalQuantity: number
  totalRevenue: number
  category?: string
}

interface ClientSales {
  clientId: string
  clientName: string
  totalRevenue: number
  orderCount: number
}

interface MonthlyData {
  month: string
  revenue: number
  orders: number
}

export default function StatsScreen() {
  const { invoices, loading: invoicesLoading, reload: reloadInvoices } = useInvoices()
  const { orders, loading: ordersLoading, reload: reloadOrders } = useOrders()
  const { products, loading: productsLoading, reload: reloadProducts } = useProducts(false)
  const { thirdParties, loading: thirdPartiesLoading, reload: reloadThirdParties } =
    useThirdParties("customer")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  // Cache de clients chargés à la demande par ID
  const [clientsCache, setClientsCache] = useState<Map<string, ThirdParty>>(new Map())

  // Charger toutes les données nécessaires pour les statistiques (plus de 100)
  useEffect(() => {
    // Désactivation du préchargement lourd : on s'appuie sur les hooks (et reload manuel)
    reloadProducts()
    reloadThirdParties()
    // Charger immédiatement quelques pages de factures/commandes pour stats
    const preload = async () => {
      try {
        const [invoicesPage, ordersPage] = await Promise.all([
          InvoicesAPI.getAll({ limit: 500, page: 0, ...buildSortParams("invoices", "DESC", "date") }),
          OrdersAPI.getAll({ limit: 500, page: 0, ...buildSortParams("orders", "DESC", "date") }),
        ])
        if (Array.isArray(invoicesPage) && invoicesPage.length > 0) {
          setAllInvoices(invoicesPage)
        }
        if (Array.isArray(ordersPage) && ordersPage.length > 0) {
          setAllOrders(ordersPage)
        }
      } catch (e) {
        // fallback silent
      }
    }
    preload()
  }, [])

  // Garder les données de stats à jour dès que les hooks remontent de nouvelles données
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:92',message:'allInvoices sync - before',data:{invoicesLength:invoices.length,allInvoicesLength:allInvoices.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (invoices.length > 0) {
      // Ne remplacer allInvoices que si invoices contient plus de données
      // ou si allInvoices est vide (pour éviter d'écraser le preload de 500 factures)
      if (allInvoices.length === 0 || invoices.length > allInvoices.length) {
        setAllInvoices(invoices)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:96',message:'allInvoices sync - replaced',data:{invoicesLength:invoices.length,allInvoicesLength:allInvoices.length,replaced:true},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // Fusionner les factures pour éviter les doublons
        const merged = [...allInvoices]
        const existingIds = new Set(merged.map(inv => inv.id))
        invoices.forEach((inv: Invoice) => {
          if (!existingIds.has(inv.id)) {
            merged.push(inv)
          }
        })
        if (merged.length > allInvoices.length) {
          setAllInvoices(merged)
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:105',message:'allInvoices sync - merged',data:{invoicesLength:invoices.length,allInvoicesLength:allInvoices.length,mergedLength:merged.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        }
      }
    }
  }, [invoices])

  useEffect(() => {
    if (orders.length > 0) {
      setAllOrders(orders)
    }
  }, [orders])

  // Utiliser les données chargées spécifiquement pour les stats, ou fallback sur les hooks
  const statsInvoices = allInvoices.length > 0 ? allInvoices : invoices
  const statsOrders = allOrders.length > 0 ? allOrders : orders

  const loading = invoicesLoading || ordersLoading || productsLoading || thirdPartiesLoading

  // Extraire les catégories uniques des produits
  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>()
    products.forEach((product: any) => {
      if (product.categories && Array.isArray(product.categories)) {
        product.categories.forEach((cat: any) => {
          if (cat && (cat.id || cat.label)) {
            const id = cat.id || cat.label || String(cat)
            const label = cat.label || cat.name || String(cat)
            if (id && label) {
              categoryMap.set(String(id), String(label))
            }
          }
        })
      }
    })
    return Array.from(categoryMap.entries()).map(([id, label]) => ({ id, label }))
  }, [products])

  // Calculer le CA pour un mois donné
  const getMonthRevenue = (monthOffset: number) => {
    const targetDate = subMonths(new Date(), monthOffset)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Log pour debug - visible dans Metro
    const monthKey = format(monthStart, "yyyy-MM")
    console.log(`📊 [Stats] Calcul CA pour ${monthKey} (offset: ${monthOffset})`)
    console.log(`📊 [Stats] Période: ${monthStart.toISOString()} -> ${monthEnd.toISOString()}`)
    console.log(`📊 [Stats] Nombre de factures total: ${statsInvoices.length}`)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:141',message:'getMonthRevenue - before filter',data:{statsInvoicesLength:statsInvoices.length,allInvoicesLength:allInvoices.length,invoicesLength:invoices.length,monthOffset,monthKey},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const filteredInvoices = statsInvoices.filter((invoice: Invoice) => {
      const invoiceDate = getInvoiceDate(invoice)
      if (!invoiceDate) {
        console.log(`⚠️ [Stats] Facture ${invoice.id} sans date reconnue`)
        return false
      }

      const isInInterval = isWithinInterval(invoiceDate, { start: monthStart, end: monthEnd })
      
      const isValidStatus = 
        invoice.status === "1" || 
        invoice.status === "2" || 
        invoice.paye === "1" ||
        (!invoice.status && Number(invoice.total_ttc) > 0)
      
      if (monthOffset <= 3 && isInInterval) {
        console.log(`✅ [Stats] Facture ${invoice.id}: date=${invoiceDate.toISOString()}, statut=${invoice.status || 'N/A'}, paye=${invoice.paye || 'N/A'}, valide=${isValidStatus}, montant=${invoice.total_ttc}`)
      }

      return isInInterval && isValidStatus
    })

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:161',message:'getMonthRevenue - after filter',data:{filteredCount:filteredInvoices.length,statsInvoicesLength:statsInvoices.length,monthOffset,monthKey},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const revenue = filteredInvoices.reduce((sum: number, invoice: Invoice) => {
      const total = Number(invoice.total_ttc) || 0
      return sum + total
    }, 0)

    // Log résultat
    console.log(`💰 [Stats] CA ${monthKey}: ${filteredInvoices.length} factures, total = ${revenue}€`)

    return revenue
  }

  // Calculer le nombre de commandes pour un mois donné
  const getMonthOrdersCount = (monthOffset: number) => {
    const targetDate = subMonths(new Date(), monthOffset)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Log pour debug - visible dans Metro
    const monthKey = format(monthStart, "yyyy-MM")
    console.log(`📦 [Stats] Calcul commandes pour ${monthKey} (offset: ${monthOffset})`)
    console.log(`📦 [Stats] Nombre de commandes total: ${statsOrders.length}`)

    const filteredOrders = statsOrders.filter((order: Order) => {
      const orderDate = getOrderDate(order)
      if (!orderDate) {
        console.log(`⚠️ [Stats] Commande ${order.id} sans date reconnue`)
        return false
      }

      const isInInterval = isWithinInterval(orderDate, { start: monthStart, end: monthEnd })
      
      if (monthOffset <= 3 && isInInterval) {
        console.log(`✅ [Stats] Commande ${order.id}: date=${orderDate.toISOString()}`)
      }

      return isInInterval
    })

    const count = filteredOrders.length
    const minDate = count > 0 ? new Date(Math.min(...filteredOrders.map((o) => {
      const d = getOrderDate(o)
      return d ? d.getTime() : Number.POSITIVE_INFINITY
    }))) : null
    const maxDate = count > 0 ? new Date(Math.max(...filteredOrders.map((o) => {
      const d = getOrderDate(o)
      return d ? d.getTime() : 0
    }))) : null

    // Log résultat
    console.log(`📦 [Stats] Commandes ${monthKey}: ${count} commandes`)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StatsScreen.tsx:195',message:'Orders per month',data:{monthOffset,monthKey,dateStart:monthStart.toISOString(),dateEnd:monthEnd.toISOString(),count,minDate:minDate?.toISOString?.()||null,maxDate:maxDate?.toISOString?.()||null,statsOrdersSize:statsOrders.length},timestamp:Date.now(),sessionId:'debug-session',runId:'orders-months',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return count
  }

  // Log initial pour voir les données brutes - visible dans Metro
  useEffect(() => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const m1Start = startOfMonth(subMonths(now, 1))
    const m1End = endOfMonth(subMonths(now, 1))
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 [Stats] INITIALISATION DES STATISTIQUES')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`📊 [Stats] Factures chargées: ${statsInvoices.length} (hooks: ${invoices.length}, stats: ${allInvoices.length})`)
    console.log(`📊 [Stats] Commandes chargées: ${statsOrders.length} (hooks: ${orders.length}, stats: ${allOrders.length})`)
    console.log(`📊 [Stats] Clients chargés: ${thirdParties.length}`)
    
    const m2Start = startOfMonth(subMonths(now, 2))
    const m2End = endOfMonth(subMonths(now, 2))
    const m3Start = startOfMonth(subMonths(now, 3))
    const m3End = endOfMonth(subMonths(now, 3))
    
    console.log(`📊 [Stats] Date actuelle: ${now.toISOString()}`)
    console.log(`📊 [Stats] Mois actuel: ${currentMonthStart.toISOString()} -> ${currentMonthEnd.toISOString()}`)
    console.log(`📊 [Stats] Mois M-1: ${m1Start.toISOString()} -> ${m1End.toISOString()}`)
    console.log(`📊 [Stats] Mois M-2: ${m2Start.toISOString()} -> ${m2End.toISOString()}`)
    console.log(`📊 [Stats] Mois M-3: ${m3Start.toISOString()} -> ${m3End.toISOString()}`)
    
    // Vérifier les dates min/max des factures chargées
    if (statsInvoices.length > 0) {
      const dates = statsInvoices
        .filter((inv: Invoice) => inv.date)
        .map((inv: Invoice) => {
          if (typeof inv.date === 'number') {
            return inv.date > 2000000000000 ? new Date(inv.date) : new Date(inv.date * 1000)
          }
          return new Date(inv.date as any)
        })
        .filter((d: Date) => !isNaN(d.getTime()))
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        console.log(`📊 [Stats] Période des factures: ${minDate.toISOString()} -> ${maxDate.toISOString()}`)
      }
    }
    
    // Vérifier les dates min/max des commandes chargées
    if (statsOrders.length > 0) {
      const dates = statsOrders
        .map((ord: Order) => {
          const rawDate = ord.date_commande || ord.date_creation || ord.date
          if (!rawDate) return null
          if (typeof rawDate === 'number') {
            return rawDate > 2000000000000 ? new Date(rawDate) : new Date(rawDate * 1000)
          }
          return new Date(rawDate)
        })
        .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime()))
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        console.log(`📊 [Stats] Période des commandes: ${minDate.toISOString()} -> ${maxDate.toISOString()}`)
      }
    }
    
    // Log quelques factures pour voir leur structure
    if (statsInvoices.length > 0) {
      console.log('\n📄 [Stats] ÉCHANTILLON DE FACTURES (3 premières):')
      statsInvoices.slice(0, 3).forEach((invoice: Invoice, index: number) => {
        let dateConverted: string | null = null
        let isInCurrentMonth = false
        let isInM1 = false
        
        const invoiceDate = getInvoiceDate(invoice)
        if (invoiceDate) {
          dateConverted = invoiceDate.toISOString()
          isInCurrentMonth = isWithinInterval(invoiceDate, { start: currentMonthStart, end: currentMonthEnd })
          isInM1 = isWithinInterval(invoiceDate, { start: m1Start, end: m1End })
        }
        
        console.log(`  Facture ${index + 1}:`)
        console.log(`    ID: ${invoice.id}`)
        console.log(`    Date brute: ${invoice.date || "N/A"}`)
        console.log(`    Date convertie: ${dateConverted || 'N/A'}`)
        console.log(`    Dans mois actuel: ${isInCurrentMonth}`)
        console.log(`    Dans M-1: ${isInM1}`)
        console.log(`    Statut: ${invoice.status} (valide: ${invoice.status === "1" || invoice.status === "2"})`)
        console.log(`    Montant: ${invoice.total_ttc}€`)
        console.log(`    Client ID: ${invoice.socid}`)
      })
    } else {
      console.log('⚠️ [Stats] AUCUNE FACTURE CHARGÉE!')
    }
    
    // Log quelques commandes pour voir leur structure
    if (statsOrders.length > 0) {
      console.log('\n📦 [Stats] ÉCHANTILLON DE COMMANDES (3 premières):')
      statsOrders.slice(0, 3).forEach((order: Order, index: number) => {
        const rawDate = order.date_commande || order.date_creation || order.date
        const orderDate = getOrderDate(order)
        let dateConverted: string | null = null
        let isInCurrentMonth = false
        let isInM1 = false
        
        if (orderDate) {
          dateConverted = orderDate.toISOString()
          isInCurrentMonth = isWithinInterval(orderDate, { start: currentMonthStart, end: currentMonthEnd })
          isInM1 = isWithinInterval(orderDate, { start: m1Start, end: m1End })
        }
        
        console.log(`  Commande ${index + 1}:`)
        console.log(`    ID: ${order.id}`)
        console.log(
          `    Date brute: ${rawDate || "N/A"} (type: ${rawDate ? typeof rawDate : "N/A"})`,
        )
        console.log(`    Date convertie: ${dateConverted || 'N/A'}`)
        console.log(`    Dans mois actuel: ${isInCurrentMonth}`)
        console.log(`    Dans M-1: ${isInM1}`)
        console.log(`    Client ID: ${order.socid}`)
      })
    } else {
      console.log('⚠️ [Stats] AUCUNE COMMANDE CHARGÉE!')
    }
    
    console.log('═══════════════════════════════════════════════════════\n')
  }, [statsInvoices.length, statsOrders.length, thirdParties.length, allInvoices.length, allOrders.length])

  // CA des 3 derniers mois
  const monthRevenue = {
    current: getMonthRevenue(0),
    m1: getMonthRevenue(1),
    m2: getMonthRevenue(2),
    m3: getMonthRevenue(3),
  }

  // Commandes des 3 derniers mois
  const monthOrders = {
    current: getMonthOrdersCount(0),
    m1: getMonthOrdersCount(1),
    m2: getMonthOrdersCount(2),
    m3: getMonthOrdersCount(3),
  }

  // Log les résultats finaux - visible dans Metro
  useEffect(() => {
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('💰 [Stats] RÉSULTATS FINAUX')
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 CA par mois:')
    console.log(`  Mois actuel: ${monthRevenue.current}€`)
    console.log(`  M-1: ${monthRevenue.m1}€`)
    console.log(`  M-2: ${monthRevenue.m2}€`)
    console.log(`  M-3: ${monthRevenue.m3}€`)
    console.log('\n📦 Commandes par mois:')
    console.log(`  Mois actuel: ${monthOrders.current}`)
    console.log(`  M-1: ${monthOrders.m1}`)
    console.log(`  M-2: ${monthOrders.m2}`)
    console.log(`  M-3: ${monthOrders.m3}`)
    console.log('═══════════════════════════════════════════════════════\n')
  }, [monthRevenue.current, monthRevenue.m1, monthOrders.current, monthOrders.m1])

  // Ventes sur 3 mois
  const monthlySales = useMemo(() => {
    const now = new Date()
    const threeMonthsAgo = subMonths(now, 2) // 3 mois : actuel, M-1, M-2
    const months = eachMonthOfInterval({
      start: startOfMonth(threeMonthsAgo),
      end: endOfMonth(now),
    })

    // Log pour debug - visible dans Metro
    console.log(`📊 [Stats] Calcul ventes sur 3 mois: ${months.length} mois, ${statsInvoices.length} factures`)

    return months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart)
      const monthKey = format(monthStart, "yyyy-MM")

      const filteredInvoices = statsInvoices.filter((invoice: Invoice) => {
        const invoiceDate = getInvoiceDate(invoice)
        if (!invoiceDate) return false

        const isInInterval = isWithinInterval(invoiceDate, { start: monthStart, end: monthEnd })
        
        const isValidStatus = 
          invoice.status === "1" || 
          invoice.status === "2" || 
          invoice.paye === "1" ||
          (!invoice.status && Number(invoice.total_ttc) > 0)
        
        return isInInterval && isValidStatus
      })

      const revenue = filteredInvoices.reduce((sum: number, invoice: Invoice) => {
        return sum + (Number(invoice.total_ttc) || 0)
      }, 0)

      return {
        month: format(monthStart, "MMM yyyy"),
        monthKey,
        revenue,
      }
    })
  }, [statsInvoices])

  // Meilleurs produits (filtrés par catégorie si sélectionnée)
  const topProducts = useMemo(() => {
    const yearStart = startOfYear(new Date())
    const yearEnd = endOfYear(new Date())
    const productSalesMap = new Map<string, ProductSales>()

    // Parcourir les factures
    invoices.forEach((invoice: Invoice) => {
      const invoiceDate = getInvoiceDate(invoice)
      if (!invoiceDate || !isWithinInterval(invoiceDate, { start: yearStart, end: yearEnd })) return

      if (invoice.lines && invoice.lines.length > 0) {
        invoice.lines.forEach((line: OrderLine) => {
          if (line.fk_product) {
            const product = products.find((p: Product) => p.id === line.fk_product)
            const productCategory = product?.categories?.[0]?.id || product?.categories?.[0]?.label

            // Filtrer par catégorie si sélectionnée
            if (selectedCategory && productCategory !== selectedCategory) {
              return
            }

            const existing = productSalesMap.get(line.fk_product) || {
              productId: line.fk_product,
              productRef: line.product_ref || product?.ref || "N/A",
              productLabel: line.product_label || product?.label || "Produit inconnu",
              totalQuantity: 0,
              totalRevenue: 0,
              category: productCategory,
            }

            existing.totalQuantity += Number(line.qty) || 0
            existing.totalRevenue += Number(line.total_ttc) || 0

            productSalesMap.set(line.fk_product, existing)
          }
        })
      }
    })

    // Parcourir les commandes
    orders.forEach((order: Order) => {
      const orderDate = getOrderDate(order)
      if (!orderDate || !isWithinInterval(orderDate, { start: yearStart, end: yearEnd })) return

      if (order.lines && order.lines.length > 0) {
        order.lines.forEach((line: OrderLine) => {
          if (line.fk_product) {
            const product = products.find((p: Product) => p.id === line.fk_product)
            const productCategory = product?.categories?.[0]?.id || product?.categories?.[0]?.label

            // Filtrer par catégorie si sélectionnée
            if (selectedCategory && productCategory !== selectedCategory) {
              return
            }

            const existing = productSalesMap.get(line.fk_product) || {
              productId: line.fk_product,
              productRef: line.product_ref || product?.ref || "N/A",
              productLabel: line.product_label || product?.label || "Produit inconnu",
              totalQuantity: 0,
              totalRevenue: 0,
              category: productCategory,
            }

            existing.totalQuantity += Number(line.qty) || 0
            existing.totalRevenue += Number(line.total_ttc) || 0

            productSalesMap.set(line.fk_product, existing)
          }
        })
      }
    })

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  }, [statsInvoices, statsOrders, products, selectedCategory])

  // Fonction pour récupérer un client par ID (avec cache)
  const getClientById = async (socid: string | number): Promise<ThirdParty | null> => {
    const socidStr = String(socid)
    
    // Vérifier le cache d'abord
    if (clientsCache.has(socidStr)) {
      return clientsCache.get(socidStr) || null
    }
    
    // Vérifier dans thirdParties chargés
    const existingClient = thirdParties.find((c: ThirdParty) => String(c.id) === socidStr)
    if (existingClient) {
      // Ajouter au cache
      setClientsCache((prev) => {
        const newCache = new Map(prev)
        newCache.set(socidStr, existingClient)
        return newCache
      })
      return existingClient
    }
    
    // Charger depuis l'API
    try {
      const client = await ThirdPartiesAPI.getById(socidStr)
      if (client) {
        // Ajouter au cache
        setClientsCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(socidStr, client)
          return newCache
        })
        return client
      }
    } catch (error: any) {
      console.warn(`⚠️ [Stats] Impossible de charger le client ${socidStr}:`, error.message)
    }
    
    return null
  }

  // Créer un map combinant le cache et thirdParties
  const clientsMap = useMemo(() => {
    const map = new Map<string, ThirdParty>()
    
    // Ajouter les clients du hook
    thirdParties.forEach((client) => {
      const clientId = String(client.id)
      map.set(clientId, client)
    })
    
    // Ajouter les clients du cache
    clientsCache.forEach((client, clientId) => {
      map.set(clientId, client)
    })
    
    return map
  }, [thirdParties, clientsCache])

  // Meilleurs clients - charger les clients à la demande
  const [topClients, setTopClients] = useState<ClientSales[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  useEffect(() => {
    const calculateTopClients = async () => {
      setLoadingClients(true)
      const clientSalesMap = new Map<string, ClientSales>()

      // Collecter tous les IDs de clients uniques
      const uniqueClientIds = new Set<string>()
      const yearStart = startOfYear(new Date())
      const yearEnd = endOfYear(new Date())

      statsInvoices.forEach((invoice: Invoice) => {
        const invoiceDate = getInvoiceDate(invoice)
        if (!invoiceDate || !isWithinInterval(invoiceDate, { start: yearStart, end: yearEnd })) return

        const isValidStatus = 
          invoice.status === "1" || 
          invoice.status === "2" || 
          invoice.paye === "1" ||
          (!invoice.status && Number(invoice.total_ttc) > 0)
        
        if (invoice.socid && isValidStatus) {
          uniqueClientIds.add(String(invoice.socid))
        }
      })
      
      statsOrders.forEach((order: Order) => {
        if (order.socid) {
          uniqueClientIds.add(String(order.socid))
        }
      })

      // Charger tous les clients nécessaires en parallèle
      const clientPromises = Array.from(uniqueClientIds).map((socid) => getClientById(socid))
      const loadedClients = await Promise.all(clientPromises)
      
      // Créer un map des clients chargés
      const loadedClientsMap = new Map<string, ThirdParty>()
      loadedClients.forEach((client, index) => {
        if (client) {
          const socid = Array.from(uniqueClientIds)[index]
          loadedClientsMap.set(socid, client)
        }
      })

      // Calculer les statistiques avec les clients chargés
      statsInvoices.forEach((invoice: Invoice) => {
        const isValidStatus = 
          invoice.status === "1" || 
          invoice.status === "2" || 
          invoice.paye === "1" ||
          (!invoice.status && Number(invoice.total_ttc) > 0)
        
        if (invoice.socid && isValidStatus) {
          const socidStr = String(invoice.socid)
          const client = loadedClientsMap.get(socidStr) || clientsMap.get(socidStr)
          const clientName = client?.name || (client as any)?.label || client?.name_alias || "Client inconnu"
          
          const existing = clientSalesMap.get(socidStr) || {
            clientId: socidStr,
            clientName: clientName,
            totalRevenue: 0,
            orderCount: 0,
          }

          existing.totalRevenue += Number(invoice.total_ttc) || 0
          clientSalesMap.set(socidStr, existing)
        }
      })

      statsOrders.forEach((order: Order) => {
        const orderDate = getOrderDate(order)
        if (!orderDate || !isWithinInterval(orderDate, { start: yearStart, end: yearEnd })) return

        if (order.socid) {
          const socidStr = String(order.socid)
          const client = loadedClientsMap.get(socidStr) || clientsMap.get(socidStr)
          const clientName = client?.name || (client as any)?.label || client?.name_alias || "Client inconnu"
          
          const existing = clientSalesMap.get(socidStr) || {
            clientId: socidStr,
            clientName: clientName,
            totalRevenue: 0,
            orderCount: 0,
          }

          existing.orderCount += 1
          clientSalesMap.set(socidStr, existing)
        }
      })

      // Log pour debug - visible dans Metro
      console.log(`👥 [Stats] Meilleurs clients calculés: ${clientSalesMap.size} clients`)
      if (clientSalesMap.size > 0) {
        const top3 = Array.from(clientSalesMap.values()).slice(0, 3)
        top3.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.clientName}: ${c.totalRevenue}€ (${c.orderCount} commandes)`)
        })
      }

      const sortedClients = Array.from(clientSalesMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
      
      setTopClients(sortedClients)
      setLoadingClients(false)
    }

    calculateTopClients()
  }, [statsInvoices, statsOrders, clientsMap, clientsCache])

  // Trouver le montant maximum pour l'échelle du graphique 12 mois
  const maxRevenue = useMemo(() => {
    if (monthlySales.length === 0) return 1
    return Math.max(...monthlySales.map((m) => m.revenue), 1)
  }, [monthlySales])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 [Stats] Rafraîchissement des données...')
      
      // Recharger les factures par pages
      let allInvoicesData: Invoice[] = []
      let page = 0
      const pageSize = 100
      let hasMore = true
      
      while (hasMore && page < 10) {
        try {
          const invoicesData = await InvoicesAPI.getAll({
            limit: pageSize,
            page: page,
            ...buildSortParams("invoices", "DESC", "date"),
          })
          
          if (Array.isArray(invoicesData) && invoicesData.length > 0) {
            allInvoicesData = [...allInvoicesData, ...invoicesData]
            if (invoicesData.length < pageSize) {
              hasMore = false
            } else {
              page++
            }
          } else {
            hasMore = false
          }
        } catch (pageError: any) {
          console.warn(`⚠️ [Stats] Erreur page ${page + 1} factures:`, pageError.message)
          hasMore = false
        }
      }
      
      setAllInvoices(allInvoicesData)
      
      // Recharger les commandes par pages
      let allOrdersData: Order[] = []
      page = 0
      hasMore = true
      
      while (hasMore && page < 10) {
        try {
          const ordersData = await OrdersAPI.getAll({
            limit: pageSize,
            page: page,
            ...buildSortParams("orders", "DESC", "date"),
          })
          
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            allOrdersData = [...allOrdersData, ...ordersData]
            if (ordersData.length < pageSize) {
              hasMore = false
            } else {
              page++
            }
          } else {
            hasMore = false
          }
        } catch (pageError: any) {
          console.warn(`⚠️ [Stats] Erreur page ${page + 1} commandes:`, pageError.message)
          hasMore = false
        }
      }
      
      setAllOrders(allOrdersData)
      
      await Promise.all([
        reloadProducts(),
        reloadThirdParties(),
      ])
      
      console.log(`✅ [Stats] Rafraîchissement terminé: ${allInvoicesData.length} factures, ${allOrdersData.length} commandes`)
    } catch (err) {
      console.error('❌ [Stats] Erreur lors du rafraîchissement:', err)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading && !invoices.length && !orders.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0B5FFF" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <View style={styles.container}>
        <WaveFAB />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Tableau de bord</Text>
            <Text style={styles.headerTitle}>Statistiques</Text>
          </View>
        </View>

        {/* CA des 3 derniers mois */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>💶</Text>
              <Text style={styles.cardTitle}>Chiffre d'affaires</Text>
            </View>
            <Text style={styles.sectionMeta}>3 derniers mois</Text>
          </View>
        <View style={styles.monthlyGrid}>
          <View style={styles.monthItem}>
            <View style={styles.monthIcon}>
              <Text style={styles.monthIconEmoji}>📈</Text>
            </View>
            <Text style={styles.monthLabel}>Mois actuel</Text>
            <Text 
              style={styles.monthAmount}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatPriceWithCurrency(monthRevenue.current)}
            </Text>
            <Text style={styles.monthDate}>{format(new Date(), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={styles.monthIcon}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-1</Text>
            <Text style={styles.monthAmount}>{formatPriceWithCurrency(monthRevenue.m1)}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 1), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={styles.monthIcon}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-2</Text>
            <Text style={styles.monthAmount}>{formatPriceWithCurrency(monthRevenue.m2)}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 2), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={styles.monthIcon}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-3</Text>
            <Text style={styles.monthAmount}>{formatPriceWithCurrency(monthRevenue.m3)}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 3), "MMM yyyy")}</Text>
          </View>
        </View>
      </View>

      {/* Commandes des 3 derniers mois */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>🛒</Text>
            <Text style={styles.cardTitle}>Commandes</Text>
          </View>
          <Text style={styles.sectionMeta}>3 derniers mois</Text>
        </View>
        <View style={styles.monthlyGrid}>
          <View style={styles.monthItem}>
            <View style={[styles.monthIcon, styles.monthIconWarm]}>
              <Text style={styles.monthIconEmoji}>🧾</Text>
            </View>
            <Text style={styles.monthLabel}>Mois actuel</Text>
            <Text style={styles.ordersCount}>{monthOrders.current}</Text>
            <Text style={styles.monthDate}>{format(new Date(), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={[styles.monthIcon, styles.monthIconWarm]}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-1</Text>
            <Text style={styles.ordersCount}>{monthOrders.m1}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 1), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={[styles.monthIcon, styles.monthIconWarm]}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-2</Text>
            <Text style={styles.ordersCount}>{monthOrders.m2}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 2), "MMM yyyy")}</Text>
          </View>
          <View style={styles.monthItem}>
            <View style={[styles.monthIcon, styles.monthIconWarm]}>
              <Text style={styles.monthIconEmoji}>🗓️</Text>
            </View>
            <Text style={styles.monthLabel}>M-3</Text>
            <Text style={styles.ordersCount}>{monthOrders.m3}</Text>
            <Text style={styles.monthDate}>{format(subMonths(new Date(), 3), "MMM yyyy")}</Text>
          </View>
        </View>
      </View>

      {/* Graphique des ventes sur 12 mois */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>📊</Text>
            <Text style={styles.cardTitle}>Ventes sur 3 mois</Text>
          </View>
          <Text style={styles.sectionMeta}>Derniers mois</Text>
        </View>
        <View style={styles.chartContainer}>
          {monthlySales.length > 0 ? (
            <View style={styles.chart}>
              {/* Lignes de grille horizontales */}
              <View style={styles.chartGrid}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.chartGridLine, { bottom: (i * 150) / 4 }]} />
                ))}
              </View>
              {monthlySales.map((month, index) => {
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 150 : 0
                return (
                  <View key={month.monthKey} style={styles.chartBarContainer}>
                    <View style={styles.chartValueContainer}>
                      <Text style={styles.chartValue} numberOfLines={1}>
                        {formatPriceWithCurrency(month.revenue)}
                      </Text>
                    </View>
                    <View style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: Math.max(height, 2) },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel} numberOfLines={1}>
                      {month.month.substring(0, 3)}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <Text style={styles.noDataText}>Aucune vente sur 3 mois</Text>
          )}
        </View>
      </View>

      {/* Meilleurs produits avec filtre par catégorie */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>🏷️</Text>
            <Text style={styles.cardTitle}>Meilleurs produits</Text>
          </View>
          {categories.length > 0 && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Filtrer par catégorie",
                  "Choisissez une catégorie",
                  [
                    { text: "Toutes", onPress: () => setSelectedCategory(undefined) },
                    ...categories.map((cat) => ({
                      text: cat.label,
                      onPress: () => setSelectedCategory(cat.id),
                    })),
                    { text: "Annuler", style: "cancel" },
                  ],
                )
              }}
            >
              <Text style={styles.filterEmoji}>⚙️</Text>
              <Text style={styles.filterButtonText}>
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.label || "Catégorie"
                  : "Toutes"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {topProducts.length > 0 ? (
          topProducts.map((product, index) => (
            <View key={product.productId} style={styles.productItem}>
              <View style={styles.productRank}>
                <Text style={styles.productRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.productLabel}
                </Text>
                <Text style={styles.productRef}>{product.productRef}</Text>
                {product.category && (
                  <Text style={styles.productCategory}>
                    {categories.find((c) => c.id === product.category)?.label || product.category}
                  </Text>
                )}
              </View>
              <View style={styles.productStats}>
                <View style={styles.inlineStat}>
                  <Text style={styles.inlineEmoji}>💰</Text>
                  <Text style={styles.productRevenue}>
                    {formatPriceWithCurrency(product.totalRevenue)}
                  </Text>
                </View>
                <Text style={styles.productQuantity}>
                  {product.totalQuantity} unités
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>

      {/* Meilleurs clients */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>👥</Text>
            <Text style={styles.cardTitle}>Meilleurs clients</Text>
          </View>
          <Text style={styles.sectionMeta}>Top 10</Text>
        </View>
        {topClients.length > 0 ? (
          topClients.map((client, index) => (
            <View key={client.clientId} style={styles.clientItem}>
              <View style={styles.clientRank}>
                <Text style={styles.clientRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {client.clientName}
                </Text>
                <Text style={styles.clientOrders}>{client.orderCount} commande(s)</Text>
              </View>
              <View style={styles.clientStats}>
                <View style={styles.inlineStat}>
                  <Text style={styles.inlineEmoji}>💳</Text>
                  <Text style={styles.clientRevenue}>
                    {formatPriceWithCurrency(client.totalRevenue)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF0F8",
  },
  backgroundGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(11, 95, 255, 0.15)",
  },
  backgroundGlowSecondary: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 122, 47, 0.12)",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Espace pour le WaveFAB au-dessus du footer
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerEyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#5C6B82",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5C6B82",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionMeta: {
    fontSize: 12,
    color: "#5C6B82",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  monthlyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  monthItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  monthIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  monthIconEmoji: {
    fontSize: 14,
  },
  monthIconWarm: {
    backgroundColor: "rgba(255, 122, 47, 0.12)",
  },
  monthLabel: {
    fontSize: 12,
    color: "#5C6B82",
    marginBottom: 4,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B5FFF",
    marginBottom: 4,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
  monthDate: {
    fontSize: 10,
    color: "#8A98AD",
  },
  ordersCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF7A2F",
    marginBottom: 4,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
  chartContainer: {
    marginTop: 8,
    position: "relative",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 200,
    paddingVertical: 8,
    position: "relative",
  },
  chartGrid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  chartGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(92, 107, 130, 0.15)",
    zIndex: 0,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 1,
    position: "relative",
  },
  chartBarWrapper: {
    width: "80%",
    height: 150,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chartBar: {
    width: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 6,
    minHeight: 2,
  },
  chartValueContainer: {
    marginBottom: 4,
    minHeight: 20,
    maxHeight: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  chartValue: {
    fontSize: 9,
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
  },
  chartLabel: {
    fontSize: 9,
    color: "#5C6B82",
    marginTop: 4,
    textAlign: "center",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterEmoji: {
    fontSize: 12,
  },
  filterButtonText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(11, 95, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productRankText: {
    color: "#0B5FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  productRef: {
    fontSize: 12,
    color: "#5C6B82",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    color: "#8A98AD",
    fontStyle: "italic",
  },
  productStats: {
    alignItems: "flex-end",
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B5FFF",
    marginBottom: 4,
  },
  inlineStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineEmoji: {
    fontSize: 12,
  },
  productQuantity: {
    fontSize: 12,
    color: "#5C6B82",
  },
  clientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  clientRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 122, 47, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  clientRankText: {
    color: "#FF7A2F",
    fontSize: 14,
    fontWeight: "700",
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  clientOrders: {
    fontSize: 12,
    color: "#5C6B82",
  },
  clientStats: {
    alignItems: "flex-end",
  },
  clientRevenue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF7A2F",
  },
  noDataText: {
    fontSize: 14,
    color: "#8A98AD",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
})
