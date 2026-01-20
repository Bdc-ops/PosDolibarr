import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native"
import { useProducts } from "../hooks/useDolibarr"
import { ProductsAPI } from "../api/products"
import { CategoriesAPI } from "../api/categories"
import { useCategories } from "../contexts/CategoriesContext"
import type { Product } from "../types/dolibarr.types"
import ProductCard from "../components/ProductCard"
import ProductCardList from "../components/ProductCardList"
import FilterBar, { type FilterOptions } from "../components/FilterBar"
import Loader from "../components/Loader"
import EmptyState from "../components/EmptyState"
import { limitForDisplay, formatDisplayCount } from "../utils/apiHelpers"
import WaveFAB from "../components/WaveFAB"

type ViewMode = "list" | "grid"

const { width } = Dimensions.get("window")

export default function ProductsScreen({ navigation }: any) {
  const { products, loading, error, reload } = useProducts(false)
  const { productCategories } = useCategories()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    stockFilter: "all",
    categoryFilter: undefined,
    tagFilter: undefined,
    availabilityFilter: "all",
  })
  const [localProductCategoriesMap, setLocalProductCategoriesMap] = useState<Map<string, any[]>>(new Map())

  useEffect(() => {
    // Recharger les produits quand le filtre de catégorie change
    if (filters.categoryFilter) {
      reload(filters.categoryFilter)
    } else {
      reload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categoryFilter])

  // Charger les catégories des produits en utilisant les catégories préchargées
  useEffect(() => {
    const loadProductCategories = async () => {
      if (products.length === 0 || productCategories.length === 0) return
      
      // Charger les catégories pour chaque produit (via /products/{id}/categories)
      // et les mapper avec les catégories préchargées
      const newMap = new Map<string, any[]>()
      
      // Charger en batch de 10 pour être plus rapide
      for (let i = 0; i < products.length; i += 10) {
        const batch = products.slice(i, i + 10)
        const promises = batch.map(async (product: any) => {
          try {
            const productId = String(product.id)
            const productCats = await CategoriesAPI.getProductCategoriesById(productId)
            
            // Mapper les catégories avec les catégories préchargées
            const mappedCategories = productCats
              .map((cat: any) => {
                // Trouver la catégorie correspondante dans les catégories préchargées
                const fullCategory = productCategories.find(
                  (c: any) => String(c.id) === String(cat.id) || String(c.rowid) === String(cat.id)
                )
                return fullCategory || cat
              })
              .filter(Boolean)
            
            if (mappedCategories.length > 0) {
              newMap.set(productId, mappedCategories)
            }
          } catch (err: any) {
            // Erreur silencieuse - produit sans catégories
          }
        })
        
        await Promise.allSettled(promises)
        // Mettre à jour progressivement
        setLocalProductCategoriesMap(prev => {
          const merged = new Map(prev)
          newMap.forEach((value, key) => merged.set(key, value))
          return merged
        })
      }
      
    }
    
    loadProductCategories()
  }, [products, productCategories])

  // Utiliser les catégories préchargées directement
  const categories = useMemo(() => {
    return productCategories.map((cat: any) => ({
      id: String(cat.id || cat.rowid),
      label: cat.label || cat.name || String(cat),
    }))
  }, [productCategories])

  const tags = useMemo(() => {
    const tagMap = new Map<string, string>()
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag: { id: string; label: string }) => {
          if (tag.id && tag.label) {
            tagMap.set(tag.id, tag.label)
          }
        })
      }
    })
    return Array.from(tagMap.entries()).map(([id, label]) => ({ id, label }))
  }, [products])

  // Filtrer les produits selon les critères
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Filtre par recherche
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.label?.toLowerCase().includes(query) ||
          p.ref?.toLowerCase().includes(query),
      )
    }

    // Filtre par disponibilité (status)
    if (filters.availabilityFilter !== "all") {
      result = result.filter((p) => {
        const isAvailable = p.status === "1" // 1 = actif/disponible
        return filters.availabilityFilter === "available" ? isAvailable : !isAvailable
      })
    }

    // Filtre par stock
    if (filters.stockFilter !== "all") {
      result = result.filter((p) => {
        const stock = p.stock_reel || 0
        switch (filters.stockFilter) {
          case "in_stock":
            return stock > 10
          case "low_stock":
            return stock > 0 && stock <= 10
          case "out_of_stock":
            return stock === 0
          default:
            return true
        }
      })
    }

    // Le filtrage par catégorie est maintenant fait côté API, pas besoin de filtrer ici
    // Les produits sont déjà filtrés par l'API quand categoryFilter est défini

    // Filtre par tag
    if (filters.tagFilter) {
      result = result.filter((p) => {
        if (!p.tags || !Array.isArray(p.tags)) return false
        return p.tags.some((tag: { id: string; label: string }) => tag.id === filters.tagFilter)
      })
    }

    return result
  }, [products, filters, localProductCategoriesMap])

  const handleRefresh = async () => {
    await reload()
  }

  // Afficher les produits dès qu'ils sont chargés (même si loading est encore true)
  // Ne bloquer que si vraiment aucune donnée et en cours de chargement
  if (loading && products.length === 0 && !error) {
    return <Loader message="Chargement des produits..." />
  }

  // Afficher les produits même s'il y a une erreur si on a des données en cache
  if (error && products.length === 0) {
    return (
      <EmptyState
        icon="⚠️"
        title="Erreur de chargement"
        message={error}
        actionLabel="Réessayer"
        onAction={reload}
      />
    )
  }
  

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <View style={styles.container}>
        <WaveFAB />
        {/* En-tête avec toggle de vue */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Produits</Text>
            <Text style={styles.headerSubtitle}>
              {filteredProducts.length} {filteredProducts.length === 1 ? "produit" : "produits"}
            </Text>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === "list" && styles.toggleButtonActive]}
              onPress={() => setViewMode("list")}
            >
              <Text style={[styles.toggleIcon, viewMode === "list" && styles.toggleIconActive]}>
                ☰
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === "grid" && styles.toggleButtonActive]}
              onPress={() => setViewMode("grid")}
            >
              <Text style={[styles.toggleIcon, viewMode === "grid" && styles.toggleIconActive]}>
                ⊞
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          tags={tags}
        />

        {/* Barre de catégories sous la recherche */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !filters.categoryFilter && styles.categoryChipActive,
              ]}
              onPress={() => setFilters({ ...filters, categoryFilter: undefined })}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !filters.categoryFilter && styles.categoryChipTextActive,
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <TouchableOpacity
                  key={`category-${category.id}-${index}`}
                  style={[
                    styles.categoryChip,
                    filters.categoryFilter === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    // Toggle: si la catégorie est déjà sélectionnée, désélectionner
                    const newFilter = filters.categoryFilter === category.id ? undefined : category.id
                    setFilters({ ...filters, categoryFilter: newFilter })
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      filters.categoryFilter === category.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))
            ) : null}
          </ScrollView>
        </View>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucun produit trouvé"
            message={
              filters.searchQuery || filters.stockFilter !== "all"
                ? "Essayez de modifier vos filtres de recherche"
                : "Aucun produit disponible"
            }
          />
        ) : (
          <FlatList
            key={viewMode} // Force le re-render quand viewMode change
            data={limitForDisplay(filteredProducts)}
            renderItem={({ item }) => {
              // Récupérer les catégories chargées pour ce produit
              const productId = String(item.id)
              const productCategories = localProductCategoriesMap.get(productId) || []
              
              if (viewMode === "list") {
                return (
                  <ProductCardList
                    product={item}
                    categories={productCategories}
                    onPress={() => {
                      // TODO: Navigation vers les détails du produit
                      console.log("Produit sélectionné:", item.id)
                    }}
                  />
                )
              }
              
              // Mode grille : wrapper avec largeur calculée
              const cardWidth = (width - 32) / 2 - 4 // 2 colonnes avec padding et gap
              return (
                <View style={{ width: cardWidth }}>
                  <ProductCard
                    product={item}
                    categories={productCategories}
                    onPress={() => {
                      // TODO: Navigation vers les détails du produit
                      console.log("Produit sélectionné:", item.id)
                    }}
                  />
                </View>
              )
            }}
            keyExtractor={(item, index) => item.id ? String(item.id) : `product-${index}`}
            contentContainerStyle={[
              styles.listContent,
              viewMode === "grid" && styles.gridContent,
            ]}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              filteredProducts.length > limitForDisplay(filteredProducts).length ? (
                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>
                    {formatDisplayCount(limitForDisplay(filteredProducts).length, filteredProducts.length, "produits")}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#5C6B82",
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  toggleButtonActive: {
    backgroundColor: "#0B5FFF",
  },
  toggleIcon: {
    fontSize: 18,
    color: "#5C6B82",
  },
  toggleIconActive: {
    color: "#fff",
  },
  categoriesContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    paddingVertical: 12,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#5C6B82",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour le WaveFAB au-dessus du footer
  },
  gridContent: {
    padding: 8,
  },
  gridRow: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
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
