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

interface Invoice {
  id: number;
  ref: string;
  ref_client: string;
  client_name: string;
  date_creation: string;
  total_ttc: number;
  status: string;
  commercial_name: string;
}

export default function InvoicesScreen({ navigation }: any) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvoices();
    syncService.syncAll().catch(console.error);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchText, filterStatus]);

  const loadInvoices = async () => {
    setLoading(true);
    const db = getDatabase();
    
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM invoices ORDER BY date_creation DESC;`,
          [],
          (_, { rows }) => {
            const invoicesList: Invoice[] = [];
            for (let i = 0; i < rows.length; i++) {
              invoicesList.push(rows.item(i));
            }
            setInvoices(invoicesList);
            resolve();
          },
          (_, error) => {
            console.error('Erreur chargement factures:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.ref.toLowerCase().includes(searchLower) ||
          i.client_name?.toLowerCase().includes(searchLower) ||
          i.ref_client?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    setFilteredInvoices(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadInvoices();
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
      case '1': return '#4CAF50';
      case '2': return '#FF9800';
      case '3': return '#2196F3';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1': return 'Payée';
      case '2': return 'En attente';
      case '3': return 'En cours';
      default: return 'Inconnu';
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceRef}>{item.ref}</Text>
          <Text style={styles.clientName}>{item.client_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.invoiceDetails}>
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

  const statuses = ['1', '2', '3'];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une facture..."
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
        data={filteredInvoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune facture trouvée</Text>
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
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceRef: {
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
  invoiceDetails: {
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
