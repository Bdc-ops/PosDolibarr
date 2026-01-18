/**
 * Écran principal de la caisse (POS)
 * Affiche les catégories et produits disponibles
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { theme } from '../../src/theme/theme';
import { useI18n } from '../../src/i18n/I18nContext';
import { useCart } from '../../src/features/cart/CartContext';
import { CartProduct, DolibarrCategory, DolibarrProduct } from '../../src/types/product';
import { getCategories, getProductsByCategory, getProductsForPOS, searchProducts } from '../../src/api/products';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { useLayoutInfo } from '../../src/utils/layout';
import { savePendingSale } from '../../src/database/pendingSales';
function POSScreenContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const { products, total_ttc, subtotal, total_tax, updateProduct, removeProduct, addProduct, clearCart, createPendingSale, client, setClient } = useCart();
  const [categories, setCategories] = useState<DolibarrCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const metierConfig = getCurrentMetierConfig();
  const layout = useLayoutInfo();
  const isTabletLandscape = layout.deviceClass === 'tablet' && layout.isLandscape;
  // Catalogue (mode iPad split)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<DolibarrProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchResults, setSearchResults] = useState<DolibarrProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated, authLoading]);
  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      // getCategories() now normalizes ids; keep a small guard anyway
      const safe = (cats || []).filter((c: any) => c && typeof c.id === 'number' && typeof c.label === 'string');
      setCategories(safe);
      if (safe.length > 0 && selectedCategoryId === null) {
        setSelectedCategoryId(safe[0].id);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des catégories:', error);
      // Affiche un message d'erreur plus clair pour l'utilisateur
      if (error?.response?.status === 401) {
        Alert.alert(
          t('alerts.sessionExpired'),
          t('alerts.sessionExpiredMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert(
          t('alerts.error'),
          t('alerts.connectionError'),
          [{ text: t('alerts.retry'), onPress: loadCategories }, { text: t('common.cancel') }]
        );
      }
    } finally {
      setLoading(false);
    }
  };
  const loadCatalogProducts = async (categoryId: number | null) => {
    try {
      setCatalogLoading(true);
      let rows: DolibarrProduct[] = [];
      if (categoryId) {
        rows = await getProductsByCategory(categoryId);
      }
      if (!rows || rows.length === 0) {
        rows = await getProductsForPOS(200);
      }
      setCatalogProducts(rows || []);
    } catch (e) {
      console.error('Erreur chargement produits catalogue:', e);
      setCatalogProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };
  useEffect(() => {
    if (!isTabletLandscape) return;
    if (selectedCategoryId === null && categories.length === 0) return;
    void loadCatalogProducts(selectedCategoryId);
  }, [isTabletLandscape, selectedCategoryId]);

  // Recherche via API quand il y a une recherche
  useEffect(() => {
    if (!isTabletLandscape) return;
    const searchTerm = productSearch.trim();
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      try {
        setIsSearching(true);
        const results = await searchProducts(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Erreur recherche produits:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce : attendre 500ms après la dernière frappe
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [isTabletLandscape, productSearch]);
  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }
  const handleConfiguration = () => {
    router.push('/(app)/settings');
  };
  const filteredCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(search.trim().toLowerCase())
  );
  const paymentLabel = (code: string) => {
    if (code === 'LIQ' || code === 'CASH') return 'Espèces';
    if (code === 'CB') return 'Carte';
    if (code === 'CHQ' || code === 'CHEQUE') return 'Chèque';
    if (code === 'VIR') return 'Virement';
    return code;
  };
  const handleQuickPay = (code: string) => {
    if (products.length === 0) return;
    const pendingSaleId = Date.now().toString();
    router.push({
      pathname: '/(pos)/payment',
      params: { saleId: pendingSaleId, prefillType: code },
    });
  };
  const handleHold = async () => {
    if (products.length === 0) {
      Alert.alert(t('pos.emptyCart'), t('pos.emptyCartCannotHold'));
      return;
    }
    try {
      const pendingSale = createPendingSale();
      await savePendingSale(pendingSale);
      clearCart();
      Alert.alert(t('pos.holdSuccess'), t('pos.holdId', { id: pendingSale.id.slice(0, 8) }), [
        { text: t('common.ok') },
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise en attente:', error);
      Alert.alert(t('alerts.error'), t('pos.holdError'));
    }
  };
  const handleDiscount = () => {
    if (products.length === 0) {
      Alert.alert(t('pos.emptyCart'), t('pos.emptyCartCannotDiscount'));
      return;
    }
    router.push('/(pos)/discount');
  };
  const makeCartProductFromDolibarr = (p: DolibarrProduct): CartProduct => {
    const tva_tx = p.tva_tx || 0;
    const price = p.price || 0;
    const price_ttc = p.price_ttc || price * (1 + tva_tx / 100);
    return {
      id: p.id,
      ref: p.ref,
      label: p.label,
      price,
      price_ttc,
      tva_tx,
      quantity: 1,
      discount_amount: 0,
      discount_percent: 0,
      subtotal: price,
      subtotal_ttc: price_ttc,
      total: price,
      total_ttc: price_ttc,
    };
  };
  // Utiliser les résultats de recherche API si recherche active, sinon filtrer localement
  const hasActiveSearch = productSearch.trim().length >= 2;
  const filteredCatalogProducts = hasActiveSearch 
    ? searchResults 
    : catalogProducts.filter((p) => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return true;
        return (
          (p.label || '').toLowerCase().includes(q) ||
          (p.ref || '').toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q)
        );
      });
  
  if (isTabletLandscape) {
    return (
      <View style={styles.splitRoot}>
        {/* Left: catalogue */}
        <View style={styles.leftPane}>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerTitle}>{t('pos.title')}</Text>
                  <Text style={styles.headerSubtitle}>{t('pos.catalog')}</Text>
                </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton} onPress={handleConfiguration}>
                  <Text style={styles.iconButtonText}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('pos.searchProduct')}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.categoriesContainer}>
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      selectedCategoryId === item.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategoryId(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategoryId === item.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
            {catalogLoading || isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredCatalogProducts}
                keyExtractor={(item) => item.id.toString()}
                numColumns={viewMode === 'grid' ? 2 : 1}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => addProduct(makeCartProductFromDolibarr(item))}
                  >
                    <Text style={styles.productCardLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <Text style={styles.productCardRef}>{item.ref}</Text>
                    <Text style={styles.productCardPrice}>
                      {item.price_ttc?.toFixed(2) || '0.00'} €
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('pos.noProductsFound')}</Text>
                  </View>
                }
              />
            )}
          </View>
          {/* Right: panier */}
          <View style={styles.rightPane}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartHeaderTitle}>{t('pos.cart')}</Text>
              {products.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={styles.clearCartText}>{t('pos.clearCart')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {products.length === 0 ? (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>{t('pos.emptyCart')}</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={products}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  renderItem={({ item, index }) => (
                    <View style={styles.cartItem}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text style={styles.cartItemPrice}>
                          {item.price_ttc.toFixed(2)} € × {item.quantity}
                        </Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <TouchableOpacity
                          style={styles.cartItemButton}
                          onPress={() => updateProduct(index, { quantity: Math.max(0, item.quantity - 1) })}
                        >
                          <Text style={styles.cartItemButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.cartItemButton}
                          onPress={() => updateProduct(index, { quantity: item.quantity + 1 })}
                        >
                          <Text style={styles.cartItemButtonText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cartItemRemove}
                          onPress={() => removeProduct(index)}
                        >
                          <Text style={styles.cartItemRemoveText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
                <View style={styles.cartFooter}>
                  <View style={styles.cartTotalRow}>
                    <Text style={styles.cartTotalLabel}>{t('pos.totalTtc')}</Text>
                    <Text style={styles.cartTotalValue}>{total_ttc.toFixed(2)} €</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={() => {
                      const pendingSale = createPendingSale();
                      router.push({
                        pathname: '/(pos)/payment',
                        params: { saleId: pendingSale.id },
                      });
                    }}
                  >
                    <Text style={styles.paymentButtonText}>{t('pos.pay')}</Text>
                  </TouchableOpacity>
                  {metierConfig.options.activerMiseEnAttente && (
                    <TouchableOpacity style={styles.holdButton} onPress={handleHold}>
                      <Text style={styles.holdButtonText}>{t('pos.hold')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      );
    }

    // Mode téléphone / portrait
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('pos.title')}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleConfiguration}>
            <Text style={styles.iconButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('pos.searchCategory')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryRow}
              onPress={() => router.push({ pathname: '/(pos)/products', params: { categoryId: item.id.toString() } })}
            >
              <Text style={styles.categoryLabel}>{item.label}</Text>
              <Text style={styles.categoryArrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
}

export default POSScreenContent;

const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
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
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.textInverse,
    },
    iconButton: {
      padding: theme.spacing.sm,
    },
    iconButtonText: {
      fontSize: 24,
    },
    searchInput: {
      backgroundColor: theme.colors.backgroundSecondary,
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      ...theme.typography.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      backgroundColor: theme.colors.background,
    },
    categoryLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
    },
    categoryArrow: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      fontSize: 20,
    },
    splitRoot: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    leftPane: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    headerSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    categoriesContainer: {
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    categoryChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.backgroundSecondary,
      marginLeft: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryChipText: {
      ...theme.typography.bodySmall,
      color: theme.colors.text,
    },
    categoryChipTextActive: {
      color: theme.colors.textInverse,
    },
    productCard: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    productCardLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    productCardRef: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    productCardPrice: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      marginTop: theme.spacing.xs,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    rightPane: {
      width: 350,
      backgroundColor: theme.colors.backgroundSecondary,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
    cartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.primary,
    },
    cartHeaderTitle: {
      ...theme.typography.h2,
      color: theme.colors.textInverse,
    },
    clearCartText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
    emptyCartContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyCartText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    cartItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    cartItemInfo: {
      flex: 1,
    },
    cartItemLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    cartItemPrice: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    cartItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    cartItemButton: {
      width: 28,
      height: 28,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cartItemButtonText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
      fontSize: 16,
    },
    cartItemQuantity: {
      ...theme.typography.body,
      color: theme.colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    cartItemRemove: {
      width: 28,
      height: 28,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.xs,
    },
    cartItemRemoveText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
      fontSize: 20,
    },
    cartFooter: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    cartTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
    },
    cartTotalLabel: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    cartTotalValue: {
      ...theme.typography.h2,
      color: theme.colors.primary,
    },
    paymentButton: {
      backgroundColor: theme.colors.success,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      ...theme.shadows.md,
    },
    paymentButtonText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
      fontSize: 18,
    },
    holdButton: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    holdButtonText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
  });
