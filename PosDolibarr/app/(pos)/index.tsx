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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { theme } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { useI18n } from '../../src/i18n/I18nContext';
import { useCart } from '../../src/features/cart/CartContext';
import { CartProduct, DolibarrCategory, DolibarrProduct } from '../../src/types/product';
import { getCategories, getProductsByCategory, getProductsForPOS, searchProducts } from '../../src/api/products';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { useLayoutInfo } from '../../src/utils/layout';
import { savePendingSale } from '../../src/database/pendingSales';
function POSScreenContent() {
  const { isAuthenticated, isLoading: authLoading, logout, userLogin } = useAuth();
  const { t, language, setLanguage, languages } = useI18n();
  const { themeName, setThemeName } = useTheme();
  const { products, total_ttc, subtotal, total_tax, updateProduct, removeProduct, addProduct, clearCart, createPendingSale, client, setClient } = useCart();
  const [categories, setCategories] = useState<DolibarrCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<number, number>>({});
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
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Mettre à jour l'heure chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
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
      // Attendre un peu pour s'assurer que le client API est initialisé
      await new Promise((resolve) => setTimeout(resolve, 100));
      const cats = await getCategories();
      // getCategories() now normalizes ids; keep a small guard anyway
      const safe = (cats || []).filter((c: any) => c && typeof c.id === 'number' && typeof c.label === 'string');
      setCategories(safe);
      // Charger le nombre de produits par catégorie
      if (safe.length > 0) {
        const counts: Record<number, number> = {};
        await Promise.all(
          safe.map(async (cat) => {
            try {
              const products = await getProductsByCategory(cat.id);
              counts[cat.id] = products.length;
            } catch (e) {
              counts[cat.id] = 0;
            }
          })
        );
        setCategoryProductCounts(counts);
      }
      // Charger les produits après avoir chargé les catégories
      // Si aucune catégorie n'est sélectionnée (null), charger tous les produits (Toutes les catégories)
      if (isTabletLandscape && safe.length > 0) {
        // Petit délai pour laisser le state se mettre à jour
        setTimeout(() => {
          loadCatalogProducts(selectedCategoryId);
        }, 200);
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
      console.log('[POS] loadCatalogProducts called with categoryId:', categoryId);
      let rows: DolibarrProduct[] = [];
      if (categoryId) {
        // Charger les produits de la catégorie spécifique
        console.log('[POS] Loading products for category:', categoryId);
        rows = await getProductsByCategory(categoryId);
      } else {
        // Charger tous les produits si aucune catégorie n'est sélectionnée (Toutes les catégories)
        console.log('[POS] Loading all products (no category selected)');
        rows = await getProductsForPOS(200);
      }
      console.log('[POS] Products loaded:', rows?.length || 0);
      setCatalogProducts(rows || []);
    } catch (e: any) {
      console.error('[POS] Erreur chargement produits catalogue:', e);
      console.error('[POS] Error details:', e?.response?.data || e?.message);
      setCatalogProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };
  useEffect(() => {
    if (!isTabletLandscape) return;
    // Attendre que les catégories soient chargées avant de charger les produits
    if (categories.length === 0 && loading) return;
    // Ne charger que si les catégories sont chargées
    if (categories.length === 0) return;
    // Charger les produits même si selectedCategoryId est null (Toutes les catégories)
    console.log('[POS] Loading products for category:', selectedCategoryId);
    void loadCatalogProducts(selectedCategoryId);
  }, [isTabletLandscape, selectedCategoryId, categories.length, loading]);

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
  const handleChangeVendor = () => {
    Alert.alert(
      t('pos.changeVendor'),
      t('pos.changeVendorConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };
  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logoutButton'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
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
          {/* Colonne des catégories à gauche */}
          <View style={styles.categoriesColumn}>
            <View style={styles.categoriesHeader}>
              <Text style={styles.categoriesHeaderTitle}>{t('settings.categories')}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.allCategoriesButton,
                selectedCategoryId === null && styles.allCategoriesButtonActive,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.allCategoriesButtonText,
                  selectedCategoryId === null && styles.allCategoriesButtonTextActive,
                ]}
              >
                {t('pos.allCategories')}
              </Text>
            </TouchableOpacity>
            {loading || categories.length === 0 ? (
              <View style={styles.categoriesLoadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.categoriesLoadingText}>
                  {loading ? t('common.loading') : t('pos.noProductsFound')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryRow,
                      selectedCategoryId === item.id && styles.categoryRowActive,
                    ]}
                    onPress={() => setSelectedCategoryId(item.id)}
                  >
                    <View style={styles.categoryRowContent}>
                      <Text
                        style={[
                          styles.categoryRowText,
                          selectedCategoryId === item.id && styles.categoryRowTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {categoryProductCounts[item.id] !== undefined && (
                        <Text
                          style={[
                            styles.categoryRowCount,
                            selectedCategoryId === item.id && styles.categoryRowCountActive,
                          ]}
                        >
                          ({categoryProductCounts[item.id]})
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                style={styles.categoriesList}
              />
            )}
          </View>
          
          {/* Zone produits à droite des catégories */}
          <View style={styles.productsArea}>
          <View style={styles.header}>
            {/* Barre d'informations utilisateur en haut */}
            <View style={styles.headerInfoBar}>
              <View style={styles.headerInfoLeft}>
                <Text style={styles.headerInfoText}>
                  {userLogin || 'Utilisateur'}
                </Text>
              </View>
              <View style={styles.headerInfoRight}>
                <Text style={styles.headerInfoText}>
                  {currentDateTime.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
                <Text style={styles.headerInfoTime}>
                  {currentDateTime.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Caisse Dolibarr by apps-dev.fr</Text>
                <View style={styles.headerIconsRow}>
                  {/* Bouton langue */}
                  <View style={styles.headerIconContainer}>
                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={() => setShowLanguageModal(true)}
                    >
                      <Text style={styles.headerIconText}>
                        {languages.find((l) => l.code === language)?.flag || '🌐'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Bouton thème */}
                  <View style={styles.headerIconContainer}>
                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={() => setShowThemeModal(true)}
                    >
                      <Text style={styles.headerIconText}>
                        {themeName === 'default' ? '🎨' : themeName === 'black' ? '⚫' : themeName === 'pastels' ? '🌸' : '🚀'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Bouton configuration */}
                  <View style={styles.headerIconContainer}>
                    <TouchableOpacity style={styles.headerIconButton} onPress={handleConfiguration}>
                      <Text style={styles.headerIconText}>⚙</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Bouton changer de vendeur */}
                  <View style={styles.headerIconContainer}>
                    <TouchableOpacity style={styles.headerIconButton} onPress={handleChangeVendor}>
                      <Text style={styles.headerIconText}>👤</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Bouton déconnexion */}
                  <View style={styles.headerIconContainer}>
                    <TouchableOpacity style={styles.headerIconButton} onPress={handleLogout}>
                      <Text style={styles.headerIconText}>🚪</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Modal sélection langue */}
            <Modal
              visible={showLanguageModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowLanguageModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowLanguageModal(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                    <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={languages}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.modalOption,
                          language === item.code && styles.modalOptionActive,
                        ]}
                        onPress={() => {
                          setLanguage(item.code);
                          setShowLanguageModal(false);
                        }}
                      >
                        <Text style={styles.modalOptionFlag}>{item.flag}</Text>
                        <Text
                          style={[
                            styles.modalOptionText,
                            language === item.code && styles.modalOptionTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {language === item.code && (
                          <Text style={styles.modalOptionCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
            
            {/* Modal sélection thème */}
            <Modal
              visible={showThemeModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowThemeModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowThemeModal(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('settings.theme') || 'Thème'}</Text>
                    <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={[
                      { code: 'default', name: t('settings.themeDefault') || 'Par défaut', icon: '🎨' },
                      { code: 'black', name: t('settings.themeBlack') || 'Noir', icon: '⚫' },
                      { code: 'pastels', name: t('settings.themePastels') || 'Pastels', icon: '🌸' },
                      { code: 'futuristes', name: t('settings.themeFuturistic') || 'Futuriste', icon: '🚀' },
                    ]}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.modalOption,
                          themeName === item.code && styles.modalOptionActive,
                        ]}
                        onPress={() => {
                          setThemeName(item.code as any);
                          setShowThemeModal(false);
                        }}
                      >
                        <Text style={styles.modalOptionFlag}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.modalOptionText,
                            themeName === item.code && styles.modalOptionTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {themeName === item.code && (
                          <Text style={styles.modalOptionCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
            
            <TextInput
              style={styles.searchInput}
              placeholder={t('pos.searchProduct')}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholderTextColor={theme.colors.textSecondary}
            />
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
                    {(item.stock_reel !== undefined && item.stock_reel !== null) || 
                     (item.stock_available !== undefined && item.stock_available !== null) ? (
                      <View style={styles.productStockBadge}>
                        <Text style={styles.productStockBadgeText}>
                          {(item.stock_available ?? item.stock_reel ?? 0).toFixed(0)}
                        </Text>
                      </View>
                    ) : null}
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
        </View>
        <View style={styles.rightPane}>
          {/* Right: panier */}
          <View style={styles.cartHeader}>
              <Text style={styles.cartHeaderTitle}>{t('pos.cart')}</Text>
              {products.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={styles.clearCartText}>{t('pos.clearCart')}</Text>
                </TouchableOpacity>
              )}
          </View>
          {metierConfig.options.activerClients && (
            <View style={styles.clientSection}>
              <TouchableOpacity
                style={styles.clientButton}
                onPress={() => router.push('/(pos)/clients')}
              >
                <Text style={styles.clientButtonText}>
                  {client ? client.name : t('pos.selectClient')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
                  <View style={styles.quickPayButtons}>
                    <TouchableOpacity
                      style={styles.quickPayButton}
                      onPress={() => handleQuickPay('CASH')}
                    >
                      <Text style={styles.quickPayButtonText}>💰 {t('payment.cash')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickPayButton}
                      onPress={() => handleQuickPay('CB')}
                    >
                      <Text style={styles.quickPayButtonText}>💳 {t('payment.card')}</Text>
                    </TouchableOpacity>
                  </View>
                  {metierConfig.options.activerRemises && (
                    <TouchableOpacity style={styles.discountButton} onPress={handleDiscount}>
                      <Text style={styles.discountButtonText}>{t('pos.discount')}</Text>
                    </TouchableOpacity>
                  )}
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
          {/* Barre d'informations utilisateur en haut */}
          <View style={styles.headerInfoBar}>
            <View style={styles.headerInfoLeft}>
              <Text style={styles.headerInfoText}>
                {userLogin || 'Utilisateur'}
              </Text>
            </View>
            <View style={styles.headerInfoRight}>
              <Text style={styles.headerInfoText}>
                {currentDateTime.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              <Text style={styles.headerInfoTime}>
                {currentDateTime.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Caisse Dolibarr by apps-dev.fr</Text>
              <View style={styles.headerIconsRow}>
                {/* Bouton langue */}
                <View style={styles.headerIconContainer}>
                  <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => setShowLanguageModal(true)}
                  >
                    <Text style={styles.headerIconText}>
                      {languages.find((l) => l.code === language)?.flag || '🌐'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Bouton thème */}
                <View style={styles.headerIconContainer}>
                  <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => setShowThemeModal(true)}
                  >
                    <Text style={styles.headerIconText}>
                      {themeName === 'default' ? '🎨' : themeName === 'black' ? '⚫' : themeName === 'pastels' ? '🌸' : '🚀'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Bouton configuration */}
                <View style={styles.headerIconContainer}>
                  <TouchableOpacity style={styles.headerIconButton} onPress={handleConfiguration}>
                    <Text style={styles.headerIconText}>⚙</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Bouton changer de vendeur */}
                <View style={styles.headerIconContainer}>
                  <TouchableOpacity style={styles.headerIconButton} onPress={handleChangeVendor}>
                    <Text style={styles.headerIconText}>👤</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Bouton déconnexion */}
                <View style={styles.headerIconContainer}>
                  <TouchableOpacity style={styles.headerIconButton} onPress={handleLogout}>
                    <Text style={styles.headerIconText}>🚪</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
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
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  headerInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
  },
  headerInfoLeft: {
    flex: 1,
  },
  headerInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    flex: 2,
    justifyContent: 'flex-end',
  },
  headerInfoText: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    opacity: 0.95,
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfoTime: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 20,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 20,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 22,
    color: theme.colors.textInverse,
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
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  categoriesColumn: {
    width: 220,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    flexShrink: 0,
  },
  categoriesHeader: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoriesHeaderTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  allCategoriesButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  allCategoriesButtonActive: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.primary,
    borderTopColor: theme.colors.primary,
  },
  allCategoriesButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  allCategoriesButtonTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  categoriesLoadingContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesLoadingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  categoriesList: {
    flex: 1,
  },
  productsArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerIconContainer: {
    padding: 0,
  },
  headerIconButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.sm,
    minWidth: 36,
    minHeight: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerIconText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    padding: theme.spacing.xs,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  modalOptionActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  modalOptionFlag: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  modalOptionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  modalOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalOptionCheck: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  categoryRowActive: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.primary,
  },
  categoryRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  categoryRowText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  categoryRowTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  categoryRowCount: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontSize: 12,
  },
  categoryRowCountActive: {
    color: theme.colors.textInverse,
    opacity: 0.8,
  },
  productCard: {
    position: 'relative',
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
  productStockBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: '#10b981',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  productStockBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  clientSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    textAlign: 'center',
  },
  quickPayButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  quickPayButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickPayButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 14,
  },
  discountButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  discountButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});
