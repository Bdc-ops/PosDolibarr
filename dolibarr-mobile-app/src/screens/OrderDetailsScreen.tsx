import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native"
import { OrdersAPI } from "../api/orders"
import type { Order } from "../types/dolibarr.types"
import { format } from "date-fns"
import { formatPriceWithCurrency } from "../utils/formatPrice"

interface OrderDetailsScreenProps {
  route?: {
    params?: {
      orderId?: string
    }
  }
  navigation?: any
}

export default function OrderDetailsScreen({
  route,
  navigation,
}: OrderDetailsScreenProps = {}) {
  const orderId = route?.params?.orderId
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    } else {
      setError("ID de commande manquant")
      setLoading(false)
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) {
      setError("ID de commande manquant")
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const data = await OrdersAPI.getById(orderId)
      setOrder(data)
    } catch (err: any) {
      setError(err?.message || "Impossible de charger la commande")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSecondary} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0B5FFF" />
          <Text style={styles.loadingText}>Chargement de la commande...</Text>
        </View>
      </View>
    )
  }

  if (error || !order) {
    return (
      <View style={styles.screen}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSecondary} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error || "Commande introuvable"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const orderDate = order.date_commande || order.date_creation || order.date

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.orderRef}>{order.ref || `CMD-${order.id}`}</Text>
            <View
              style={[
                styles.statusBadge,
                order.status === 1 ? styles.statusValidated : styles.statusDraft,
              ]}
            >
              <Text style={styles.statusText}>
                {order.status === 1 ? "Validée" : "Brouillon"}
              </Text>
            </View>
          </View>
          {orderDate && (
            <Text style={styles.orderDate}>
              Date: {format(new Date(orderDate * 1000), "dd/MM/yyyy")}
            </Text>
          )}
        </View>

        {/* Lignes de commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          {order.lines && order.lines.length > 0 ? (
            order.lines.map((line, index) => (
              <View key={index} style={styles.lineItem}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineLabel}>
                    {line.product_label || line.desc || "Produit"}
                  </Text>
                  {line.product_ref && (
                    <Text style={styles.lineRef}>{line.product_ref}</Text>
                  )}
                </View>
                <View style={styles.lineDetails}>
                  <Text style={styles.lineQty}>Qté: {line.qty}</Text>
                  <Text style={styles.linePrice}>
                    Prix unitaire: {formatPriceWithCurrency(line.subprice)}
                  </Text>
                </View>
                <View style={styles.lineTotal}>
                  <Text style={styles.lineTotalLabel}>Total HT:</Text>
                  <Text style={styles.lineTotalValue}>
                    {formatPriceWithCurrency(line.total_ht)}
                  </Text>
                </View>
                {line.tva_tx && line.tva_tx > 0 && (
                  <View style={styles.lineTotal}>
                    <Text style={styles.lineTotalLabel}>TVA ({line.tva_tx}%):</Text>
                    <Text style={styles.lineTotalValue}>
                      {formatPriceWithCurrency(line.total_tva)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noLinesText}>Aucune ligne</Text>
          )}
        </View>

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>
              {formatPriceWithCurrency(order.total_ht)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA:</Text>
            <Text style={styles.totalValue}>
              {formatPriceWithCurrency(order.total_tva)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total TTC:</Text>
            <Text style={styles.totalValueFinal}>
              {formatPriceWithCurrency(order.total_ttc)}
            </Text>
          </View>
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
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderRef: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusValidated: {
    backgroundColor: "#4CAF50",
  },
  statusDraft: {
    backgroundColor: "#FF9800",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 16,
    color: "#5C6B82",
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1B2E",
    marginBottom: 12,
  },
  lineItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    marginBottom: 8,
  },
  lineHeader: {
    marginBottom: 8,
  },
  lineLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  lineRef: {
    fontSize: 14,
    color: "#5C6B82",
    marginTop: 4,
  },
  lineDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  lineQty: {
    fontSize: 14,
    color: "#5C6B82",
  },
  linePrice: {
    fontSize: 14,
    color: "#5C6B82",
  },
  lineTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  lineTotalLabel: {
    fontSize: 14,
    color: "#5C6B82",
  },
  lineTotalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  noLinesText: {
    fontSize: 14,
    color: "#8A98AD",
    fontStyle: "italic",
  },
  totalsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: "#0B5FFF",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#5C6B82",
  },
  totalValue: {
    fontSize: 16,
    color: "#0E1B2E",
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0E1B2E",
  },
  totalValueFinal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B5FFF",
  },
})

