import React, { useState, useMemo } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from "react-native"
import { useOrders, useThirdParties } from "../hooks/useDolibarr"
import type { Order, ThirdParty } from "../types/dolibarr.types"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"
import { formatPriceWithCurrency } from "../utils/formatPrice"
import { limitForDisplay, formatDisplayCount } from "../utils/apiHelpers"
import WaveFAB from "../components/WaveFAB"

type StatusFilter = "all" | "draft" | "validated"
type DateFilter = "all" | "thisMonth" | "lastMonth" | "last3Months"

export default function OrdersScreen({ navigation }: any) {
  const { orders, loading, error, reload } = useOrders()
  const { thirdParties } = useThirdParties("customer")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [clientFilter, setClientFilter] = useState<string | undefined>(undefined)

  // Créer un map pour accéder rapidement aux clients
  const clientsMap = useMemo(() => {
    const map = new Map<string, ThirdParty>()
    thirdParties.forEach((client) => {
      map.set(client.id, client)
    })
    return map
  }, [thirdParties])

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Filtre par recherche (référence, client)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((order: Order) => {
        const ref = order.ref || `CMD-${order.id}` || ""
        const client = clientsMap.get(order.socid)
        const clientName = client?.name || client?.nom || ""
        return (
          ref.toLowerCase().includes(query) ||
          clientName.toLowerCase().includes(query)
        )
      })
    }

    // Filtre par statut
    if (statusFilter === "draft") {
      result = result.filter((order: Order) => order.status === 0 || !order.status)
    } else if (statusFilter === "validated") {
      result = result.filter((order: Order) => order.status === 1)
    }

    // Filtre par date
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate: Date
      let endDate: Date = endOfMonth(now)

      if (dateFilter === "thisMonth") {
        startDate = startOfMonth(now)
      } else if (dateFilter === "lastMonth") {
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
      } else if (dateFilter === "last3Months") {
        startDate = startOfMonth(subMonths(now, 2))
      }

      result = result.filter((order: Order) => {
        const orderDate = order.date_commande || order.date_creation || order.date
        if (!orderDate) return false
        const date = new Date(orderDate * 1000)
        return isWithinInterval(date, { start: startDate!, end: endDate })
      })
    }

    // Filtre par client
    if (clientFilter) {
      result = result.filter((order: Order) => order.socid === clientFilter)
    }

    return result
  }, [orders, searchQuery, statusFilter, dateFilter, clientFilter, clientsMap])

  // Limiter l'affichage à 25 éléments
  const displayedOrders = useMemo(() => {
    return limitForDisplay(filteredOrders)
  }, [filteredOrders])

  const renderOrder = ({ item }: { item: Order }) => {
    const client = clientsMap.get(item.socid)
    const orderDate = item.date_commande || item.date_creation || item.date

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetails", { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderRef}>{item.ref || `CMD-${item.id}`}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 1 ? styles.statusValidated : styles.statusDraft,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === 1 ? "Validée" : "Brouillon"}
            </Text>
          </View>
        </View>

        {client && (
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>👤 {client.name}</Text>
          </View>
        )}

        {orderDate && (
          <Text style={styles.orderDate}>
            📅 Date: {format(new Date(orderDate * 1000), "dd/MM/yyyy")}
          </Text>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            Total: {formatPriceWithCurrency(item.total_ttc)}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => reload()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <View style={styles.container}>
        <WaveFAB />
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par référence ou client..."
            placeholderTextColor="#8A98AD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CreateOrder")}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Barre de filtres */}
        <View style={styles.filtersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
            {/* Filtre par statut */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Filtrer par statut",
                  "Choisissez un statut",
                  [
                    { text: "Tous", onPress: () => setStatusFilter("all") },
                    { text: "Brouillon", onPress: () => setStatusFilter("draft") },
                    { text: "Validée", onPress: () => setStatusFilter("validated") },
                    { text: "Annuler", style: "cancel" },
                  ],
                )
              }}
            >
              <Text style={styles.filterButtonText}>
                {statusFilter === "all"
                  ? "Statut: Tous"
                  : statusFilter === "draft"
                    ? "Statut: Brouillon"
                    : "Statut: Validée"}
              </Text>
            </TouchableOpacity>

            {/* Filtre par date */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Filtrer par date",
                  "Choisissez une période",
                  [
                    { text: "Toutes", onPress: () => setDateFilter("all") },
                    { text: "Ce mois", onPress: () => setDateFilter("thisMonth") },
                    { text: "Mois dernier", onPress: () => setDateFilter("lastMonth") },
                    { text: "3 derniers mois", onPress: () => setDateFilter("last3Months") },
                    { text: "Annuler", style: "cancel" },
                  ],
                )
              }}
            >
              <Text style={styles.filterButtonText}>
                {dateFilter === "all"
                  ? "Date: Toutes"
                  : dateFilter === "thisMonth"
                    ? "Date: Ce mois"
                    : dateFilter === "lastMonth"
                      ? "Date: Mois dernier"
                      : "Date: 3 mois"}
              </Text>
            </TouchableOpacity>

            {/* Filtre par client */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Filtrer par client",
                  "Choisissez un client",
                  [
                    { text: "Tous", onPress: () => setClientFilter(undefined) },
                    ...thirdParties.slice(0, 10).map((client) => ({
                      text: client.name,
                      onPress: () => setClientFilter(client.id),
                    })),
                    { text: "Annuler", style: "cancel" },
                  ],
                )
              }}
            >
              <Text style={styles.filterButtonText}>
                {clientFilter
                  ? `Client: ${clientsMap.get(clientFilter)?.name || "Inconnu"}`
                  : "Client: Tous"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Afficher les commandes dès qu'elles arrivent, même si loading est encore true */}
        {loading && orders.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0B5FFF" />
            <Text style={styles.loadingText}>Chargement des commandes...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedOrders}
            renderItem={renderOrder}
            keyExtractor={(item, index) => item.id ? String(item.id) : `order-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune commande disponible</Text>
              </View>
            }
            ListFooterComponent={
              filteredOrders.length > displayedOrders.length ? (
                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>
                    {formatDisplayCount(displayedOrders.length, filteredOrders.length, "commandes")}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
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
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0B5FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  filtersBar: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    paddingVertical: 12,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#5C6B82",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour le WaveFAB au-dessus du footer
  },
  orderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderRef: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusValidated: {
    backgroundColor: "#4CAF50",
  },
  statusDraft: {
    backgroundColor: "#FF9800",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  clientInfo: {
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    color: "#5C6B82",
    fontWeight: "500",
  },
  orderDate: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 8,
  },
  orderFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 27, 46, 0.08)",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B5FFF",
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
  errorText: {
    fontSize: 16,
    color: "#FF7A2F",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8A98AD",
  },
  footerInfo: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#5C6B82",
    fontStyle: "italic",
  },
})
