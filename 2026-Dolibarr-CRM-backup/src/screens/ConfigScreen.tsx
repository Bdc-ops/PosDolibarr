import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../services/auth';
import { getLogs, clearLogs } from '../database/database';
import { syncService } from '../services/sync';
import { format } from 'date-fns';

export default function ConfigScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      await loadLogs();
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const logsData = await getLogs(50);
      setLogs(logsData);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncService.syncAll();
      Alert.alert('Succès', 'Synchronisation terminée');
      await loadLogs();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Supprimer les logs',
      'Êtes-vous sûr de vouloir supprimer tous les logs ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await clearLogs();
            await loadLogs();
          },
        },
      ]
    );
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'ERROR': return '#F44336';
      case 'SUCCESS': return '#4CAF50';
      case 'INFO': return '#2196F3';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateur</Text>
          <View style={styles.userCard}>
            <Text style={styles.userLabel}>Identifiant:</Text>
            <Text style={styles.userValue}>{user?.login || 'N/A'}</Text>
            <Text style={styles.userLabel}>Serveur:</Text>
            <Text style={styles.userValue}>{user?.serverUrl || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={[styles.actionButton, syncing && styles.actionButtonDisabled]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>🔄 Synchroniser</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('LogsDetail')}
          >
            <Text style={styles.actionButtonText}>📋 Voir les logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs récents</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun log</Text>
            </View>
          ) : (
            <>
              {logs.slice(0, 10).map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <View
                      style={[
                        styles.logTypeBadge,
                        { backgroundColor: getLogColor(log.type) },
                      ]}
                    >
                      <Text style={styles.logTypeText}>{log.type}</Text>
                    </View>
                    <Text style={styles.logDate}>
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </Text>
                  </View>
                  <Text style={styles.logMessage}>{log.message}</Text>
                  {log.details && (
                    <Text style={styles.logDetails}>{log.details}</Text>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearLogs}
              >
                <Text style={styles.clearButtonText}>Effacer les logs</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  userValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  logDate: {
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  logDetails: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  clearButton: {
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
