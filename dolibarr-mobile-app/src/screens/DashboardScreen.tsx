import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"
import DashboardTile from "../components/DashboardTile"
import { useInvoices, useOrders, useProducts, useThirdParties } from "../hooks/useDolibarr"
import { formatPriceWithCurrency } from "../utils/formatPrice"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { fr } from "date-fns/locale"
import { Ionicons } from "@expo/vector-icons"
import { getInvoiceDate, getOrderDate } from "../utils/invoiceDate"
import { InvoicesAPI } from "../api/invoices"
import { buildSortParams } from "../utils/dolibarrSort"
import type { Invoice } from "../types/dolibarr.types"

const { width } = Dimensions.get("window")
const TILE_WIDTH = (width - 48) / 2 // 2 colonnes avec padding

interface DashboardScreenProps {
  navigation: any
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { invoices, loading: loadingInvoices, reload: reloadInvoices } = useInvoices()
  const { orders, loading: loadingOrders, reload: reloadOrders } = useOrders()
  const { products, totalProducts, loading: loadingProducts } = useProducts()
  const { thirdParties, loading: loadingClients } = useThirdParties("customer")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const lastRefreshRef = useRef(0)
  
  // État de chargement global pour la barre de progression
  const isLoading = loadingInvoices || loadingOrders || loadingProducts || loadingClients

