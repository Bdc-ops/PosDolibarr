import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { useCart } from '../../src/features/cart/CartContext';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';

export default function DiscountScreen() {
  const { lineIndex } = useLocalSearchParams<{ lineIndex?: string }>();
  const metier = getCurrentMetierConfig();
  const cart = useCart();

  const parsedLineIndex = useMemo(() => {
    if (lineIndex === undefined) return null;
    const n = Number(lineIndex);
    return Number.isFinite(n) ? n : null;
  }, [lineIndex]);

  const isLine = parsedLineIndex !== null;
  const targetProduct = isLine ? cart.products[parsedLineIndex!] : null;

  const [mode, setMode] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState<string>('');

  const handleApply = () => {
    const n = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Remise', 'Valeur invalide');
      return;
    }

    if (!metier.options.activerRemises) {
      Alert.alert('Remise', 'Fonction désactivée par configuration métier.');
      return;
    }

    if (isLine) {
      if (!targetProduct) {
        Alert.alert('Remise', 'Ligne introuvable');
        return;
      }
      if (mode === 'percent') cart.setLineDiscountPercent(parsedLineIndex!, n);
      else cart.setLineDiscountAmount(parsedLineIndex!, n);
    } else {
      if (mode === 'percent') cart.setGlobalDiscountPercent(n);
      else cart.setGlobalDiscountAmount(n);
    }

    router.back();
  };

  const handleClear = () => {
    if (isLine) {
      if (targetProduct) {
        cart.updateProduct(parsedLineIndex!, { discount_amount: 0, discount_percent: 0 });
      }
    } else {
      cart.clearGlobalDiscounts();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isLine ? 'Remise ligne' : 'Remise globale'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLine && targetProduct && (
        <View style={styles.card}>
          <Text style={styles.lineTitle}>{targetProduct.label}</Text>
          <Text style={styles.lineSubtitle}>
            {targetProduct.quantity} × {targetProduct.price_ttc.toFixed(2)} € TTC
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Type</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, mode === 'percent' && styles.toggleActive]}
            onPress={() => setMode('percent')}
          >
            <Text style={[styles.toggleText, mode === 'percent' && styles.toggleTextActive]}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, mode === 'amount' && styles.toggleActive]}
            onPress={() => setMode('amount')}
          >
            <Text style={[styles.toggleText, mode === 'amount' && styles.toggleTextActive]}>€</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Valeur</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={mode === 'percent' ? 'ex: 10' : 'ex: 5.00'}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleApply}>
          <Text style={styles.primaryBtnText}>Appliquer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleClear}>
          <Text style={styles.secondaryBtnText}>Supprimer la remise</Text>
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
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  lineTitle: { ...theme.typography.h3, color: theme.colors.text },
  lineSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  sectionTitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.md },
  toggleRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  toggle: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  toggleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  toggleText: { ...theme.typography.button, color: theme.colors.text },
  toggleTextActive: { color: theme.colors.textInverse },
  input: {
    marginTop: theme.spacing.sm,
    minHeight: 56,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    fontSize: 16,
    backgroundColor: theme.colors.background,
  },
  primaryBtn: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: { ...theme.typography.button, color: theme.colors.textInverse },
  secondaryBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: { ...theme.typography.button, color: theme.colors.text },
});

