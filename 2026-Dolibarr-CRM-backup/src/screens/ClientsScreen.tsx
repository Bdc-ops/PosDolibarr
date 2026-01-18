import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getDatabase } from '../database/database';
import { syncService } from '../services/sync';
import * as Location from 'expo-location';

interface Client {
  id: number;
  ref: string;
  name: string;
  firstname: string;
  phone: string;
  email: string;
  town: string;
  sector: string;
  commercial_name: string;
  latitude?: number;
  longitude?: number;
}

export default function ClientsScreen({ navigation }: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterSector, setFilterSector] = useState<string | null>(null);
  const [filterCommercial, setFilterCommercial] = useState<string | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [commercials, setCommercials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadClients();
    syncService.syncAll().catch(console.error);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchText, filterSector, filterCommercial]);

  const loadClients = async () => {
    setLoading(true);
    const db = getDatabase();
    
    try {
      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de géolocalisation refusée');
      }

      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT * FROM clients ORDER BY name ASC;`,
            [],
            (_, { rows }) => {
              const clientsList: Client[] = [];
              const sectorsSet = new Set<string>();
              const commercialsSet = new Set<string>();

              for (let i = 0; i < rows.length; i++) {
                const client = rows.item(i);
                clientsList.push(client);
                if (client.sector) sectorsSet.add(client.sector);
                if (client.commercial_name) commercialsSet.add(client.commercial_name);
              }

              setClients(clientsList);
              setSectors(Array.from(sectorsSet).sort());
              setCommercials(Array.from(commercialsSet).sort());
              resolve();
            },
            (_, error) => {
              console.error('Erreur chargement clients:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.firstname?.toLowerCase().includes(searchLower) ||
          c.ref?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(searchText)
      );
    }

    if (filterSector) {
      filtered = filtered.filter((c) => c.sector === filterSector);
    }

    if (filterCommercial) {
      filtered = filtered.filter((c) => c.commercial_name === filterCommercial);
    }

    setFilteredClients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadClients();
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateClientLocation = async (clientId: number) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission de géolocalisation requise');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const db = getDatabase();

      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'UPDATE clients SET latitude = ?, longitude = ? WHERE id = ?;',
            [location.coords.latitude, location.coords.longitude, clientId],
            () => {
              loadClients();
              resolve();
            },
            (_, error) => {
              console.error('Erreur mise à jour localisation:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.name} {item.firstname}
          </Text>
          <Text style={styles.clientRef}>{item.ref}</Text>
        </View>
        {item.latitude && item.longitude ? (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('ClientMap', { client: item })}
          >
            <Text style={styles.mapButtonText}>📍</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => updateClientLocation(item.id)}
          >
            <Text style={styles.locationButtonText}>📍</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.clientDetails}>
        {item.phone && <Text style={styles.detailText}>📞 {item.phone}</Text>}
        {item.email && <Text style={styles.detailText}>✉️ {item.email}</Text>}
        {item.town && <Text style={styles.detailText}>📍 {item.town}</Text>}
        {item.sector && <Text style={styles.detailText}>🏢 {item.sector}</Text>}
        {item.commercial_name && (
          <Text style={styles.detailText}>👤 {item.commercial_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>🔍 Filtres</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Secteur:</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.chip, !filterSector && styles.chipActive]}
                onPress={() => setFilterSector(null)}
              >
                <Text style={styles.chipText}>Tous</Text>
              </TouchableOpacity>
              {sectors.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  style={[styles.chip, filterSector === sector && styles.chipActive]}
                  onPress={() => setFilterSector(filterSector === sector ? null : sector)}
                >
                  <Text style={styles.chipText}>{sector}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Commercial:</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.chip, !filterCommercial && styles.chipActive]}
                onPress={() => setFilterCommercial(null)}
              >
                <Text style={styles.chipText}>Tous</Text>
              </TouchableOpacity>
              {commercials.map((commercial) => (
                <TouchableOpacity
                  key={commercial}
                  style={[styles.chip, filterCommercial === commercial && styles.chipActive]}
                  onPress={() => setFilterCommercial(filterCommercial === commercial ? null : commercial)}
                >
                  <Text style={styles.chipText}>{commercial}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun client trouvé</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ClientForm', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clientRef: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapButton: {
    padding: 8,
  },
  mapButtonText: {
    fontSize: 20,
  },
  locationButton: {
    padding: 8,
    opacity: 0.5,
  },
  locationButtonText: {
    fontSize: 20,
  },
  clientDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
