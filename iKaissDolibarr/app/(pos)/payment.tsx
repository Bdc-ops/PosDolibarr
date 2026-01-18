/**
 * Écran de paiement
 * Gère les paiements (espèces, carte, multi-paiement, etc.)
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../src/features/cart/CartContext';
import { theme } from '../../src/theme/theme';
import { Payment, PaymentType, CompletedSale } from '../../src/types/pos';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { generateId, generateShortId } from '../../src/utils/id';
import { getDatabase } from '../../src/database/database';
import { syncSale } from '../../src/sync/sync';
import { loadPOSSettings } from '../../src/config/pos.settings';
import { discoverBluetoothPrinters, BluetoothPrinter } from '../../src/services/print';
import { discoverBluetoothScanners, BluetoothScanner } from '../../src/services/scanner';

export default function PaymentScreen() {
  const { saleId, prefillType } = useLocalSearchParams<{ saleId: string; prefillType?: string }>();
  const { products, client, total_ttc, createPendingSale, clearCart } = useCart();
  const metierConfig = getCurrentMetierConfig();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPaymentType, setCurrentPaymentType] = useState<PaymentType>(
    (prefillType as PaymentType) || (metierConfig.settings.typesPaiement?.[0] as PaymentType) || 'LIQ'
  );
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<BluetoothPrinter | null>(null);
  const [selectedScanner, setSelectedScanner] = useState<BluetoothScanner | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<BluetoothPrinter[]>([]);
  const [availableScanners, setAvailableScanners] = useState<BluetoothScanner[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [hasSearchedPrinters, setHasSearchedPrinters] = useState(false);
  const [hasSearchedScanners, setHasSearchedScanners] = useState(false);

  // Charger les imprimantes/scanners configurés au démarrage
  useEffect(() => {
    loadDeviceSettings();
  }, []);

  const loadDeviceSettings = async () => {
    try {
      const settings = await loadPOSSettings();
      
      // Charger l'imprimante configurée
      if (settings.selectedPrinterId) {
        const printers = await discoverBluetoothPrinters();
        const printer = printers.find((p) => p.id === settings.selectedPrinterId);
        if (printer) {
          setSelectedPrinter(printer);
        }
      }
      
      // Charger le scanner configuré
      if (settings.selectedScannerId) {
        const scanners = await discoverBluetoothScanners();
        const scanner = scanners.find((s) => s.id === settings.selectedScannerId);
        if (scanner) {
          setSelectedScanner(scanner);
        }
      }
    } catch (error) {
      console.error('Erreur chargement devices:', error);
    }
  };

  const handleDiscoverPrinters = async () => {
    try {
      setLoadingDevices(true);
      setHasSearchedPrinters(true);
      const printers = await discoverBluetoothPrinters();
      setAvailablePrinters(printers);
    } catch (error: any) {
      // En cas d'erreur réelle, on retourne une liste vide sans alerte
      console.error('Erreur découverte imprimantes:', error);
      setAvailablePrinters([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleDiscoverScanners = async () => {
    try {
      setLoadingDevices(true);
      setHasSearchedScanners(true);
      const scanners = await discoverBluetoothScanners();
      setAvailableScanners(scanners);
    } catch (error: any) {
      // En cas d'erreur réelle, on retourne une liste vide sans alerte
      console.error('Erreur découverte scanners:', error);
      setAvailableScanners([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
  const remaining = total_ttc - totalPaid;
  
  // Calcul du rendu monnaie : uniquement si le paiement en espèces dépasse le total
  const isCashPayment = currentPaymentType === 'cash' || currentPaymentType === 'LIQ' || currentPaymentType === 'CASH';
  const currentAmountNum = parseFloat(currentAmount) || 0;
  const changeDue = isCashPayment && currentAmountNum > remaining && remaining > 0 
    ? currentAmountNum - remaining 
    : remaining < 0 
      ? Math.abs(remaining) 
      : 0;

  const paymentTypes: PaymentType[] = (metierConfig.settings.typesPaiement as any) || ['LIQ', 'CB'];

  const paymentLabel = (t: PaymentType) => {
    switch (t) {
      case 'LIQ':
      case 'CASH':
      case 'cash':
        return 'Espèces';
      case 'CB':
      case 'card':
        return 'Carte';
      case 'CHQ':
      case 'CHEQUE':
      case 'check':
        return 'Chèque';
      case 'VIR':
      case 'transfer':
        return 'Virement';
      default:
        return String(t);
    }
  };

  const handleAddPayment = () => {
    if (!metierConfig.options.activerMultiPaiement && payments.length > 0) {
      Alert.alert('Paiement', 'Multi-paiement désactivé par configuration.');
      return;
    }
    const amount = parseFloat(currentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    // Autorise un surpaiement uniquement en espèces (pour gérer la monnaie)
    const isCash =
      currentPaymentType === 'cash' || currentPaymentType === 'LIQ' || currentPaymentType === 'CASH';
    if (amount > remaining && !isCash) {
      Alert.alert('Erreur', 'Le montant dépasse le reste à payer (hors espèces).');
      return;
    }

    const payment: Payment = {
      id: generateId(),
      type: currentPaymentType,
      amount: amount,
      status: 'completed',
      created_at: Date.now(),
    };

    setPayments((prev) => [...prev, payment]);
    setCurrentAmount('');
  };

  const handleRemovePayment = (paymentId?: string) => {
    if (!paymentId) return;
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const handleCompleteSale = async () => {
    if (remaining > 0.01) {
      Alert.alert('Paiement incomplet', `Il reste ${remaining.toFixed(2)} € à payer`);
      return;
    }

    setProcessing(true);

    try {
      const pendingSale = createPendingSale();
      const ticketNumber = generateShortId();

      const completedSale: CompletedSale = {
        ...pendingSale,
        id: saleId || pendingSale.id,
        status: 'completed',
        ticket_number: ticketNumber,
        payments,
        payment_total: totalPaid,
        remaining: Math.max(0, remaining), // si surpaiement cash, remaining=0
        synced: false,
      };

      // Enregistrement en local
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO sales (
          id, status, client_id, subtotal, subtotal_ttc, total_discount,
          total_tax, total, total_ttc, payment_total, remaining,
          ticket_number, synced, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          completedSale.id,
          completedSale.status,
          completedSale.client_id || null,
          completedSale.subtotal,
          completedSale.subtotal_ttc,
          completedSale.total_discount,
          completedSale.total_tax,
          completedSale.total,
          completedSale.total_ttc,
          completedSale.payment_total,
          completedSale.remaining,
          completedSale.ticket_number,
          0,
          completedSale.created_at,
          Date.now(),
        ]
      );

      // Tentative de synchronisation (si connecté)
      try {
        await syncSale(completedSale);
      } catch (error) {
        console.warn('Synchronisation échouée, vente stockée localement:', error);
      }

      // Vidage du panier
      clearCart();

      // Redirection vers le ticket
      router.replace({
        pathname: '/(pos)/receipt',
        params: { saleId: completedSale.id, ticketNumber },
      });
    } catch (error) {
      console.error('Erreur lors de la finalisation de la vente:', error);
      Alert.alert('Erreur', 'Impossible de finaliser la vente. Veuillez réessayer.');
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Total à payer - Carte redessinée pour inclure Reçu et Rendu */}
        <View style={styles.totalCard}>
          <View style={styles.totalGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>À PAYER</Text>
              <Text style={styles.totalAmountSmall}>{total_ttc.toFixed(2)} €</Text>
            </View>
            
            {totalPaid > 0 && (
              <View style={[styles.totalItem, styles.totalItemBorder]}>
                <Text style={[styles.totalLabel, { color: '#FFB300' }]}>REÇU</Text>
                <Text style={[styles.totalAmountSmall, { color: '#FFB300' }]}>{totalPaid.toFixed(2)} €</Text>
              </View>
            )}

            {changeDue > 0 ? (
              <View style={[styles.totalItem, styles.totalItemBorder]}>
                <Text style={[styles.totalLabel, { color: '#00E676' }]}>À RENDRE</Text>
                <Text style={[styles.totalAmountSmall, { color: '#00E676' }]}>{changeDue.toFixed(2)} €</Text>
              </View>
            ) : remaining > 0.01 && totalPaid > 0 ? (
              <View style={[styles.totalItem, styles.totalItemBorder]}>
                <Text style={[styles.totalLabel, { color: '#FF5252' }]}>RESTE</Text>
                <Text style={[styles.totalAmountSmall, { color: '#FF5252' }]}>{remaining.toFixed(2)} €</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Paiements effectués */}
        {payments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>Paiements</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <Text style={styles.paymentType}>{payment.type.toUpperCase()}</Text>
                <View style={styles.paymentRowRight}>
                  <Text style={styles.paymentAmount}>{payment.amount.toFixed(2)} €</Text>
                  <TouchableOpacity onPress={() => handleRemovePayment(payment.id)}>
                    <Text style={styles.removePayment}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={styles.paymentTotalRow}>
              <Text style={styles.paymentTotalLabel}>Total payé</Text>
              <Text style={styles.paymentTotalAmount}>{totalPaid.toFixed(2)} €</Text>
            </View>
          </View>
        )}

        {/* Saisie d'un nouveau paiement */}
        {remaining > 0.01 && (
          <View style={styles.newPaymentSection}>
            <Text style={styles.sectionTitle}>Nouveau paiement</Text>

            {/* Type de paiement - Grid design */}
            <View style={styles.paymentTypesGrid}>
              {paymentTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.paymentTypeCard,
                    currentPaymentType === type && styles.paymentTypeCardActive,
                  ]}
                  onPress={() => setCurrentPaymentType(type)}
                >
                  <Text
                    style={[
                      styles.paymentTypeIcon,
                      currentPaymentType === type && styles.paymentTypeIconActive,
                    ]}
                  >
                    {type === 'LIQ' || type === 'cash' ? '💵' : type === 'CB' || type === 'card' ? '💳' : '📝'}
                  </Text>
                  <Text
                    style={[
                      styles.paymentTypeCardText,
                      currentPaymentType === type && styles.paymentTypeCardTextActive,
                    ]}
                  >
                    {paymentLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Montant - Input design */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>{isCashPayment ? "Montant reçu" : "Montant"}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={theme.colors.inputPlaceholder}
              />
            </View>
            
            {/* Afficher le rendu monnaie en temps réel pour les paiements espèces */}
            {isCashPayment && currentAmountNum > remaining && remaining > 0 && (
              <View style={styles.changePreviewCard}>
                <Text style={styles.changePreviewIcon}>💰</Text>
                <View style={styles.changePreviewContent}>
                  <Text style={styles.changePreviewLabel}>Rendu monnaie</Text>
                  <Text style={styles.changePreviewAmount}>
                    {(currentAmountNum - remaining).toFixed(2)} €
                  </Text>
                </View>
              </View>
            )}
            
            {/* Boutons d'action - Design moderne */}
            <View style={styles.actionButtons}>
              {isCashPayment && remaining > 0 && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => setCurrentAmount(remaining.toFixed(2))}
                >
                  <Text style={styles.quickActionIcon}>⚡</Text>
                  <Text style={styles.quickActionText}>Montant exact</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addPaymentButton}
                onPress={handleAddPayment}
              >
                <Text style={styles.addPaymentIcon}>➕</Text>
                <Text style={styles.addPaymentButtonText}>Ajouter paiement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sélection imprimante/scanner */}
        {totalPaid >= total_ttc - 0.01 && (
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>Imprimante & Scanner</Text>
            
            {/* Imprimante */}
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>🖨️ Imprimante</Text>
              {selectedPrinter ? (
                <View style={styles.deviceSelected}>
                  <Text style={styles.deviceName} numberOfLines={1}>{selectedPrinter.name}</Text>
                  <TouchableOpacity
                    style={styles.deviceChangeButton}
                    onPress={handleDiscoverPrinters}
                  >
                    <Text style={styles.deviceChangeText}>Changer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deviceSelectButton}
                  onPress={handleDiscoverPrinters}
                >
                  <Text style={styles.deviceSelectText}>Sélectionner</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scanner */}
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>📷 Scanner</Text>
              {selectedScanner ? (
                <View style={styles.deviceSelected}>
                  <Text style={styles.deviceName} numberOfLines={1}>{selectedScanner.name}</Text>
                  <TouchableOpacity
                    style={styles.deviceChangeButton}
                    onPress={handleDiscoverScanners}
                  >
                    <Text style={styles.deviceChangeText}>Changer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deviceSelectButton}
                  onPress={handleDiscoverScanners}
                >
                  <Text style={styles.deviceSelectText}>Sélectionner</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Liste des imprimantes disponibles */}
            {loadingDevices && hasSearchedPrinters ? (
              <View style={styles.deviceList}>
                <Text style={styles.deviceEmptyText}>Recherche en cours...</Text>
              </View>
            ) : hasSearchedPrinters && availablePrinters.length === 0 ? (
              <View style={styles.deviceList}>
                <Text style={styles.deviceEmptyText}>Aucun POS trouvé</Text>
              </View>
            ) : availablePrinters.length > 0 ? (
              <View style={styles.deviceList}>
                {availablePrinters.map((printer) => (
                  <TouchableOpacity
                    key={printer.id}
                    style={[
                      styles.deviceItem,
                      selectedPrinter?.id === printer.id && styles.deviceItemActive,
                    ]}
                    onPress={() => {
                      setSelectedPrinter(printer);
                      setAvailablePrinters([]);
                      setHasSearchedPrinters(false);
                    }}
                  >
                    <Text style={styles.deviceItemText}>{printer.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Liste des scanners disponibles */}
            {loadingDevices && hasSearchedScanners ? (
              <View style={styles.deviceList}>
                <Text style={styles.deviceEmptyText}>Recherche en cours...</Text>
              </View>
            ) : hasSearchedScanners && availableScanners.length === 0 ? (
              <View style={styles.deviceList}>
                <Text style={styles.deviceEmptyText}>Aucun POS trouvé</Text>
              </View>
            ) : availableScanners.length > 0 ? (
              <View style={styles.deviceList}>
                {availableScanners.map((scanner) => (
                  <TouchableOpacity
                    key={scanner.id}
                    style={[
                      styles.deviceItem,
                      selectedScanner?.id === scanner.id && styles.deviceItemActive,
                    ]}
                    onPress={() => {
                      setSelectedScanner(scanner);
                      setAvailableScanners([]);
                      setHasSearchedScanners(false);
                    }}
                  >
                    <Text style={styles.deviceItemText}>{scanner.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Bouton finaliser - Design pro */}
        {totalPaid >= total_ttc - 0.01 && (
          <View style={styles.finalizeContainer}>
            <TouchableOpacity
              style={[styles.completeButton, processing && styles.completeButtonDisabled]}
              onPress={handleCompleteSale}
              disabled={processing}
            >
              {processing ? (
                <Text style={styles.completeButtonText}>⏳ Traitement...</Text>
              ) : (
                <>
                  <Text style={styles.completeButtonIcon}>✅</Text>
                  <Text style={styles.completeButtonText}>Finaliser la vente</Text>
                </>
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
  totalCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  totalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  totalItem: {
    alignItems: 'center',
    flex: 1,
  },
  totalItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalAmountSmall: {
    ...theme.typography.h2,
    fontSize: 24,
    color: theme.colors.textInverse,
    fontWeight: '800',
  },
  paidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  paidLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  paidAmount: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '30',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.success + '50',
  },
  changeLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
  },
  changeAmount: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: '800',
  },
  remainingBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning + '40',
  },
  changeDueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  changeDueLabel: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  changeDueAmount: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: '800',
    textAlign: 'center',
  },
  paymentsSection: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  paymentRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  paymentType: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  paymentAmount: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  removePayment: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '700',
  },
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  paymentTotalLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  paymentTotalAmount: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  newPaymentSection: {
    marginBottom: theme.spacing.md,
  },
  paymentTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  paymentTypeCard: {
    flex: 1,
    minWidth: '28%',
    maxWidth: '31%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    ...theme.shadows.sm,
  },
  paymentTypeCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  paymentTypeIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  paymentTypeIconActive: {
    opacity: 1,
  },
  paymentTypeCardText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentTypeCardTextActive: {
    color: theme.colors.textInverse,
  },
  amountContainer: {
    marginBottom: theme.spacing.md,
  },
  amountLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  amountInput: {
    minHeight: 56,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  changePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.success + '40',
    gap: theme.spacing.sm,
  },
  changePreviewIcon: {
    fontSize: 24,
  },
  changePreviewContent: {
    flex: 1,
  },
  changePreviewLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  changePreviewAmount: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: '800',
    marginLeft: theme.spacing.xs,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.info,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  addPaymentButton: {
    flex: 2,
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    ...theme.shadows.md,
  },
  addPaymentIcon: {
    fontSize: 18,
    color: theme.colors.textInverse,
  },
  addPaymentButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  finalizeContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.borderLight,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    ...theme.shadows.lg,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonIcon: {
    fontSize: 20,
  },
  completeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  devicesSection: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  deviceLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  deviceSelected: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  deviceName: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flex: 1,
  },
  deviceChangeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  deviceChangeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  deviceSelectButton: {
    flex: 2,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  deviceSelectText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  deviceList: {
    marginTop: theme.spacing.sm,
    maxHeight: 150,
  },
  deviceItem: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deviceItemActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  deviceItemText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
  },
  deviceEmptyText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.md,
    fontStyle: 'italic',
  },
});
