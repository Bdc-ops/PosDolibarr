import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { listPendingSales, deletePendingSale } from '../../src/database/pendingSales';
import { PendingSale } from '../../src/types/pos';
import { useCart } from '../../src/features/cart/CartContext';

export default function HeldTicketsScreen() {
  const cart = useCart();
  const [items, setItems] = useState<Array<{ id: string; sale: PendingSale; created_at: number }>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setItems(await listPendingSales());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleResume = async (id: string, sale: PendingSale) => {
    await deletePendingSale(id);
    cart.clearCart();
    sale.products.forEach((p) => cart.addProduct(p));
    router.replace('/(pos)/cart');
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Ticket', 'Supprimer ce ticket en attente ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deletePendingSale(id); await refresh(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tickets en attente</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={styles.back}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text style={styles.muted}>Chargement…</Text></View>
      ) : items.length === 0 ? (
        <View style={styles.center}><Text style={styles.muted}>Aucun ticket en attente</Text></View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: theme.spacing.md }}
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.sale.notes || 'Ticket en attente'}</Text>
              <Text style={styles.cardSub}>
                {new Date(item.sale.created_at).toLocaleString('fr-FR')} • {item.sale.products.length} articles • {item.sale.total_ttc.toFixed(2)} €
              </Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.primary} onPress={() => handleResume(item.id, item.sale)}>
                  <Text style={styles.primaryText}>Reprendre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.danger} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.dangerText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { ...theme.typography.body, color: theme.colors.textSecondary },
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardTitle: { ...theme.typography.h3 },
  cardSub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  primary: { flex: 1, backgroundColor: theme.colors.success, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  primaryText: { ...theme.typography.button, color: theme.colors.textInverse },
  danger: { flex: 1, backgroundColor: theme.colors.error, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  dangerText: { ...theme.typography.button, color: theme.colors.textInverse },
});

