import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getDatabase } from '../database/database';
import { dolibarrAPI } from '../services/api';
import { syncService } from '../services/sync';
import { authService } from '../services/auth';
import { format } from 'date-fns';

export default function HomeScreen({ navigation }: any) {
  const [ca, setCa] = useState({ today: 0, month: 0, year: 0 });
  const [commercialsStats, setCommercialsStats] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
    loadData();
    // Synchronisation automatique au chargement
    syncService.syncAll().catch(console.error);
  }, []);

  const loadUserInfo = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      authService.getStoredUser().then((storedUser) => {
        if (storedUser) {
          setUser(storedUser);
        }
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await loadCA();
      await loadCommercialsStats();
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCA = async () => {
    const db = getDatabase();
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        // CA du jour
        tx.executeSql(
          `SELECT SUM(total_ttc) as total FROM invoices 
           WHERE DATE(date_creation) = DATE('now') AND status = '1';`,
          [],
          (_, { rows }) => {
            const today = rows.item(0)?.total || 0;
            
            // CA du mois
            tx.executeSql(
              `SELECT SUM(total_ttc) as total FROM invoices 
               WHERE strftime('%Y-%m', date_creation) = strftime('%Y-%m', 'now') 
               AND status = '1';`,
              [],
              (_, { rows: monthRows }) => {
                const month = monthRows.item(0)?.total || 0;
                
                // CA de l'année
                tx.executeSql(
                  `SELECT SUM(total_ttc) as total FROM invoices 
                   WHERE strftime('%Y', date_creation) = strftime('%Y', 'now') 
                   AND status = '1';`,
                  [],
                  (_, { rows: yearRows }) => {
                    const year = yearRows.item(0)?.total || 0;
                    setCa({ today: parseFloat(today), month: parseFloat(month), year: parseFloat(year) });
                    resolve();
                  }
                );
              }
            );
          }
        );
      });
    });
  };

  const loadCommercialsStats = async () => {
    const db = getDatabase();
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT 
            commercial_id,
            commercial_name,
            COUNT(DISTINCT c.id) as nb_clients,
            COUNT(DISTINCT i.id) as nb_factures,
            COALESCE(SUM(i.total_ttc), 0) as ca_total
          FROM clients c
          LEFT JOIN invoices i ON i.commercial_id = c.commercial_id
          WHERE c.commercial_id IS NOT NULL
          GROUP BY commercial_id, commercial_name
          ORDER BY ca_total DESC;`,
          [],
          (_, { rows }) => {
            const stats: any[] = [];
            for (let i = 0; i < rows.length; i++) {
              stats.push(rows.item(i));
            }
            setCommercialsStats(stats);
            resolve();
          },
          (_, error) => {
            console.error('Erreur stats commerciaux:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadData();
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {user && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              Bienvenue{user.firstname ? `, ${user.firstname}` : ''} {user.lastname || ''}
            </Text>
            <Text style={styles.userInfo}>
              {user.login} • {user.serverUrl}
            </Text>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>Chiffre d'Affaires</Text>
        
        <View style={styles.caContainer}>
          <View style={styles.caCard}>
            <Text style={styles.caLabel}>Aujourd'hui</Text>
            <Text style={styles.caValue}>{formatCurrency(ca.today)}</Text>
          </View>
          
          <View style={styles.caCard}>
            <Text style={styles.caLabel}>Ce mois</Text>
            <Text style={styles.caValue}>{formatCurrency(ca.month)}</Text>
          </View>
          
          <View style={styles.caCard}>
            <Text style={styles.caLabel}>Cette année</Text>
            <Text style={styles.caValue}>{formatCurrency(ca.year)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dispatch par Commercial</Text>
        
        {commercialsStats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune donnée disponible</Text>
          </View>
        ) : (
          commercialsStats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.commercialCard}
              onPress={() => navigation.navigate('CommercialDetail', { commercialId: stat.commercial_id })}
            >
              <View style={styles.commercialHeader}>
                <Text style={styles.commercialName}>
                  {stat.commercial_name || `Commercial #${stat.commercial_id}`}
                </Text>
                <Text style={styles.commercialCA}>{formatCurrency(stat.ca_total)}</Text>
              </View>
              <View style={styles.commercialStats}>
                <Text style={styles.statText}>
                  {stat.nb_clients} client{stat.nb_clients > 1 ? 's' : ''}
                </Text>
                <Text style={styles.statText}>
                  {stat.nb_factures} facture{stat.nb_factures > 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  caContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  caCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  caValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  commercialCard: {
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
  commercialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commercialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  commercialCA: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  commercialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 14,
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
  welcomeCard: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    color: '#E3F2FD',
  },
});
