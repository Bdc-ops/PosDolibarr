import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { useCart } from '../../src/features/cart/CartContext';
import { CartProduct, PendingSale } from '../../src/types/pos';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { generateId } from '../../src/utils/id';
import { savePendingSale } from '../../src/database/pendingSales';

function sumTtc(lines: CartProduct[]) {
  return lines.reduce((s, p) => s + p.total_ttc, 0);
}

export default function SplitScreen() {
  const metier = getCurrentMetierConfig();
  const cart = useCart();
  const [left, setLeft] = useState<CartProduct[]>(cart.products);
  const [right, setRight] = useState<CartProduct[]>([]);

  const totals = useMemo(() => {
    return { left: sumTtc(left), right: sumTtc(right) };
  }, [left, right]);

  const moveToRight = (idx: number) => {
    const p = left[idx];
    if (!p) return;
    setLeft((prev) => prev.filter((_, i) => i !== idx));
    setRight((prev) => [...prev, p]);
  };

  const moveToLeft = (idx: number) => {
    const p = right[idx];
    if (!p) return;
    setRight((prev) => prev.filter((_, i) => i !== idx));
    setLeft((prev) => [...prev, p]);
  };

  const handleConfirm = async () => {
    if (right.length === 0) {
      Alert.alert('Split', 'Ajoute au moins un article dans le ticket B.');
      return;
    }

    // Crée un ticket B "en attente" (on_hold) stocké en local
    const now = Date.now();
    const saleB: PendingSale = {
      id: generateId(),
      status: 'on_hold',
      client_id: cart.client?.id,
      client: cart.client || undefined,
      products: right,
      discounts: [], // global discounts not split in this MVP
      subtotal: 0,
      subtotal_ttc: totals.right,
      total_discount: right.reduce((s, p) => s + (p.discount_amount || 0), 0),
      total_tax: 0,
      total: totals.right,
      total_ttc: totals.right,
      payments: [],
      payment_total: 0,
      remaining: totals.right,
      created_at: now,
      updated_at: now,
      notes: 'Split ticket B',
    };

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(pos)/split.tsx:70',message:'Split confirm',data:{leftCount:left.length,rightCount:right.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    await savePendingSale(saleB);

    // Remplace le panier courant par le ticket A
    cart.clearCart();
    left.forEach((p) => cart.addProduct(p));

    Alert.alert('Split', 'Ticket B mis en attente. Ticket A conservé dans le panier.', [
      { text: 'OK', onPress: () => router.replace('/(pos)/cart') },
    ]);
  };

  if (!metier.options.activerMiseEnAttente || !metier.options.activerRepriseTicket) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Split nécessite Mise en attente + Reprise ticket activées dans la config métier.</Text>
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
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Ticket A ({totals.left.toFixed(2)} €)</Text>
          <FlatList
            data={left}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.line} onPress={() => moveToRight(index)}>
                <Text style={styles.lineLabel}>{item.label}</Text>
                <Text style={styles.lineAmount}>{item.total_ttc.toFixed(2)} €</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Ticket B (attente) ({totals.right.toFixed(2)} €)</Text>
          <FlatList
            data={right}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.line} onPress={() => moveToLeft(index)}>
                <Text style={styles.lineLabel}>{item.label}</Text>
                <Text style={styles.lineAmount}>{item.total_ttc.toFixed(2)} €</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirmer (B → attente)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => router.push('/(pos)/held')}>
          <Text style={styles.secondaryText}>Reprendre ticket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  back: { ...theme.typography.button, color: theme.colors.textInverse, fontSize: 20 },
  title: { ...theme.typography.h2, color: theme.colors.textInverse },
  columns: { flex: 1, flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.md },
  column: { flex: 1, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md },
  columnTitle: { ...theme.typography.h3, marginBottom: theme.spacing.sm },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  lineLabel: { ...theme.typography.body, color: theme.colors.text, flex: 1 },
  lineAmount: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  footer: { padding: theme.spacing.md, gap: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  button: { backgroundColor: theme.colors.success, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  buttonText: { ...theme.typography.button, color: theme.colors.textInverse },
  secondary: { backgroundColor: theme.colors.backgroundSecondary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  secondaryText: { ...theme.typography.button, color: theme.colors.text },
  error: { ...theme.typography.body, color: theme.colors.error, padding: theme.spacing.lg, textAlign: 'center' },
});

