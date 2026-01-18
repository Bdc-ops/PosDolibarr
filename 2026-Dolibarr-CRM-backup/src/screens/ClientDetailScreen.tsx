import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getDatabase } from '../database/database';
import { syncService } from '../services/sync';
import * as Location from 'expo-location';

export default function ClientDetailScreen({ route, navigation }: any) {
  const { clientId } = route.params;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    const db = getDatabase();
    
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM clients WHERE id = ?;',
          [clientId],
          (_, { rows }) => {
            if (rows.length > 0) {
              const clientData = rows.item(0);
              setClient(clientData);
              setFormData({
                name: clientData.name || '',
                firstname: clientData.firstname || '',
                phone: clientData.phone || '',
                email: clientData.email || '',
                address: clientData.address || '',
                zip: clientData.zip || '',
                town: clientData.town || '',
                sector: clientData.sector || '',
              });
            }
            resolve();
          },
          (_, error) => {
            console.error('Erreur chargement client:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  };

  const handleSave = async () => {
    const db = getDatabase();
    const online = await syncService.isOnline();

    try {
      // Mettre à jour en local
      await new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            `UPDATE clients SET 
              name = ?, firstname = ?, phone = ?, email = ?, 
              address = ?, zip = ?, town = ?, sector = ?, synced = 0
            WHERE id = ?;`,
            [
              formData.name,
              formData.firstname,
              formData.phone,
              formData.email,
              formData.address,
              formData.zip,
              formData.town,
              formData.sector,
              clientId,
            ],
            () => {
              resolve();
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        });
      });

      // Synchroniser si en ligne
      if (online) {
        await syncService.addPendingChange('clients', clientId, 'UPDATE_CLIENT', formData);
        await syncService.syncPendingChanges();
      }

      Alert.alert('Succès', 'Client mis à jour');
      setEditing(false);
      await loadClient();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const updateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de géolocalisation requise');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const db = getDatabase();

      await new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'UPDATE clients SET latitude = ?, longitude = ? WHERE id = ?;',
            [location.coords.latitude, location.coords.longitude, clientId],
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        });
      });

      Alert.alert('Succès', 'Localisation mise à jour');
      await loadClient();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la localisation');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.centerContainer}>
        <Text>Client introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {client.name} {client.firstname}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.editButtonText}>
              {editing ? 'Annuler' : '✏️ Modifier'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Référence</Text>
          <Text style={styles.value}>{client.ref}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nom</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          ) : (
            <Text style={styles.value}>{client.name}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prénom</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.firstname}
              onChangeText={(text) => setFormData({ ...formData, firstname: text })}
            />
          ) : (
            <Text style={styles.value}>{client.firstname || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Téléphone</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{client.phone || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{client.email || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Adresse</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          ) : (
            <Text style={styles.value}>{client.address || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Code postal</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.zip}
              onChangeText={(text) => setFormData({ ...formData, zip: text })}
            />
          ) : (
            <Text style={styles.value}>{client.zip || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ville</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.town}
              onChangeText={(text) => setFormData({ ...formData, town: text })}
            />
          ) : (
            <Text style={styles.value}>{client.town || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Secteur</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.sector}
              onChangeText={(text) => setFormData({ ...formData, sector: text })}
            />
          ) : (
            <Text style={styles.value}>{client.sector || '-'}</Text>
          )}
        </View>

        {client.commercial_name && (
          <View style={styles.section}>
            <Text style={styles.label}>Commercial</Text>
            <Text style={styles.value}>{client.commercial_name}</Text>
          </View>
        )}

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        )}

        {client.latitude && client.longitude ? (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('ClientMap', { client })}
          >
            <Text style={styles.mapButtonText}>📍 Voir sur la carte</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.locationButton} onPress={updateLocation}>
            <Text style={styles.locationButtonText}>📍 Ajouter la localisation</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
