import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native"

export interface FilterOptions {
  searchQuery: string
  stockFilter: "all" | "in_stock" | "low_stock" | "out_of_stock"
  categoryFilter?: string
  tagFilter?: string
  availabilityFilter: "all" | "available" | "unavailable" // Produits disponibles ou non
}

interface FilterBarProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  categories?: Array<{ id: string; label: string }>
  tags?: Array<{ id: string; label: string }>
}

export default function FilterBar({
  filters,
  onFiltersChange,
  categories = [],
  tags = [],
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const getStockFilterLabel = () => {
    switch (filters.stockFilter) {
      case "in_stock":
        return "En stock"
      case "low_stock":
        return "Stock faible"
      case "out_of_stock":
        return "Rupture"
      default:
        return "Tous"
    }
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.stockFilter !== "all" ||
    filters.categoryFilter ||
    filters.tagFilter ||
    filters.availabilityFilter !== "all"

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor="#8A98AD"
          value={filters.searchQuery}
          onChangeText={(text) => updateFilter("searchQuery", text)}
        />
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>🔍</Text>
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Modal des filtres */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filtre par stock */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Stock</Text>
                {["all", "in_stock", "low_stock", "out_of_stock"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.stockFilter === option && styles.filterOptionActive,
                    ]}
                    onPress={() => updateFilter("stockFilter", option)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.stockFilter === option && styles.filterOptionTextActive,
                      ]}
                    >
                      {option === "all"
                        ? "Tous"
                        : option === "in_stock"
                          ? "En stock"
                          : option === "low_stock"
                            ? "Stock faible"
                            : "Rupture"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtre par disponibilité */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Disponibilité</Text>
                {["all", "available", "unavailable"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.availabilityFilter === option && styles.filterOptionActive,
                    ]}
                    onPress={() => updateFilter("availabilityFilter", option)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.availabilityFilter === option && styles.filterOptionTextActive,
                      ]}
                    >
                      {option === "all"
                        ? "Tous"
                        : option === "available"
                          ? "Disponibles"
                          : "Non disponibles"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtre par catégorie */}
              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Catégorie</Text>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !filters.categoryFilter && styles.filterOptionActive,
                    ]}
                    onPress={() => updateFilter("categoryFilter", undefined)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        !filters.categoryFilter && styles.filterOptionTextActive,
                      ]}
                    >
                      Toutes les catégories
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={`category-${category.id}-${index}`}
                      style={[
                        styles.filterOption,
                        filters.categoryFilter === category.id &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() => updateFilter("categoryFilter", category.id)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.categoryFilter === category.id &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Filtre par tag */}
              {tags.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tag</Text>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !filters.tagFilter && styles.filterOptionActive,
                    ]}
                    onPress={() => updateFilter("tagFilter", undefined)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        !filters.tagFilter && styles.filterOptionTextActive,
                      ]}
                    >
                      Tous les tags
                    </Text>
                  </TouchableOpacity>
                  {tags.map((tag, index) => (
                    <TouchableOpacity
                      key={`tag-${tag.id}-${index}`}
                      style={[
                        styles.filterOption,
                        filters.tagFilter === tag.id && styles.filterOptionActive,
                      ]}
                      onPress={() => updateFilter("tagFilter", tag.id)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.tagFilter === tag.id && styles.filterOptionTextActive,
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Bouton réinitialiser */}
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  onFiltersChange({
                    searchQuery: "",
                    stockFilter: "all",
                    categoryFilter: undefined,
                    tagFilter: undefined,
                    availabilityFilter: "all",
                  })
                  setShowFilters(false)
                }}
              >
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginRight: 8,
    color: "#0E1B2E",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  filterButtonText: {
    fontSize: 20,
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7A2F",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F7F9FC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  modalClose: {
    fontSize: 24,
    color: "#5C6B82",
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 12,
  },
  filterOption: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  filterOptionActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#0E1B2E",
  },
  filterOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  resetButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(255, 122, 47, 0.12)",
    borderRadius: 12,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#FF7A2F",
    fontWeight: "600",
  },
})
