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

interface Quote {
  id: number;
  ref: string;
  ref_client: string;
  client_name: string;
  date_creation: string;
  total_ttc: number;
  status: string;
  commercial_name: string;
}

export default function QuotesScreen({ navigation }: any) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuotes();
    syncService.syncAll().catch(console.error);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quotes, searchText, filterStatus]);

  const loadQuotes = async () => {
    setLoading(true);
    const db = getDatabase();
    
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM quotes ORDER BY date_creation DESC;`,
          [],
          (_, { rows }) => {
            const quotesList: Quote[] = [];
            for (let i = 0; i < rows.length; i++) {
              quotesList.push(rows.item(i));
            }
            setQuotes(quotesList);
            resolve();
          },
          (_, error) => {
            console.error('Erreur chargement devis:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  };

  const applyFilters = () => {
    let filtered = [...quotes];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.ref.toLowerCase().includes(searchLower) ||
          q.client_name?.toLowerCase().includes(searchLower) ||
          q.ref_client?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((q) => q.status === filterStatus);
    }

    setFilteredQuotes(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadQuotes();
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
      case '2': return '#4CAF50';
      case '3': return '#FF5722';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '0': return 'Brouillon';
      case '1': return 'Envoyé';
      case '2': return 'Accepté';
      case '3': return 'Refusé';
      default: return 'Inconnu';
    }
  };

  const renderQuote = ({ item }: { item: Quote }) => (
    <TouchableOpacity
      style={styles.quoteCard}
      onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}
    >
      <View style={styles.quoteHeader}>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteRef}>{item.ref}</Text>
          <Text style={styles.clientName}>{item.client_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.quoteDetails}>
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
          placeholder="Rechercher un devis..."
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
            <Text style={styles.chipText}>Tous</Text>
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
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun devis trouvé</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('QuoteForm', {})}
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
  quoteCard: {
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
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteRef: {
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
  quoteDetails: {
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
