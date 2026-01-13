import React from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import type { Product } from "../types/dolibarr.types"
import { formatPriceWithCurrency } from "../utils/formatPrice"

interface ProductCardListProps {
  product: Product
  categories?: any[] // Catégories chargées via l'API
  onPress?: () => void
}

export default function ProductCardList({ product, categories = [], onPress }: ProductCardListProps) {
  const getStockStatus = (stock: number | undefined) => {
    if (!stock || stock === 0) return { label: "Rupture", color: "#D84343", bg: "rgba(216, 67, 67, 0.12)" }
    if (stock < 10) return { label: "Faible", color: "#FF7A2F", bg: "rgba(255, 122, 47, 0.14)" }
    return { label: "Stock", color: "#2E7D32", bg: "rgba(46, 125, 50, 0.12)" }
  }

  const stockStatus = getStockStatus(product.stock_reel)

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image produit (petite) */}
      <View style={styles.imageContainer}>
        {product.photo ? (
          <Image source={{ uri: product.photo }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.label} numberOfLines={1}>
              {product.label || "Sans nom"}
            </Text>
            <Text style={styles.ref}>{product.ref || "N/A"}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              product.status === "1" ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {product.status === "1" ? "Actif" : "Inactif"}
            </Text>
          </View>
        </View>

        {/* Catégories */}
        {categories && categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.slice(0, 2).map((cat: any, index: number) => {
              const catLabel = cat.label || cat.name || cat.libelle || String(cat)
              return (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{catLabel}</Text>
                </View>
              )
            })}
            {categories.length > 2 && (
              <Text style={styles.categoryMore}>+{categories.length - 2}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPriceWithCurrency(product.price)}</Text>
          </View>

          <View
            style={[
              styles.stockBadge,
              { backgroundColor: stockStatus.bg },
            ]}
          >
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {stockStatus.label}: {product.stock_reel || 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: "row",
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 27, 46, 0.08)",
  },
  placeholderText: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  ref: {
    fontSize: 11,
    fontWeight: "500",
    color: "#5C6B82",
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#2E7D32",
  },
  statusInactive: {
    backgroundColor: "#8A98AD",
  },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B5FFF",
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: "#0B5FFF",
    fontWeight: "500",
  },
  categoryMore: {
    fontSize: 10,
    color: "#5C6B82",
    fontStyle: "italic",
    alignSelf: "center",
  },
})

