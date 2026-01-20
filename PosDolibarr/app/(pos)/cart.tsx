/**
 * Écran du panier de vente
 * Affiche les produits ajoutés, permet modification, remises, sélection client
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../../src/features/cart/CartContext';
import { theme } from '../../src/theme/theme';
import { CartProduct } from '../../src/types/pos';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { useAuth } from '../../src/auth/AuthContext';

export default function CartScreen() {
  const {
    products,
    client,
    subtotal,
    subtotal_ttc,
    total_discount,
    total_tax,
    total,
    total_ttc,
    updateProduct,
    removeProduct,
    clearCart,
    setClient,
    createPendingSale,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const metierConfig = getCurrentMetierConfig();
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});

  const handleQuantityChange = (index: number, value: string) => {
    setQuantityInputs((prev) => ({ ...prev, [index]: value }));
    const qty = parseFloat(value);
    if (!isNaN(qty) && qty > 0) {
      updateProduct(index, { quantity: qty });
    }
  };

  const handleRemove = (index: number) => {
    Alert.alert('Confirmer', 'Supprimer ce produit du panier ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => removeProduct(index),
      },
    ]);
  };

  const handleCancel = () => {
    if (products.length === 0) {
      router.back();
      return;
    }

    Alert.alert('Confirmer', 'Annuler cette vente et vider le panier ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: () => {
          clearCart();
          router.back();
        },
      },
    ]);
  };

  const handleProceedToPayment = () => {
    if (metierConfig.options.clientObligatoire && !client) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client pour continuer.');
      return;
    }

    const pendingSale = createPendingSale();
    router.push({
      pathname: '/(pos)/payment',
      params: { saleId: pendingSale.id },
    });
  };

  const handleSplit = () => {
    router.push('/(pos)/split');
  };

  const renderProduct = ({ item, index }: { item: CartProduct; index: number }) => {
    const inputValue = quantityInputs[index] ?? item.quantity.toString();

    return (
      <View style={styles.productRow}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.label}</Text>
          <Text style={styles.productRef}>{item.ref}</Text>
          <Text style={styles.productPrice}>
            {item.price_ttc.toFixed(2)} € TTC ({item.tva_tx}% TVA)
          </Text>
          {metierConfig.options.activerRemises && (item.discount_amount > 0 || item.discount_percent > 0) && (
            <Text style={styles.discountInfo}>
              Remise ligne: -{item.discount_amount.toFixed(2)} € ({item.discount_percent.toFixed(1)}%)
            </Text>
          )}
        </View>

        <View style={styles.productActions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateProduct(index, { quantity: Math.max(0, item.quantity - 1) })}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={inputValue}
              onChangeText={(value) => handleQuantityChange(index, value)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateProduct(index, { quantity: item.quantity + 1 })}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productTotal}>{item.total_ttc.toFixed(2)} €</Text>

          {metierConfig.options.activerRemises && (
            <TouchableOpacity
              style={styles.discountButton}
              onPress={() => router.push({ pathname: '/(pos)/discount', params: { lineIndex: index.toString() } })}
            >
              <Text style={styles.discountButtonText}>Remise</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(index)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panier</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Client (si activé) */}
        {metierConfig.options.activerClients && (
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Client</Text>
            <TouchableOpacity
              style={styles.clientButton}
              onPress={() => router.push('/(pos)/clients')}
            >
              <Text style={styles.clientButtonText}>
                {client ? client.name : 'Sélectionner un client'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Liste des produits */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Produits ({products.length})</Text>
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Le panier est vide</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderProduct}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Totaux */}
        {products.length > 0 && (
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total HT</Text>
              <Text style={styles.totalValue}>{subtotal.toFixed(2)} €</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>{total_tax.toFixed(2)} €</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total TTC</Text>
              <Text style={styles.totalValue}>{subtotal_ttc.toFixed(2)} €</Text>
            </View>
            {total_discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -{total_discount.toFixed(2)} €
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalFinalRow]}>
              <Text style={styles.totalFinalLabel}>TOTAL TTC</Text>
              <Text style={styles.totalFinalValue}>{total_ttc.toFixed(2)} €</Text>
            </View>

            {metierConfig.options.activerRemises && (
              <TouchableOpacity
                style={styles.globalDiscountButton}
                onPress={() => router.push('/(pos)/discount')}
              >
                <Text style={styles.globalDiscountButtonText}>Remise globale</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer avec bouton paiement */}
      {products.length > 0 && (
        <View style={styles.footer}>
          {metierConfig.options.activerMiseEnAttente && metierConfig.options.activerRepriseTicket && (
            <TouchableOpacity style={styles.splitButton} onPress={handleSplit}>
              <Text style={styles.splitButtonText}>Split</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handleProceedToPayment}
          >
            <Text style={styles.paymentButtonText}>
              Procéder au paiement ({total_ttc.toFixed(2)} €)
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  cancelButton: {
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
  clientSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  clientButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clientButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  productsSection: {
    padding: theme.spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  productRef: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  productPrice: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  discountInfo: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  productActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
  },
  quantityInput: {
    width: 50,
    height: 32,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    textAlign: 'center',
    ...theme.typography.body,
  },
  productTotal: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  removeButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  discountButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
  },
  removeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 24,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  totalsSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
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
    color: theme.colors.success,
  },
  totalFinalRow: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  totalFinalLabel: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  totalFinalValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  globalDiscountButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  globalDiscountButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  splitButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  splitButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  paymentButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
  },
});
