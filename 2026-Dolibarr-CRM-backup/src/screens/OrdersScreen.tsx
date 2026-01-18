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
import { format } from 'date-fns';

interface Order {
  id: number;
  ref: string;
  ref_client: string;
  client_name: string;
  date_creation: string;
  total_ttc: number;
  status: string;
  commercial_name: string;
}

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    syncService.syncAll().catch(console.error);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchText, filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    const db = getDatabase();
    
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM orders ORDER BY date_creation DESC;`,
          [],
          (_, { rows }) => {
            const ordersList: Order[] = [];
            for (let i = 0; i < rows.length; i++) {
              ordersList.push(rows.item(i));
            }
            setOrders(ordersList);
            resolve();
          },
          (_, error) => {
            console.error('Erreur chargement commandes:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.ref.toLowerCase().includes(searchLower) ||
          o.client_name?.toLowerCase().includes(searchLower) ||
          o.ref_client?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadOrders();
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '0': return '#999';
      case '1': return '#2196F3';
      case '2': return '#FF9800';
      case '3': return '#4CAF50';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '0': return 'Brouillon';
      case '1': return 'Validée';
      case '2': return 'En cours';
      case '3': return 'Livrée';
      default: return 'Inconnu';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderRef}>{item.ref}</Text>
          <Text style={styles.clientName}>{item.client_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.amount}>{formatCurrency(item.total_ttc)}</Text>
        {item.date_creation && (
          <Text style={styles.date}>
            {format(new Date(item.date_creation), 'dd/MM/yyyy')}
          </Text>
        )}
        {item.commercial_name && (
          <Text style={styles.commercial}>👤 {item.commercial_name}</Text>
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

  const statuses = ['0', '1', '2', '3'];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une commande..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[styles.chip, !filterStatus && styles.chipActive]}
            onPress={() => setFilterStatus(null)}
          >
            <Text style={styles.chipText}>Toutes</Text>
          </TouchableOpacity>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.chip, filterStatus === status && styles.chipActive]}
              onPress={() => setFilterStatus(filterStatus === status ? null : status)}
            >
              <Text style={styles.chipText}>{getStatusLabel(status)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande trouvée</Text>
          </View>
        }
      />
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderRef: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  commercial: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
