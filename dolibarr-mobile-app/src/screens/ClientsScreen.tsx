import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from "react-native"
import { useThirdParties } from "../hooks/useDolibarr"
import { ThirdPartiesAPI } from "../api/thirdparties"
import { useCategories } from "../contexts/CategoriesContext"
import type { ThirdParty } from "../types/dolibarr.types"
import EmptyState from "../components/EmptyState"
import Loader from "../components/Loader"
import ClientMapView from "../components/ClientMapView"
import { Ionicons } from "@expo/vector-icons"
import { limitForDisplay, formatDisplayCount } from "../utils/apiHelpers"
import WaveFAB from "../components/WaveFAB"

type ViewMode = "list" | "map"
type SortMode = "alphabetical" | "department" | "none"

export default function ClientsScreen({ navigation }: any) {
  const { thirdParties, loading, error, reload } = useThirdParties("customer")
  const { customerCategories } = useCategories()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortMode, setSortMode] = useState<SortMode>("none") // Par défaut, conserver le tri par date de l'API
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)
  const [searchResults, setSearchResults] = useState<ThirdParty[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [focusedClientId, setFocusedClientId] = useState<string | null>(null)
  const [clientCategoriesMap, setClientCategoriesMap] = useState<Map<string, any[]>>(new Map())

  // Utiliser les catégories customers préchargées comme tags
  const tags = useMemo(() => {
    return customerCategories.map((cat: any) => ({
      id: String(cat.id || cat.rowid),
      label: cat.label || cat.name || String(cat),
    }))
  }, [customerCategories])

  // Recherche via API si query > 2 caractères
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 2) {
        setSearchLoading(true)
        try {
          const results = await ThirdPartiesAPI.search(searchQuery.trim())
          setSearchResults(results)
        } catch (err: any) {
          console.warn("Erreur lors de la recherche:", err.message)
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
      }
    }

    const timeoutId = setTimeout(performSearch, 300) // Debounce 300ms
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Filtrer et trier les clients
  const filteredClients = useMemo(() => {
    // Utiliser les résultats de recherche si disponible, sinon utiliser thirdParties
    let result = searchQuery.trim().length > 2 && searchResults.length > 0 
      ? [...searchResults] 
      : [...thirdParties]
    
    // Dédupliquer par ID pour éviter les clés dupliquées
    const seenIds = new Set<string | number>()
    result = result.filter(client => {
      if (!client.id) return true // Garder les clients sans ID
      if (seenIds.has(client.id)) return false // Exclure les doublons
      seenIds.add(client.id)
      return true
    })

    // Si recherche courte (< 3 caractères), filtrer côté client
    if (searchQuery.trim().length > 0 && searchQuery.trim().length <= 2) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.code_client?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query) ||
          client.town?.toLowerCase().includes(query),
      )
    }

    // Filtre par catégorie (tags = catégories clients)
    if (selectedTag) {
      result = result.filter((client: any) => {
        const clientId = String(client.id)
        const categories = clientCategoriesMap.get(clientId) || client.tags || []
        if (!categories || !Array.isArray(categories)) return false
        return categories.some((cat: any) => {
          const catId = cat.id || cat.label || cat.rowid || String(cat)
          return String(catId) === selectedTag
        })
      })
    }

    // Tri
    if (sortMode === "alphabetical") {
      result.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || ""
        const nameB = b.name?.toLowerCase() || ""
        return nameA.localeCompare(nameB)
      })
    } else if (sortMode === "department") {
      result.sort((a, b) => {
        const deptA = a.zip?.substring(0, 2) || ""
        const deptB = b.zip?.substring(0, 2) || ""
        if (deptA !== deptB) {
          return deptA.localeCompare(deptB)
        }
        // Si même département, trier par nom
        const nameA = a.name?.toLowerCase() || ""
        const nameB = b.name?.toLowerCase() || ""
        return nameA.localeCompare(nameB)
      })
    }

    return result
  }, [thirdParties, searchQuery, selectedTag, sortMode, searchResults, clientCategoriesMap])

  const focusedClient = useMemo(
    () => filteredClients.find((client) => client.id === focusedClientId),
    [filteredClients, focusedClientId],
  )
  const focusedClientAddressParts = useMemo(() => {
    if (!focusedClient) return []
    return [focusedClient.address, focusedClient.zip, focusedClient.town].filter(Boolean)
  }, [focusedClient])

  useEffect(() => {
    if (viewMode === "map" && !focusedClientId && filteredClients.length > 0) {
      setFocusedClientId(filteredClients[0].id)
    }
  }, [viewMode, filteredClients, focusedClientId])

  useEffect(() => {
    if (viewMode !== "map" && focusedClientId) {
      setFocusedClientId(null)
    }
  }, [viewMode, focusedClientId])

  useEffect(() => {
    if (focusedClientId && !filteredClients.some((client) => client.id === focusedClientId)) {
      setFocusedClientId(null)
    }
  }, [filteredClients, focusedClientId])

  // Charger les catégories de chaque client en batch
  useEffect(() => {
    const loadCategories = async () => {
      if (thirdParties.length === 0) return
      const map = new Map<string, any[]>()
      for (let i = 0; i < thirdParties.length; i += 10) {
        const batch = thirdParties.slice(i, i + 10)
        const promises = batch.map(async (client: any) => {
          try {
            const categories = await ThirdPartiesAPI.getCategories(client.id)
            if (categories.length > 0) {
              map.set(String(client.id), categories)
            }
          } catch {
            // ignorer
          }
        })
        await Promise.allSettled(promises)
        setClientCategoriesMap((prev) => {
          const merged = new Map(prev)
          map.forEach((value, key) => merged.set(key, value))
          return merged
        })
      }
    }
    loadCategories()
  }, [thirdParties])

  const handleDelete = (client: ThirdParty) => {
    Alert.alert(
      "Supprimer le client",
      `Êtes-vous sûr de vouloir supprimer ${client.name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await ThirdPartiesAPI.delete(client.id)
            if (result.success) {
              Alert.alert("Succès", "Client supprimé avec succès")
              reload()
            } else {
              console.warn("⚠️ Erreur lors de la suppression du client:", result.error || "Erreur inconnue")
            }
          },
        },
      ],
    )
  }

  const renderClient = ({ item }: { item: ThirdParty }) => {
    return (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => {
        navigation.navigate("EditClient", {
          mode: "edit",
          client: item,
          onSave: () => {
            reload()
          },
        })
      }}
      activeOpacity={0.7}
    >
      <View style={styles.clientInfo}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.name}</Text>
          {item.code_client && (
            <Text style={styles.clientCode}>{item.code_client}</Text>
          )}
        </View>

        {item.email && (
          <View style={styles.clientDetail}>
            <Ionicons name="mail-outline" size={14} color="#5C6B82" />
            <Text style={styles.clientDetailText}>{item.email}</Text>
          </View>
        )}

        {item.phone && (
          <View style={styles.clientDetail}>
            <Ionicons name="call-outline" size={14} color="#5C6B82" />
            <Text style={styles.clientDetailText}>{item.phone}</Text>
          </View>
        )}

        {(item.address || item.town) && (
          <View style={styles.clientDetail}>
            <Ionicons name="location-outline" size={14} color="#5C6B82" />
            <Text style={styles.clientDetailText}>
              {item.address ? `${item.address}, ` : ""}
              {item.zip} {item.town}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.clientActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            navigation.navigate("EditClient", {
              mode: "edit",
              client: item,
            })
          }}
        >
          <Ionicons name="create-outline" size={18} color="#0B5FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#D84343" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    )
  }

  if (loading && thirdParties.length === 0) {
    return <Loader message="Chargement des clients..." />
  }

  if (error && thirdParties.length === 0) {
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
        {/* Header avec recherche et boutons */}
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            placeholderTextColor="#8A98AD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              navigation.navigate("EditClient", {
                mode: "create",
              })
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Barre de contrôles : Vue, Tri, Tags */}
        <View style={styles.controlsBar}>
        {/* Toggle Vue Liste/Carte */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === "list" && styles.toggleButtonActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={{ fontSize: 16, marginRight: 4, color: viewMode === "list" ? "#fff" : "#5C6B82" }}>
              📋
            </Text>
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === "list" && styles.toggleButtonTextActive,
              ]}
            >
              Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === "map" && styles.toggleButtonActive]}
            onPress={() => setViewMode("map")}
          >
            <Text style={{ fontSize: 16, marginRight: 4, color: viewMode === "map" ? "#fff" : "#5C6B82" }}>
              🗺️
            </Text>
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === "map" && styles.toggleButtonTextActive,
              ]}
            >
              Carte
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Tri */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            Alert.alert(
              "Trier par",
              "Choisissez un mode de tri",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Alphabétique",
                  onPress: () => setSortMode("alphabetical"),
                },
                {
                  text: "Département",
                  onPress: () => setSortMode("department"),
                },
                {
                  text: "Aucun tri",
                  onPress: () => setSortMode("none"),
                },
              ],
            )
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 4, color: "#5C6B82" }}>⇅</Text>
          <Text style={styles.sortButtonText}>
            {sortMode === "alphabetical"
              ? "A-Z"
              : sortMode === "department"
                ? "Dépt"
                : "Tri"}
          </Text>
        </TouchableOpacity>
      </View>

        {/* Barre de tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
              <TouchableOpacity
                style={[styles.tagChip, !selectedTag && styles.tagChipActive]}
                onPress={() => setSelectedTag(undefined)}
              >
                <Text
                  style={[styles.tagChipText, !selectedTag && styles.tagChipTextActive]}
                >
                  Tous
                </Text>
              </TouchableOpacity>
              {tags.map((tag, tagIndex) => (
                <TouchableOpacity
                  key={`tag-${tag.id}-${tagIndex}`}
                  style={[styles.tagChip, selectedTag === tag.id && styles.tagChipActive]}
                  onPress={() => setSelectedTag(selectedTag === tag.id ? undefined : tag.id)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selectedTag === tag.id && styles.tagChipTextActive,
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contenu : Liste ou Carte */}
        {filteredClients.length === 0 ? (
          <EmptyState
            icon="👥"
            title={searchQuery ? "Aucun client trouvé" : "Aucun client"}
            message={
              searchQuery
                ? "Essayez une autre recherche"
                : "Ajoutez votre premier client"
            }
            actionLabel="Ajouter un client"
            onAction={() => {
              navigation.navigate("EditClient", {
                mode: "create",
              })
            }}
          />
        ) : viewMode === "map" ? (
          <>
            {focusedClient && (
              <View style={styles.focusedClientBanner}>
                <Text style={styles.focusedClientLabel}>Client mis en avant</Text>
                <Text style={styles.focusedClientName}>
                  {focusedClient.name}
                </Text>
                <Text style={styles.focusedClientAddress}>
                  {focusedClientAddressParts.length > 0
                    ? focusedClientAddressParts.join(" · ")
                    : "Adresse indisponible"}
                </Text>
              </View>
            )}
            <ClientMapView
              clients={filteredClients}
              onClientPress={(client: ThirdParty) => setFocusedClientId(client.id)}
            />
          </>
        ) : (
          <FlatList
            data={limitForDisplay(filteredClients)}
            renderItem={renderClient}
            keyExtractor={(item, index) => {
              // Garantir une clé unique même si l'ID est dupliqué ou manquant
              const baseKey = item.id ? String(item.id) : `client-no-id-${index}`
              return `${baseKey}-${index}`
            }}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            ListFooterComponent={
              filteredClients.length > limitForDisplay(filteredClients).length ? (
                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>
                    {formatDisplayCount(limitForDisplay(filteredClients).length, filteredClients.length, "clients")}
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
  controlsBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    gap: 12,
    alignItems: "center",
  },
  focusedClientBanner: {
    margin: 16,
    marginTop: 0,
    borderRadius: 14,
    backgroundColor: "rgba(11, 95, 255, 0.1)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.3)",
  },
  focusedClientLabel: {
    fontSize: 12,
    color: "#0B5FFF",
    marginBottom: 4,
    fontWeight: "600",
  },
  focusedClientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  focusedClientAddress: {
    fontSize: 12,
    color: "#5C6B82",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 2,
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#0B5FFF",
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#5C6B82",
    fontWeight: "500",
  },
  toggleButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#5C6B82",
    fontWeight: "500",
  },
  tagsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    paddingVertical: 12,
  },
  tagsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  tagChipText: {
    fontSize: 14,
    color: "#5C6B82",
    fontWeight: "500",
  },
  tagChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour le WaveFAB au-dessus du footer
  },
  clientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0E1B2E",
    flex: 1,
  },
  clientCode: {
    fontSize: 12,
    color: "#5C6B82",
    backgroundColor: "rgba(14, 27, 46, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clientDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  clientDetailText: {
    fontSize: 14,
    color: "#5C6B82",
    flex: 1,
  },
  clientActions: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    marginLeft: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.2)",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(216, 67, 67, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(216, 67, 67, 0.2)",
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