  // Précharger toutes les factures pour le calcul du CA
  useEffect(() => {
    const preload = async () => {
      try {
        const invoicesPage = await InvoicesAPI.getAll({ 
          limit: 500, 
          page: 0, 
          ...buildSortParams("invoices", "DESC", "date") 
        })
        if (Array.isArray(invoicesPage) && invoicesPage.length > 0) {
          setAllInvoices(invoicesPage)
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:40',message:'Preload invoices',data:{preloadedCount:invoicesPage.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
      } catch (e) {
        // fallback silent
      }
    }
    preload()
  }, [])

  // Synchroniser avec les factures du hook (fusionner au lieu de remplacer)
  useEffect(() => {
    if (invoices.length > 0) {
      if (allInvoices.length === 0 || invoices.length > allInvoices.length) {
        setAllInvoices(invoices)
      } else {
        // Fusionner pour éviter les doublons
        const merged = [...allInvoices]
        const existingIds = new Set(merged.map(inv => inv.id))
        invoices.forEach((inv: Invoice) => {
          if (!existingIds.has(inv.id)) {
            merged.push(inv)
          }
        })
        if (merged.length > allInvoices.length) {
          setAllInvoices(merged)
        }
      }
    }
  }, [invoices])

  // Utiliser toutes les factures disponibles pour le CA
  const invoicesForCA = allInvoices.length > 0 ? allInvoices : invoices

  // Demander la permission GPS au chargement (expo-location est maintenant importé statiquement)
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({})
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
          // Sauvegarder les coordonnées pour utilisation future
          await AsyncStorage.setItem(
            "user_location",
            JSON.stringify({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              timestamp: Date.now(),
            }),
          )
        }
      } catch (error) {
        console.warn("Erreur lors de la récupération de la position GPS:", error)
      }
    }
    requestLocationPermission()
  }, [])

  // Calculer le CA du jour (factures validées/payées)
  const currentDayRevenue = React.useMemo(() => {
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:90',message:'CA du jour - invoices count',data:{invoicesCount:invoicesForCA.length,allInvoicesCount:allInvoices.length,hookInvoicesCount:invoices.length,dayStart:dayStart.toISOString(),dayEnd:dayEnd.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const filtered = invoicesForCA.filter((invoice: any) => {
      const invoiceDate = getInvoiceDate(invoice)
      if (!invoiceDate) return false
      
      const isToday = isWithinInterval(invoiceDate, { start: dayStart, end: dayEnd })
      const isValidStatus = 
        invoice.status === "1" || 
        invoice.status === "2" || 
        invoice.paye === "1" ||
        (!invoice.status && Number(invoice.total_ttc) > 0)
      
      return isToday && isValidStatus
    })

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:107',message:'CA du jour - filtered count',data:{filteredCount:filtered.length,invoicesCount:invoicesForCA.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const revenue = filtered.reduce((sum: number, invoice: any) => {
      return sum + (Number(invoice.total_ttc) || 0)
    }, 0)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:112',message:'CA du jour - revenue',data:{revenue,invoicesCount:invoicesForCA.length,filteredCount:filtered.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return revenue
  }, [invoicesForCA])

  // Calculer le CA du mois (factures validées/payées)
  const currentMonthRevenue = React.useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:130',message:'CA du mois - invoices count',data:{invoicesCount:invoicesForCA.length,allInvoicesCount:allInvoices.length,hookInvoicesCount:invoices.length,monthStart:monthStart.toISOString(),monthEnd:monthEnd.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const filtered = invoicesForCA.filter((invoice: any) => {
      const invoiceDate = getInvoiceDate(invoice)
      if (!invoiceDate) return false
      
      const isInMonth = isWithinInterval(invoiceDate, { start: monthStart, end: monthEnd })
      const isValidStatus = 
        invoice.status === "1" || 
        invoice.status === "2" || 
        invoice.paye === "1" ||
        (!invoice.status && Number(invoice.total_ttc) > 0)
      
      return isInMonth && isValidStatus
    })

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:147',message:'CA du mois - filtered count',data:{filteredCount:filtered.length,invoicesCount:invoicesForCA.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const revenue = filtered.reduce((sum: number, invoice: any) => {
      return sum + (Number(invoice.total_ttc) || 0)
    }, 0)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardScreen.tsx:152',message:'CA du mois - revenue',data:{revenue,invoicesCount:invoicesForCA.length,filteredCount:filtered.length},timestamp:Date.now(),sessionId:'debug-session',runId:'ca-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return revenue
  }, [invoicesForCA])

  // Calculer le CA des commandes du mois (pas des factures)
  const currentMonthOrdersRevenue = React.useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    return orders
      .filter((order: any) => {
        const orderDate = getOrderDate(order)
        if (!orderDate) return false
        return isWithinInterval(orderDate, { start: monthStart, end: monthEnd })
      })
      .reduce((sum: number, order: any) => {
        return sum + (Number(order.total_ttc) || 0)
      }, 0)
  }, [orders])

  // Calculer le nombre de commandes du mois
  const currentMonthOrders = React.useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    return orders.filter((order: any) => {
      const orderDate = getOrderDate(order)
      if (!orderDate) return false
      return isWithinInterval(orderDate, { start: monthStart, end: monthEnd })
    }).length
  }, [orders])

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now()
      if (now - lastRefreshRef.current > 30000) {
        lastRefreshRef.current = now
        reloadInvoices()
        reloadOrders()
      }
    }, [reloadInvoices, reloadOrders]),
  )

  const tiles = [
    {
      icon: "📦",
      title: "Produits",
      subtitle: totalProducts !== null 
        ? (totalProducts > 5000 ? "5000+ produits" : `${totalProducts.toLocaleString("fr-FR")} produits`)
        : `${products.length.toLocaleString("fr-FR")} produits`,
      color: "#0B5FFF",
      onPress: () => navigation.navigate("Produits"),
    },
    {
      icon: "📦📦",
      title: "Stocks",
      subtitle: "Gestion",
      color: "#FF6B35",
      onPress: () => navigation.navigate("Produits"), // Pour l'instant, rediriger vers produits
    },
    {
      icon: "🛒",
      title: "Commandes",
      subtitle: `${currentMonthOrders} ce mois`,
      color: "#4CAF50",
      onPress: () => navigation.navigate("Commandes"),
    },
    {
      icon: "👥",
      title: "Clients",
      subtitle: `${thirdParties.length} clients`,
      color: "#2196F3",
      onPress: () => navigation.navigate("Clients"),
    },
    {
      icon: "📈",
      title: "Statistiques",
      subtitle: undefined, // pas de valeur affichée sous le titre pour éviter le 0,00€ visuel
      color: "#9C27B0",
      onPress: () => navigation.navigate("Statistiques"),
    },
    {
      icon: "⚙️",
      title: "Configuration",
      subtitle: "Paramètres",
      color: "#607D8B",
      onPress: () => navigation.navigate("Configuration"),
    },
  ]

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* En-tête avec bouton compte en haut à gauche */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => navigation.navigate("Account")}
            >
              <Text style={styles.accountButtonIcon}>👤</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Tableau de bord</Text>
              <Text style={styles.subtitle}>
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text 
              style={styles.statValue}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {loadingInvoices ? "…" : formatPriceWithCurrency(currentDayRevenue)}
            </Text>
            <Text style={styles.statLabel}>CA du jour</Text>
          </View>
          <View style={styles.statCard}>
            <Text 
              style={styles.statValue}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {loadingInvoices ? "…" : formatPriceWithCurrency(currentMonthRevenue)}
            </Text>
            <Text style={styles.statLabel}>CA du mois</Text>
          </View>
        </View>

        {/* Grille de tuiles */}
        <View style={styles.tilesContainer}>
          {tiles.map((tile, index) => (
            <View key={index} style={[styles.tileWrapper, { width: TILE_WIDTH }]}>
              <DashboardTile
                icon={tile.icon}
                title={tile.title}
                subtitle={tile.subtitle}
                color={tile.color}
                onPress={tile.onPress}
              />
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountButtonIcon: {
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#5C6B82",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B5FFF",
    marginBottom: 4,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
  statLabel: {
    fontSize: 12,
    color: "#5C6B82",
  },
  tilesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  tileWrapper: {
    margin: 8,
  },
})
