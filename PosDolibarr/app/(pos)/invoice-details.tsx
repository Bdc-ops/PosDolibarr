/**
 * Écran de détails d'une facture
 * Affiche les détails complets d'une facture et permet de créer un avoir
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { getInvoiceById, DolibarrInvoice } from '../../src/api/orders';

export default function InvoiceDetailsScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<DolibarrInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await getInvoiceById(Number(invoiceId));
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      Alert.alert('Erreur', 'Impossible de charger la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = () => {
    if (invoice?.id) {
      router.push({
        pathname: '/(pos)/returns',
        params: { invoiceId: String(invoice.id) },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Facture introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails facture</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Informations facture */}
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceRef}>{invoice.ref || `Facture #${invoice.id}`}</Text>
          {invoice.ref_ext && (
            <Text style={styles.invoiceRefExt}>Ref. ext: {invoice.ref_ext}</Text>
          )}
          {invoice.date && (
            <Text style={styles.invoiceDate}>
              Date: {new Date(invoice.date).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>

        {/* Totaux */}
        <View style={styles.totalsCard}>
          {invoice.total_ht && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT:</Text>
              <Text style={styles.totalValue}>{Number(invoice.total_ht).toFixed(2)}€</Text>
            </View>
          )}
          {invoice.total_tva && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA:</Text>
              <Text style={styles.totalValue}>{Number(invoice.total_tva).toFixed(2)}€</Text>
            </View>
          )}
          {invoice.total_ttc && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelTotal}>Total TTC:</Text>
              <Text style={styles.totalValueTotal}>{Number(invoice.total_ttc).toFixed(2)}€</Text>
            </View>
          )}
          {invoice.paye !== undefined && invoice.total_ttc && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {Number(invoice.paye) >= Number(invoice.total_ttc) ? '✅ Payée' : '⏳ À payer'}:
              </Text>
              <Text style={styles.totalValue}>
                {Number(invoice.paye || 0).toFixed(2)}€
                {Number(invoice.paye) < Number(invoice.total_ttc) && (
                  <Text style={styles.remainingText}>
                    {' '}(Reste: {(Number(invoice.total_ttc) - Number(invoice.paye || 0)).toFixed(2)}€)
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Lignes de facture */}
        {invoice.lines && invoice.lines.length > 0 && (
          <View style={styles.linesSection}>
            <Text style={styles.sectionTitle}>Articles</Text>
            {invoice.lines.map((line: any, index: number) => (
              <View key={line.id || index} style={styles.lineCard}>
                <Text style={styles.lineLabel}>
                  {line.desc || line.product_label || `Produit ${index + 1}`}
                </Text>
                {line.product_ref && (
                  <Text style={styles.lineRef}>Ref: {line.product_ref}</Text>
                )}
                <View style={styles.lineDetails}>
                  <Text style={styles.lineQty}>{line.qty || 1} × {Number(line.subprice || 0).toFixed(2)}€</Text>
                  <Text style={styles.lineTotal}>
                    {(Number(line.qty || 1) * Number(line.subprice || 0)).toFixed(2)}€
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bouton créer un avoir */}
        <TouchableOpacity
          style={styles.createReturnButton}
          onPress={handleCreateReturn}
        >
          <Text style={styles.createReturnButtonText}>🔄 Créer un avoir</Text>
        </TouchableOpacity>
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
  invoiceCard: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  invoiceRef: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  invoiceRefExt: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  invoiceDate: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  totalsCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  totalLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  totalValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  totalLabelTotal: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
  },
  totalValueTotal: {
    ...theme.typography.h3,
    color: theme.colors.error,
    fontWeight: '800',
  },
  remainingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.warning,
  },
  linesSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  lineCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  lineLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  lineRef: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  lineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  lineQty: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  lineTotal: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
  },
  createReturnButton: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.lg,
  },
  createReturnButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    margin: theme.spacing.md,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});
