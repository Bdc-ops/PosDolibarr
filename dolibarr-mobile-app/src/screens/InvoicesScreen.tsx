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
import { useInvoices, useThirdParties } from "../hooks/useDolibarr"
import type { Invoice, ThirdParty } from "../types/dolibarr.types"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"
import { formatPriceWithCurrency } from "../utils/formatPrice"
import { limitForDisplay, formatDisplayCount } from "../utils/apiHelpers"
import WaveFAB from "../components/WaveFAB"

type StatusFilter = "all" | "draft" | "validated" | "paid" | "unpaid"
type DateFilter = "all" | "thisMonth" | "lastMonth" | "last3Months"

export default function InvoicesScreen({ navigation }: any) {
  const { invoices, loading, error, reload } = useInvoices()
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

  // Filtrer les factures
  const filteredInvoices = useMemo(() => {
    let result = [...invoices]

    // Filtre par recherche (référence, client)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((invoice: Invoice) => {
        const ref = invoice.ref || `FAC-${invoice.id}` || ""
        const client = clientsMap.get(invoice.socid)
        const clientName = client?.name || client?.nom || ""
        return (
          ref.toLowerCase().includes(query) ||
          clientName.toLowerCase().includes(query)
        )
      })
    }

    // Filtre par statut
    if (statusFilter === "draft") {
      result = result.filter((invoice: Invoice) => invoice.status === "0")
    } else if (statusFilter === "validated") {
      result = result.filter((invoice: Invoice) => invoice.status === "1")
    } else if (statusFilter === "paid") {
      result = result.filter((invoice: Invoice) => invoice.paye === "1" || invoice.status === "2")
    } else if (statusFilter === "unpaid") {
      result = result.filter(
        (invoice: Invoice) => invoice.paye !== "1" && invoice.status !== "2",
      )
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

      result = result.filter((invoice: Invoice) => {
        if (!invoice.date) return false
        const date = new Date(invoice.date * 1000)
        return isWithinInterval(date, { start: startDate!, end: endDate })
      })
    }

    // Filtre par client
    if (clientFilter) {
      result = result.filter((invoice: Invoice) => invoice.socid === clientFilter)
    }

    return result
  }, [invoices, searchQuery, statusFilter, dateFilter, clientFilter, clientsMap])

  // Limiter l'affichage à 25 éléments
  const displayedInvoices = useMemo(() => {
    return limitForDisplay(filteredInvoices)
  }, [filteredInvoices])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "0":
        return "#FF9800" // Brouillon
      case "1":
        return "#2196F3" // Validée
      case "2":
        return "#4CAF50" // Payée
      case "3":
        return "#F44336" // Abandonnée
      default:
        return "#999"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "0":
        return "Brouillon"
      case "1":
        return "Validée"
      case "2":
        return "Payée"
      case "3":
        return "Abandonnée"
      default:
        return "Inconnu"
    }
  }

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const client = clientsMap.get(item.socid)
    const isPaid = item.paye === "1" || item.status === "2"

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: item.id })}
      >
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceRef}>{item.ref || `FAC-${item.id}`}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status || "0") },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(item.status || "0")}
            </Text>
          </View>
        </View>

        {client && (
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>👤 {client.name}</Text>
          </View>
        )}

        {item.date && (
          <Text style={styles.invoiceDate}>
            📅 Date: {format(new Date(item.date * 1000), "dd/MM/yyyy")}
          </Text>
        )}

        {item.date_echeance && (
          <Text style={styles.invoiceDueDate}>
            ⏰ Échéance: {format(new Date(item.date_echeance * 1000), "dd/MM/yyyy")}
          </Text>
        )}

        <View style={styles.invoiceFooter}>
          <Text style={styles.invoiceTotal}>
            Total: {formatPriceWithCurrency(item.total_ttc)}
          </Text>
          {isPaid ? (
            <Text style={styles.paidBadge}>Payée</Text>
          ) : (
            <Text style={styles.unpaidBadge}>Impayée</Text>
          )}
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
                    { text: "Payée", onPress: () => setStatusFilter("paid") },
                    { text: "Impayée", onPress: () => setStatusFilter("unpaid") },
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
                    : statusFilter === "validated"
                      ? "Statut: Validée"
                      : statusFilter === "paid"
                        ? "Statut: Payée"
                        : "Statut: Impayée"}
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

        {/* Afficher les factures dès qu'elles arrivent, même si loading est encore true */}
        {loading && invoices.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0B5FFF" />
            <Text style={styles.loadingText}>Chargement des factures...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedInvoices}
            renderItem={renderInvoice}
            keyExtractor={(item, index) => item.id ? String(item.id) : `invoice-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune facture disponible</Text>
              </View>
            }
            ListFooterComponent={
              filteredInvoices.length > displayedInvoices.length ? (
                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>
                    {formatDisplayCount(displayedInvoices.length, filteredInvoices.length, "factures")}
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
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
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
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invoiceRef: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  invoiceDate: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 4,
  },
  invoiceDueDate: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 8,
  },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 27, 46, 0.08)",
  },
  invoiceTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B5FFF",
  },
  paidBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unpaidBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF7A2F",
    backgroundColor: "rgba(255, 122, 47, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
