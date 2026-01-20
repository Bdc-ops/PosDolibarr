/**
 * Écran de ticket de caisse
 * Affiche le récapitulatif de la vente avec possibilité de réimpression
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { getDatabase } from '../../src/database/database';
import { CompletedSale } from '../../src/types/pos';

export default function ReceiptScreen() {
  const { saleId, ticketNumber } = useLocalSearchParams<{ saleId: string; ticketNumber: string }>();
  const [sale, setSale] = useState<CompletedSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<CompletedSale>(
        `SELECT * FROM sales WHERE id = ?`,
        [saleId]
      );

      if (result) {
        // Charger les lignes de vente
        const linesResult = await db.getAllAsync<any>(
          `SELECT * FROM sale_lines WHERE sale_id = ?`,
          [saleId]
        );
        const lines = linesResult || [];

        // Charger les paiements
        const paymentsResult = await db.getAllAsync<any>(
          `SELECT * FROM sale_payments WHERE sale_id = ?`,
          [saleId]
        );
        const payments = paymentsResult || [];

        setSale({
          ...result,
          products: lines.map((line) => ({
            id: line.product_id,
            ref: line.product_ref,
            label: line.product_label,
            price: line.price,
            price_ttc: line.price_ttc,
            tva_tx: line.tva_tx,
            quantity: line.quantity,
            discount_amount: line.discount_amount,
            discount_percent: line.discount_percent,
            subtotal: line.subtotal,
            subtotal_ttc: line.subtotal_ttc,
            total: line.total,
            total_ttc: line.total_ttc,
          })),
          payments: payments.map((p) => ({
            id: p.id,
            type: p.type as any,
            amount: p.amount,
            reference: p.reference || undefined,
            transaction_id: p.transaction_id || undefined,
            status: p.status as any,
            created_at: p.created_at,
          })),
        } as CompletedSale);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vente:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la vente');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    router.replace('/(pos)');
  };

  const handleShareReceipt = async () => {
    if (!sale) return;
    const lines = sale.products
      .map((p) => `- ${p.label} | ${p.quantity} x ${p.price_ttc.toFixed(2)}€ = ${p.total_ttc.toFixed(2)}€`)
      .join('\n');
    const pays = sale.payments
      .map((p) => `- ${String(p.type).toUpperCase()}: ${p.amount.toFixed(2)}€`)
      .join('\n');
    const text =
      `TICKET ${ticketNumber || sale.ticket_number}\n` +
      `${new Date(sale.created_at).toLocaleString('fr-FR')}\n\n` +
      `ARTICLES\n${lines}\n\n` +
      `TOTAL TTC: ${sale.total_ttc.toFixed(2)}€\n` +
      (sale.total_discount > 0 ? `REMISE: -${sale.total_discount.toFixed(2)}€\n` : '') +
      `PAIEMENTS\n${pays}\n` +
      (sale.remaining > 0.01 ? `RESTE DÛ: ${sale.remaining.toFixed(2)}€\n` : '') +
      `\nMerci de votre visite.`;

    await Share.share({ message: text });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Vente introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={handleNewSale}>
          <Text style={styles.buttonText}>Nouvelle vente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* En-tête du ticket */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TICKET DE CAISSE</Text>
          <Text style={styles.ticketNumber}>N° {ticketNumber || sale.ticket_number}</Text>
          <Text style={styles.date}>
            {new Date(sale.created_at).toLocaleString('fr-FR')}
          </Text>
        </View>

        {/* Client */}
        {sale.client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.sectionValue}>{sale.client.name}</Text>
          </View>
        )}

        {/* Produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {sale.products.map((product, index) => (
            <View key={index} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.label}</Text>
                <Text style={styles.productDetails}>
                  {product.quantity} × {product.price_ttc.toFixed(2)} €
                </Text>
              </View>
              <Text style={styles.productTotal}>{product.total_ttc.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{sale.subtotal.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{sale.total_tax.toFixed(2)} €</Text>
          </View>
          {sale.total_discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remise</Text>
              <Text style={styles.discountValue}>-{sale.total_discount.toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTAL TTC</Text>
            <Text style={styles.totalFinalValue}>{sale.total_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Paiements */}
        {sale.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paiements</Text>
            {sale.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <Text style={styles.paymentType}>{payment.type.toUpperCase()}</Text>
                <Text style={styles.paymentAmount}>{payment.amount.toFixed(2)} €</Text>
              </View>
            ))}
            {sale.remaining > 0.01 && (
              <Text style={styles.remainingText}>
                Reste dû: {sale.remaining.toFixed(2)} €
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Merci de votre visite !</Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleNewSale}>
          <Text style={styles.buttonText}>Nouvelle vente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShareReceipt}>
          <Text style={styles.secondaryButtonText}>Partager / Imprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  ticketNumber: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  date: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionValue: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  productDetails: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  productTotal: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  totalsSection: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  totalLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  discountValue: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  totalFinalLabel: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  totalFinalValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
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
  remainingText: {
    ...theme.typography.body,
    color: theme.colors.warning,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  actions: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  secondaryButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
