/**
 * Écran de retour / avoir
 * Permet de créer un avoir (crédit note) à partir d'une facture
 * Deux modes : par client ou par numéro de ticket
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { searchClients, DolibarrClient } from '../../src/api/clients';
import { getInvoicesByThirdparty, getInvoiceById, createCreditNote, DolibarrInvoice, DolibarrOrderLine } from '../../src/api/orders';
import { getDatabase } from '../../src/database/database';

type ReturnMode = 'client' | 'ticket';

export default function ReturnsScreen() {
  const { clientId, invoiceId } = useLocalSearchParams<{ clientId?: string; invoiceId?: string }>();
  const [mode, setMode] = useState<ReturnMode>(clientId ? 'client' : invoiceId ? 'ticket' : 'client');
  
  // Mode client
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<DolibarrClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<DolibarrClient | null>(null);
  const [invoices, setInvoices] = useState<DolibarrInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<DolibarrInvoice | null>(null);
  
  // Mode ticket
  const [ticketNumber, setTicketNumber] = useState('');
  
  // Produits à retourner
  const [returnLines, setReturnLines] = useState<Array<{ id: number; qty: number; label: string; price: number }>>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (clientId) {
      // Charger le client et ses factures si un clientId est fourni
      loadClientInvoices(Number(clientId));
    }
    if (invoiceId) {
      // Charger la facture directement
      loadInvoice(Number(invoiceId));
    }
  }, [clientId, invoiceId]);

  const loadClientInvoices = async (id: number) => {
    try {
      setLoading(true);
      const invoicesData = await getInvoicesByThirdparty(id);
      setInvoices(invoicesData);
      if (invoicesData.length > 0) {
        // Charger la première facture par défaut
        const firstInvoice = await getInvoiceById(invoicesData[0].id!);
        setSelectedInvoice(firstInvoice);
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoice = async (id: number) => {
    try {
      setLoading(true);
      const invoice = await getInvoiceById(id);
      setSelectedInvoice(invoice);
      setMode('ticket');
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      Alert.alert('Erreur', 'Facture introuvable');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClients = async (term: string) => {
    if (term.length < 2) {
      setClients([]);
      return;
    }
    try {
      const results = await searchClients(term);
      setClients(results);
    } catch (error) {
      console.error('Erreur recherche clients:', error);
    }
  };

  const handleSelectClient = async (client: DolibarrClient) => {
    setSelectedClient(client);
    setClients([]);
    await loadClientInvoices(client.id);
  };

  const handleSelectInvoice = async (invoice: DolibarrInvoice) => {
    try {
      const fullInvoice = await getInvoiceById(invoice.id!);
      setSelectedInvoice(fullInvoice);
      // Préparer les lignes de retour (toutes les lignes disponibles)
      if (fullInvoice.lines) {
        setReturnLines(fullInvoice.lines.map((line: any, index: number) => ({
          id: line.id || line.fk_product || index,
          qty: 0, // Quantité à retourner (0 par défaut)
          label: line.desc || line.product_label || `Produit ${index + 1}`,
          price: line.subprice || 0,
        })));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la facture');
    }
  };

  const handleSearchTicket = async () => {
    if (!ticketNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de ticket');
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Rechercher dans les ventes locales
      const db = await getDatabase();
      const result = await db.getAllAsync<{ dolibarr_invoice_id: number; invoice_ref: string }>(
        `SELECT dolibarr_invoice_id, invoice_ref FROM sales WHERE ticket_number = ? OR invoice_ref = ? LIMIT 1`,
        [ticketNumber, ticketNumber]
      );
      const sale = result && result.length > 0 ? result[0] : null;
      
      if (sale && sale.dolibarr_invoice_id) {
        // Trouvé dans la base locale, charger la facture
        const invoice = await getInvoiceById(sale.dolibarr_invoice_id);
        setSelectedInvoice(invoice);
        setMode('ticket');
        return;
      }
      
      // 2. Si pas trouvé localement, essayer de charger par ID Dolibarr
      const ticketId = parseInt(ticketNumber, 10);
      if (!isNaN(ticketId)) {
        try {
          const invoice = await getInvoiceById(ticketId);
          setSelectedInvoice(invoice);
          setMode('ticket');
          return;
        } catch (e) {
          // Si erreur 404, ce n'est pas un ID valide
        }
      }
      
      // 3. Si toujours pas trouvé
      Alert.alert('Erreur', `Ticket "${ticketNumber}" non trouvé dans la base locale ni dans Dolibarr`);
    } catch (error: any) {
      console.error('Erreur recherche ticket:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de trouver le ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReturnQty = (lineId: number, qty: number) => {
    setReturnLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, qty: Math.max(0, qty) } : line))
    );
  };

  const handleCreateCreditNote = async () => {
    if (!selectedInvoice || !selectedInvoice.id) {
      Alert.alert('Erreur', 'Aucune facture sélectionnée');
      return;
    }

    const linesToReturn = returnLines.filter((line) => line.qty > 0);
    if (linesToReturn.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un produit à retourner');
      return;
    }

    try {
      setProcessing(true);
      
      // Créer l'avoir avec les lignes sélectionnées
      const creditNote = await createCreditNote(
        selectedInvoice.id,
        linesToReturn.map((line) => ({ id: line.id, qty: line.qty }))
      );

      Alert.alert(
        'Succès',
        `Avoir créé avec succès\nRéférence: ${creditNote.ref || creditNote.id}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur création avoir:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de créer l\'avoir');
    } finally {
      setProcessing(false);
    }
  };

  const totalReturn = returnLines.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retour / Avoir</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Choix du mode */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'client' && styles.modeButtonActive]}
            onPress={() => {
              setMode('client');
              setSelectedInvoice(null);
              setReturnLines([]);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'client' && styles.modeButtonTextActive]}>
              Par Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'ticket' && styles.modeButtonActive]}
            onPress={() => {
              setMode('ticket');
              setSelectedInvoice(null);
              setReturnLines([]);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'ticket' && styles.modeButtonTextActive]}>
              Par Ticket
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Client */}
        {mode === 'client' && (
          <>
            {!selectedClient ? (
              <>
                <Text style={styles.label}>Rechercher un client</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom, email, téléphone..."
                  value={clientSearch}
                  onChangeText={(text) => {
                    setClientSearch(text);
                    handleSearchClients(text);
                  }}
                  placeholderTextColor={theme.colors.inputPlaceholder}
                />
                {clients.length > 0 && (
                  <View style={styles.clientsList}>
                    {clients.slice(0, 5).map((client) => (
                      <TouchableOpacity
                        key={client.id}
                        style={styles.clientItem}
                        onPress={() => handleSelectClient(client)}
                      >
                        <Text style={styles.clientName}>{client.name}</Text>
                        {client.email && (
                          <Text style={styles.clientInfo}>{client.email}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.selectedClientCard}>
                  <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => {
                      setSelectedClient(null);
                      setInvoices([]);
                      setSelectedInvoice(null);
                    }}
                  >
                    <Text style={styles.changeButtonText}>Changer</Text>
                  </TouchableOpacity>
                </View>

                {/* Liste des factures */}
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : invoices.length > 0 ? (
                  <View style={styles.invoicesSection}>
                    <Text style={styles.sectionTitle}>Factures disponibles</Text>
                    {invoices.map((invoice) => (
                      <TouchableOpacity
                        key={invoice.id}
                        style={[
                          styles.invoiceItem,
                          selectedInvoice?.id === invoice.id && styles.invoiceItemActive,
                        ]}
                        onPress={() => handleSelectInvoice(invoice)}
                      >
                        <Text style={styles.invoiceRef}>{invoice.ref || `Facture #${invoice.id}`}</Text>
                        <Text style={styles.invoiceAmount}>
                          {Number(invoice.total_ttc || 0).toFixed(2)}€
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>Aucune facture trouvée</Text>
                )}
              </>
            )}
          </>
        )}

        {/* Mode Ticket */}
        {mode === 'ticket' && (
          <>
            <Text style={styles.label}>Numéro de ticket</Text>
            <View style={styles.ticketSearchRow}>
              <TextInput
                style={styles.ticketInput}
                placeholder="Numéro de ticket"
                value={ticketNumber}
                onChangeText={setTicketNumber}
                placeholderTextColor={theme.colors.inputPlaceholder}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchTicket}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.textInverse} />
                ) : (
                  <Text style={styles.searchButtonText}>🔍</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Détails de la facture et produits à retourner */}
        {selectedInvoice && (
          <View style={styles.returnSection}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceInfoTitle}>
                {selectedInvoice.ref || `Facture #${selectedInvoice.id}`}
              </Text>
              <Text style={styles.invoiceInfoDate}>
                {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString('fr-FR') : ''}
              </Text>
              <Text style={styles.invoiceInfoTotal}>
                Total: {Number(selectedInvoice.total_ttc || 0).toFixed(2)}€
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Produits à retourner</Text>
            {selectedInvoice.lines && selectedInvoice.lines.length > 0 ? (
              selectedInvoice.lines.map((line: any, index: number) => {
                const returnLine = returnLines.find((rl) => rl.id === (line.id || line.fk_product || index));
                const maxQty = line.qty || 1;
                const currentQty = returnLine?.qty || 0;

                return (
                  <View key={line.id || index} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productLabel}>
                        {line.desc || line.product_label || `Produit ${index + 1}`}
                      </Text>
                      <Text style={styles.productPrice}>
                        {Number(line.subprice || 0).toFixed(2)}€ × {maxQty}
                      </Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateReturnQty(line.id || index, Math.max(0, currentQty - 1))}
                      >
                        <Text style={styles.qtyButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{currentQty}</Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateReturnQty(line.id || index, Math.min(maxQty, currentQty + 1))}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Aucun produit dans cette facture</Text>
            )}

            {totalReturn > 0 && (
              <View style={styles.totalReturnCard}>
                <Text style={styles.totalReturnLabel}>Total à créditer</Text>
                <Text style={styles.totalReturnAmount}>{totalReturn.toFixed(2)}€</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.createCreditNoteButton, processing && styles.createCreditNoteButtonDisabled]}
              onPress={handleCreateCreditNote}
              disabled={processing || totalReturn === 0}
            >
              {processing ? (
                <ActivityIndicator size="small" color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.createCreditNoteButtonText}>Créer l'avoir</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  backButton: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modeButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modeButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: theme.colors.textInverse,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
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
    marginBottom: theme.spacing.md,
  },
  clientsList: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  clientItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clientName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  clientInfo: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedClientName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  changeButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  invoicesSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  invoiceItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceItemActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  invoiceRef: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  invoiceAmount: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '700',
  },
  ticketSearchRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ticketInput: {
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
    backgroundColor: theme.colors.background,
  },
  searchButton: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 24,
  },
  returnSection: {
    marginTop: theme.spacing.md,
  },
  invoiceInfo: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  invoiceInfoTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  invoiceInfoDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  invoiceInfoTotal: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  productLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    fontSize: 20,
    fontWeight: '700',
  },
  qtyValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  totalReturnCard: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.success + '20',
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success,
    alignItems: 'center',
  },
  totalReturnLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  totalReturnAmount: {
    ...theme.typography.h2,
    color: theme.colors.success,
    fontWeight: '800',
  },
  createCreditNoteButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.lg,
  },
  createCreditNoteButtonDisabled: {
    opacity: 0.6,
  },
  createCreditNoteButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
});
