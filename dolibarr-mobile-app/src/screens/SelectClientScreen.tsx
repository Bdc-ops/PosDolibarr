import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { useThirdParties } from "../hooks/useDolibarr"
import { ThirdPartiesAPI } from "../api/thirdparties"
import type { ThirdParty } from "../types/dolibarr.types"
import EmptyState from "../components/EmptyState"

interface SelectClientScreenProps {
  navigation: any
  route?: {
    params?: {
      onSelectClient?: (client: ThirdParty) => void
    }
  }
}

export default function SelectClientScreen({ navigation, route }: SelectClientScreenProps) {
  const { thirdParties, loading, reload } = useThirdParties("customer")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredClients, setFilteredClients] = useState<ThirdParty[]>([])

  useEffect(() => {
    reload()
  }, [])

  // Recharger quand l'écran revient au focus (après édition)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      reload()
    })
    return unsubscribe
  }, [navigation])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = thirdParties.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.code_client?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(thirdParties)
    }
  }, [searchQuery, thirdParties])

  const handleSelectClient = (client: ThirdParty) => {
    // Passer le client via navigation params (sérialisable) au lieu d'une fonction
    // L'écran parent écoutera le focus pour récupérer le client
    navigation.navigate("CreateOrder", { selectedClient: client })
  }

  const handleAddNewClient = () => {
    navigation.navigate("EditClient", {
      mode: "create",
      // Ne pas passer de fonction dans params
      // Le client sera sélectionné après création via navigation
    })
  }

  const handleEditClient = (client: ThirdParty) => {
    navigation.navigate("EditClient", {
      mode: "edit",
      client,
      // Ne pas passer de fonction dans params
      // Recharger après retour via focus listener si nécessaire
    })
  }

  const renderClient = ({ item }: { item: ThirdParty }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => handleSelectClient(item)}
      activeOpacity={0.7}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        {item.code_client && (
          <Text style={styles.clientCode}>Code: {item.code_client}</Text>
        )}
        {item.email && <Text style={styles.clientEmail}>{item.email}</Text>}
        {item.phone && <Text style={styles.clientPhone}>{item.phone}</Text>}
        {item.address && (
          <Text style={styles.clientAddress}>
            {item.address}, {item.zip} {item.town}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditClient(item)}
      >
        <Text style={styles.editButtonText}>✏️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sélectionner un client</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewClient}
          >
            <Text style={styles.addButtonText}>+ Nouveau client</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            placeholderTextColor="#8A98AD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Client List */}
        {loading && thirdParties.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0B5FFF" />
          </View>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon="👥"
            title={searchQuery ? "Aucun client trouvé" : "Aucun client"}
            message={
              searchQuery
                ? "Essayez une autre recherche"
                : "Ajoutez votre premier client"
            }
            actionLabel="Ajouter un client"
            onAction={handleAddNewClient}
          />
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClient}
            keyExtractor={(item, index) => item.id ? String(item.id) : `client-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  addButton: {
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 16,
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
  listContent: {
    padding: 16,
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
  clientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  clientCode: {
    fontSize: 12,
    color: "#5C6B82",
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 2,
  },
  clientAddress: {
    fontSize: 12,
    color: "#8A98AD",
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  editButtonText: {
    fontSize: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
