/**
 * Écran de sélection/création/modification de client
 * Permet de rechercher, sélectionner, créer ou modifier un client
 * Affiche les champs personnalisés et les informations de contact
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../../src/features/cart/CartContext';
import { theme } from '../../src/theme/theme';
import { DolibarrClient } from '../../src/types/client';
import { searchClients, createClient, updateClient, getClientById, getContactsByThirdparty, getOutstandingInvoices, DolibarrContact } from '../../src/api/clients';
import { getInvoicesByThirdparty, getInvoiceById, DolibarrInvoice } from '../../src/api/orders';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { savePOSSettings, loadPOSSettings } from '../../src/config/pos.settings';

type ViewMode = 'search' | 'details' | 'create' | 'edit';

export default function ClientsScreen() {
  const { client: selectedClient, setClient } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<DolibarrClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [currentClient, setCurrentClient] = useState<DolibarrClient | null>(null);
  const [contacts, setContacts] = useState<DolibarrContact[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<DolibarrInvoice[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const metierConfig = getCurrentMetierConfig();

  // Formulaire création/édition
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    phone_mobile: '',
    address: '',
    zip: '',
    town: '',
    country: '',
  });

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const results = await searchClients(searchTerm);
      setClients(results);
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      Alert.alert('Erreur', 'Impossible de rechercher les clients');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (viewMode === 'search' && searchTerm.length >= 2) {
      loadClients();
    } else if (viewMode === 'search') {
      setClients([]);
    }
  }, [searchTerm, viewMode, loadClients]);

  const handleSelectClient = async (client: DolibarrClient) => {
    try {
      setLoading(true);
      // Récupérer les détails complets du client
      const fullClient = await getClientById(client.id);
      setCurrentClient(fullClient);
      setViewMode('details');
      
      // Charger les contacts, factures en attente et toutes les factures
      setLoadingContacts(true);
      setLoadingInvoices(true);
      const [contactsData, outstandingData, allInvoicesData] = await Promise.all([
        getContactsByThirdparty(fullClient.id).catch(() => []),
        getOutstandingInvoices(fullClient.id).catch(() => []),
        getInvoicesByThirdparty(fullClient.id).catch(() => []),
      ]);
      setContacts(contactsData);
      setOutstandingInvoices(outstandingData);
      setAllInvoices(allInvoicesData);
      setLoadingContacts(false);
      setLoadingInvoices(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      // Si erreur, utiliser le client de base
      setCurrentClient(client);
      setViewMode('details');
      setLoadingContacts(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUseClient = () => {
    if (currentClient) {
      setClient(currentClient as any);
      router.back();
    }
  };

  const handleEditClient = () => {
    if (currentClient) {
      setFormData({
        name: currentClient.name || '',
        firstname: currentClient.firstname || '',
        lastname: currentClient.lastname || '',
        email: currentClient.email || '',
        phone: currentClient.phone || '',
        phone_mobile: currentClient.phone_mobile || '',
        address: currentClient.address || '',
        zip: currentClient.zip || '',
        town: currentClient.town || '',
        country: currentClient.country || '',
      });
      setViewMode('edit');
    }
  };

  const handleCreateClient = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);
      const newClient = await createClient(formData);
      setCurrentClient(newClient);
      setViewMode('details');
      Alert.alert('Succès', 'Client créé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', error?.response?.data?.error || 'Impossible de créer le client');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!currentClient || !formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateClient(currentClient.id, formData);
      setCurrentClient(updated);
      setViewMode('details');
      Alert.alert('Succès', 'Client modifié avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', error?.response?.data?.error || 'Impossible de modifier le client');
    } finally {
      setLoading(false);
    }
  };

  const handleVenteAnonyme = () => {
    if (!metierConfig.options.clientObligatoire) {
      setClient(null);
      router.back();
    }
  };

  const handleSetDefaultClient = async () => {
    if (!currentClient) return;
    try {
      const currentSettings = await loadPOSSettings();
      await savePOSSettings({ ...currentSettings, defaultClientId: currentClient.id });
      Alert.alert('Succès', 'Client par défaut défini avec succès');
    } catch (error) {
      console.error('Erreur lors de la définition du client par défaut:', error);
      Alert.alert('Erreur', 'Impossible de définir le client par défaut');
    }
  };

  const renderClient = ({ item }: { item: DolibarrClient }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => handleSelectClient(item)}
    >
      <Text style={styles.clientName} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
      {item.email && (
        <Text style={styles.clientEmail} numberOfLines={1} ellipsizeMode="tail">
          📧 {item.email}
        </Text>
      )}
      {item.phone && (
        <Text style={styles.clientPhone} numberOfLines={1} ellipsizeMode="tail">
          📞 {item.phone}
        </Text>
      )}
      {item.town && (
        <Text style={styles.clientTown} numberOfLines={1} ellipsizeMode="tail">
          📍 {item.town}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderDetails = () => {
    if (!currentClient) return null;

    return (
      <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.detailsContent}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>{currentClient.name}</Text>
          {currentClient.ref && <Text style={styles.detailsRef}>Réf: {currentClient.ref}</Text>}
        </View>

        {/* Informations de contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact</Text>
          {currentClient.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{currentClient.email}</Text>
            </View>
          )}
          {currentClient.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone:</Text>
              <Text style={styles.infoValue}>{currentClient.phone}</Text>
            </View>
          )}
          {currentClient.phone_mobile && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile:</Text>
              <Text style={styles.infoValue}>{currentClient.phone_mobile}</Text>
            </View>
          )}
        </View>

        {/* Adresse */}
        {(currentClient.address || currentClient.zip || currentClient.town) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Adresse</Text>
            {currentClient.address && (
              <Text style={styles.infoValue}>{currentClient.address}</Text>
            )}
            {(currentClient.zip || currentClient.town) && (
              <Text style={styles.infoValue}>
                {currentClient.zip} {currentClient.town}
              </Text>
            )}
            {currentClient.country && (
              <Text style={styles.infoValue}>{currentClient.country}</Text>
            )}
          </View>
        )}

        {/* Informations complémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
          {currentClient.firstname && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prénom:</Text>
              <Text style={styles.infoValue}>{currentClient.firstname}</Text>
            </View>
          )}
          {currentClient.lastname && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom:</Text>
              <Text style={styles.infoValue}>{currentClient.lastname}</Text>
            </View>
          )}
          {currentClient.ref_ext && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Réf. externe:</Text>
              <Text style={styles.infoValue}>{currentClient.ref_ext}</Text>
            </View>
          )}
          {currentClient.price_level && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Niveau de prix:</Text>
              <Text style={styles.infoValue}>{currentClient.price_level}</Text>
            </View>
          )}
        </View>

        {/* Contacts */}
        {loadingContacts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Contacts</Text>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        {!loadingContacts && contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Contacts ({contacts.length})</Text>
            {contacts.slice(0, 5).map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <Text style={styles.contactName}>
                  {contact.fullname || `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || 'Contact sans nom'}
                </Text>
                {contact.poste && (
                  <Text style={styles.contactPoste}>{contact.poste}</Text>
                )}
                {contact.email && (
                  <Text style={styles.contactInfo}>📧 {contact.email}</Text>
                )}
                {(contact.phone_pro || contact.phone_mobile) && (
                  <Text style={styles.contactInfo}>
                    📞 {contact.phone_pro || contact.phone_mobile}
                  </Text>
                )}
                {contact.roles && contact.roles.length > 0 && (
                  <Text style={styles.contactRoles}>
                    Rôles: {contact.roles.map((r: any) => r.label || r.role || r).join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Factures en attente */}
        {!loadingContacts && outstandingInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Factures en attente ({outstandingInvoices.length})</Text>
            <Text style={styles.infoValue}>
              Total dû: {outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.total_ttc) || 0), 0).toFixed(2)}€
            </Text>
            {outstandingInvoices.slice(0, 3).map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => router.push({ pathname: '/(pos)/invoice-details', params: { invoiceId: String(invoice.id) } })}
              >
                <Text style={styles.invoiceRef}>{invoice.ref || `Facture #${invoice.id}`}</Text>
                <Text style={styles.invoiceAmount}>
                  {Number(invoice.total_ttc || 0).toFixed(2)}€
                  {invoice.date_lim_reglement && (
                    <Text style={styles.invoiceDate}>
                      {' '}• Échéance: {new Date(invoice.date_lim_reglement * 1000).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Toutes les factures */}
        {!loadingInvoices && allInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Toutes les factures ({allInvoices.length})</Text>
            <ScrollView style={styles.invoicesList} nestedScrollEnabled>
              {allInvoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.invoiceCard}
                  onPress={() => router.push({ pathname: '/(pos)/invoice-details', params: { invoiceId: String(invoice.id) } })}
                >
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceRef}>{invoice.ref || `Facture #${invoice.id}`}</Text>
                    <Text style={styles.invoiceDate}>
                      {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : ''}
                    </Text>
                  </View>
                  <Text style={styles.invoiceAmount}>
                    {Number(invoice.total_ttc || 0).toFixed(2)}€
                  </Text>
                  {invoice.paye !== undefined && invoice.total_ttc && (
                    <Text style={styles.invoiceStatus}>
                      {Number(invoice.paye) >= Number(invoice.total_ttc) ? '✅ Payée' : `⏳ À payer: ${(Number(invoice.total_ttc) - Number(invoice.paye || 0)).toFixed(2)}€`}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        {currentClient.note_public && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Note publique</Text>
            <Text style={styles.infoValue}>{currentClient.note_public}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditClient}
          >
            <Text style={styles.editButtonText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.useButton}
            onPress={handleUseClient}
          >
            <Text style={styles.useButtonText}>✅ Utiliser ce client</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.defaultButton}
            onPress={handleSetDefaultClient}
          >
            <Text style={styles.defaultButtonText}>⭐ Définir comme client par défaut</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContainer}
    >
      <ScrollView style={styles.formContent} contentContainerStyle={styles.formContentInner}>
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Nom *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nom de l'entreprise ou du client"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Prénom</Text>
          <TextInput
            style={styles.formInput}
            value={formData.firstname}
            onChangeText={(text) => setFormData({ ...formData, firstname: text })}
            placeholder="Prénom"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Nom de famille</Text>
          <TextInput
            style={styles.formInput}
            value={formData.lastname}
            onChangeText={(text) => setFormData({ ...formData, lastname: text })}
            placeholder="Nom de famille"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={styles.formInput}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Téléphone</Text>
          <TextInput
            style={styles.formInput}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="01 23 45 67 89"
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Mobile</Text>
          <TextInput
            style={styles.formInput}
            value={formData.phone_mobile}
            onChangeText={(text) => setFormData({ ...formData, phone_mobile: text })}
            placeholder="06 12 34 56 78"
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Adresse</Text>
          <TextInput
            style={styles.formInput}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Rue et numéro"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formSection, { flex: 1, marginRight: theme.spacing.sm }]}>
            <Text style={styles.formLabel}>Code postal</Text>
            <TextInput
              style={styles.formInput}
              value={formData.zip}
              onChangeText={(text) => setFormData({ ...formData, zip: text })}
              placeholder="75001"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={[styles.formSection, { flex: 2 }]}>
            <Text style={styles.formLabel}>Ville</Text>
            <TextInput
              style={styles.formInput}
              value={formData.town}
              onChangeText={(text) => setFormData({ ...formData, town: text })}
              placeholder="Paris"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Pays</Text>
          <TextInput
            style={styles.formInput}
            value={formData.country}
            onChangeText={(text) => setFormData({ ...formData, country: text })}
            placeholder="France"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelFormButton}
            onPress={() => {
              if (currentClient) {
                setViewMode('details');
              } else {
                setViewMode('search');
                setFormData({
                  name: '',
                  firstname: '',
                  lastname: '',
                  email: '',
                  phone: '',
                  phone_mobile: '',
                  address: '',
                  zip: '',
                  town: '',
                  country: '',
                });
              }
            }}
          >
            <Text style={styles.cancelFormButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveFormButton}
            onPress={viewMode === 'create' ? handleCreateClient : handleUpdateClient}
            disabled={loading}
          >
            <Text style={styles.saveFormButtonText}>
              {loading ? 'Enregistrement...' : viewMode === 'create' ? 'Créer' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (viewMode === 'details' || viewMode === 'create' || viewMode === 'edit') {
              if (viewMode === 'edit') {
                setViewMode(currentClient ? 'details' : 'search');
              } else {
                setViewMode('search');
              }
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewMode === 'create' ? 'Nouveau client' : viewMode === 'edit' ? 'Modifier client' : viewMode === 'details' ? 'Détails client' : 'Client'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {viewMode === 'search' && (
        <>
          {/* Recherche */}
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client (nom, email, téléphone)..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {loading && <ActivityIndicator style={styles.loader} color={theme.colors.primary} />}
          </View>

          {/* Bouton créer */}
          <View style={styles.createSection}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setFormData({
                  name: '',
                  firstname: '',
                  lastname: '',
                  email: '',
                  phone: '',
                  phone_mobile: '',
                  address: '',
                  zip: '',
                  town: '',
                  country: '',
                });
                setViewMode('create');
              }}
            >
              <Text style={styles.createButtonText}>➕ Créer un nouveau client</Text>
            </TouchableOpacity>
          </View>

          {/* Liste des clients */}
          {clients.length > 0 ? (
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderClient}
              contentContainerStyle={styles.clientsList}
            />
          ) : searchTerm.length >= 2 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
              <Text style={styles.emptyHint}>Tapez au moins 2 caractères pour rechercher</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyHint}>Recherchez un client ou créez-en un nouveau</Text>
            </View>
          )}

          {/* Vente anonyme */}
          {metierConfig.options.activerVenteAnonyme && !metierConfig.options.clientObligatoire && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.anonymousButton}
                onPress={handleVenteAnonyme}
              >
                <Text style={styles.anonymousButtonText}>Vente sans client</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {viewMode === 'details' && renderDetails()}
      {(viewMode === 'create' || viewMode === 'edit') && renderForm()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  backButton: {
    ...theme.typography.button,
    fontSize: 24,
    color: theme.colors.textInverse,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  searchSection: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minHeight: 56,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
  },
  loader: {
    marginLeft: theme.spacing.sm,
  },
  createSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  createButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  clientsList: {
    padding: theme.spacing.md,
  },
  clientCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  clientName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'left',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  clientEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'left',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  clientPhone: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'left',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  clientTown: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'left',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  anonymousButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  // Styles pour les détails
  detailsContainer: {
    flex: 1,
  },
  detailsContent: {
    padding: theme.spacing.lg,
  },
  detailsHeader: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailsTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailsRef: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    width: 120,
  },
  infoValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  editButton: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  useButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  defaultButton: {
    flex: 1,
    backgroundColor: theme.colors.info,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  defaultButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  // Styles pour les contacts
  contactCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  contactName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  contactPoste: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  contactInfo: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  contactRoles: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
  // Styles pour les factures
  invoiceCard: {
    backgroundColor: theme.colors.warning + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  invoiceRef: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  invoiceAmount: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '700',
    fontSize: 18,
  },
  invoiceDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '400',
    fontSize: 14,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  invoiceStatus: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
  invoicesList: {
    maxHeight: 300,
  },
  // Styles pour le formulaire
  formContainer: {
    flex: 1,
  },
  formContent: {
    flex: 1,
  },
  formContentInner: {
    padding: theme.spacing.lg,
  },
  formSection: {
    marginBottom: theme.spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    minHeight: 56,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelFormButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  saveFormButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFormButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
});
