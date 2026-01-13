import React from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import type { Product } from "../types/dolibarr.types"
import { formatPriceWithCurrency } from "../utils/formatPrice"

interface ProductCardProps {
  product: Product
  categories?: any[] // Catégories chargées via l'API
  onPress?: () => void
}

export default function ProductCard({ product, categories = [], onPress }: ProductCardProps) {
  const getStockStatus = (stock: number | undefined) => {
    if (!stock || stock === 0) return { label: "Rupture", color: "#D84343", bg: "rgba(216, 67, 67, 0.12)" }
    if (stock < 10) return { label: "Stock faible", color: "#FF7A2F", bg: "rgba(255, 122, 47, 0.14)" }
    return { label: "En stock", color: "#2E7D32", bg: "rgba(46, 125, 50, 0.12)" }
  }

  const stockStatus = getStockStatus(product.stock_reel)

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image produit */}
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
          <Text style={styles.ref}>{product.ref || "N/A"}</Text>
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

        <Text style={styles.label} numberOfLines={2}>
          {product.label || "Sans nom"}
        </Text>

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        {/* Catégories */}
        {categories && categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.slice(0, 3).map((cat: any, index: number) => {
              const catLabel = cat.label || cat.name || cat.libelle || String(cat)
              return (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{catLabel}</Text>
                </View>
              )
            })}
            {categories.length > 3 && (
              <Text style={styles.categoryMore}>+{categories.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix HT</Text>
            <Text style={styles.price}>{formatPriceWithCurrency(product.price)}</Text>
          </View>

          <View
            style={[
              styles.stockBadge,
              { backgroundColor: stockStatus.bg },
            ]}
          >
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {stockStatus.label}
            </Text>
            <Text style={[styles.stockValue, { color: stockStatus.color }]}>
              {product.stock_reel || 0}
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
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: 160,
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
    fontSize: 48,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ref: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 10,
    fontWeight: "600",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 27, 46, 0.08)",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: "#5C6B82",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B5FFF",
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: "#0B5FFF",
    fontWeight: "500",
  },
  categoryMore: {
    fontSize: 11,
    color: "#5C6B82",
    fontStyle: "italic",
    alignSelf: "center",
  },
})
