/**
 * Écran de liste des produits par catégorie
 * Affiche les produits d'une catégorie et permet de les ajouter au panier
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../src/features/cart/CartContext';
import { theme } from '../../src/theme/theme';
import { DolibarrProduct, CartProduct } from '../../src/types/product';
import { getProductsByCategory, getProductsForPOS } from '../../src/api/products';
import { useLayoutInfo } from '../../src/utils/layout';

export default function ProductsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();
  const { addProduct, products: cartProducts, total_ttc } = useCart();
  const [products, setProducts] = useState<DolibarrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const layout = useLayoutInfo();
  const [fallbackAll, setFallbackAll] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [categoryId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let results: DolibarrProduct[] = [];
      setFallbackAll(false);

      if (categoryId) {
        results = await getProductsByCategory(parseInt(categoryId, 10));
        if (!results || results.length === 0) {
          // Fallback: afficher tous les produits vendables
          results = await getProductsForPOS(200);
          setFallbackAll(true);
        }
      } else {
        results = await getProductsForPOS(200);
      }

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(pos)/products.tsx:63',message:'ProductsScreen loaded',data:{hasCategoryId:!!categoryId,categoryId:categoryId?Number.parseInt(String(categoryId),10):null,count:results?.length||0,fallbackAll},timestamp:Date.now(),sessionId:'debug-session',runId:'products-debug',hypothesisId:'S'})}).catch(()=>{});
      // #endregion

      setProducts(results);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: DolibarrProduct) => {
    const tva_tx = typeof product.tva_tx === 'number' ? product.tva_tx : Number.parseFloat(String((product as any)?.tva_tx ?? 0).replace(',', '.')) || 0;
    const price = typeof product.price === 'number' ? product.price : Number.parseFloat(String((product as any)?.price ?? 0).replace(',', '.')) || 0;
    const rawTtc = (product as any)?.price_ttc;
    const price_ttc = typeof rawTtc === 'number' ? rawTtc : Number.parseFloat(String(rawTtc ?? '').replace(',', '.'));
    const effectiveTtc = Number.isFinite(price_ttc) ? (price_ttc as number) : price * (1 + tva_tx / 100);

    const cartProduct: CartProduct = {
      id: product.id,
      ref: product.ref,
      label: product.label,
      price,
      price_ttc: effectiveTtc,
      tva_tx,
      quantity: 1,
      discount_amount: 0,
      discount_percent: 0,
      subtotal: price,
      subtotal_ttc: effectiveTtc,
      total: price,
      total_ttc: effectiveTtc,
    };

    addProduct(cartProduct);
  };

  const renderProduct = ({ item }: { item: DolibarrProduct }) => {
    const priceTtcNum = Number.parseFloat(String((item as any)?.price_ttc ?? (item as any)?.price ?? 0).replace(',', '.'));
    const price_ttc = Number.isFinite(priceTtcNum) ? priceTtcNum : 0;
    const stockReel = typeof item.stock_reel === 'number' ? item.stock_reel : null;
    const stockAvail = typeof item.stock_available === 'number' ? item.stock_available : null;
    const stock = (stockReel ?? stockAvail ?? 0) as number;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleAddProduct(item)}
        disabled={stock <= 0 && item.tosell === 1}
      >
        {item.product_image ? (
          <Image source={{ uri: item.product_image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageText}>📦</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.label}
          </Text>
          <Text style={styles.productRef}>{item.ref}</Text>
          <Text style={styles.productPrice}>{price_ttc.toFixed(2)} € TTC</Text>
          <View style={styles.stockRow}>
            <Text style={styles.productStock}>
              Stock: {stockReel ?? stockAvail ?? '—'}
            </Text>
            {stock <= 0 && item.tosell === 1 && <Text style={styles.productUnavailable}>Rupture</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.label || '').toLowerCase().includes(q) ||
      (p.ref || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryName || 'Produits'}</Text>
          <Text style={styles.headerSubtitle}>{filtered.length} articles</Text>
        </View>
        <TouchableOpacity style={styles.cartPill} onPress={() => router.push('/(pos)/cart')}>
          <Text style={styles.cartPillText}>{cartProducts.length} • {total_ttc.toFixed(2)} €</Text>
        </TouchableOpacity>
      </View>

      {fallbackAll && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Aucun produit dans cette catégorie → affichage de tous les produits.</Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un produit (nom, ref, code-barres)…"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearSearch}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        numColumns={layout.productColumns}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
          </View>
        }
      />
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
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 18,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  headerSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.85,
    marginTop: theme.spacing.xs,
  },
  cartPill: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  cartPillText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  searchRow: {
    margin: theme.spacing.lg,
    minHeight: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  clearSearch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundTertiary,
  },
  clearSearchText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  productsList: {
    padding: theme.spacing.sm,
  },
  productCard: {
    flex: 1,
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageText: {
    fontSize: 48,
  },
  productInfo: {
    padding: theme.spacing.sm,
  },
  productName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  productRef: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  productStock: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
  productUnavailable: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  banner: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.warning + '22',
    borderWidth: 1,
    borderColor: theme.colors.warning + '55',
  },
  bannerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
