import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/colors';
import { getProducts } from '../services/api';
import { isOnline } from '../services/network';
import { getLowStockThreshold, saveLowStockThreshold } from '../services/storage';
import { getProductName, getProductRef, hasProductName } from '../utils/productHelpers';
import { formatStock, getStockColorSync, getStockValue, updateThresholdCache } from '../utils/stockHelpers';

// 🔧 MODE DEBUG : Mettre à true pour afficher les données brutes des produits
// Permet de voir la structure exacte renvoyée par l'API Dolibarr
// Pour activer : changer false en true ci-dessous
const DEBUG = false;

/**
 * Écran du catalogue des produits
 * Affiche la liste de tous les produits Dolibarr
 * Permet de naviguer vers les détails d'un produit
 * Bouton pour accéder au scanner
 */
export default function CatalogueScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // États pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null); // null = toutes, sinon label/category
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    checkNetworkStatus();
    loadProducts();
    loadLowStockThreshold();
  }, []);

  /**
   * Charge le seuil de stock faible depuis la configuration
   */
  const loadLowStockThreshold = async () => {
    try {
      const threshold = await getLowStockThreshold();
      setLowStockThreshold(threshold);
      updateThresholdCache(threshold);
    } catch (error) {
      console.error('Erreur chargement seuil stock faible:', error);
    }
  };

  // Vérifier le statut réseau quand l'écran est focus
  useFocusEffect(
    React.useCallback(() => {
      checkNetworkStatus();
    }, [])
  );

  /**
   * Vérifie le statut de la connexion réseau
   */
  const checkNetworkStatus = async () => {
    const online = await isOnline();
    setIsOffline(!online);
    
    // Si on revient en ligne, recharger les produits
    if (online && !isOffline) {
      loadProducts();
    }
  };

  /**
   * Charge la liste des produits depuis l'API ou le cache
   */
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const online = await isOnline();
      setIsOffline(!online);
      
      const data = await getProducts(true); // Utiliser le cache si offline
      // S'assurer que data est un tableau
      const productsArray = Array.isArray(data) ? data : [];
      
      // Images désactivées pour l'instant
      // enrichProductsWithImages(productsArray);
      
      // Extraire les catégories/labels uniques
      const categories = extractCategories(productsArray);
      setAvailableCategories(categories);
      
      setProducts(productsArray);
      setFilteredProducts(productsArray);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des produits';
      setError(errorMessage);
      console.error('Erreur chargement produits:', err);
      
      // Si erreur et qu'on est offline, essayer le cache
      if (errorMessage.includes('hors ligne') || errorMessage.includes('offline')) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction désactivée - téléchargement d'images désactivé
   * Enrichit les produits avec les images (téléchargées et mises en cache)
   * Fonction asynchrone qui ne bloque pas l'affichage
   */
  // const enrichProductsWithImages = async (productsArray) => {
  //   const { getProductImage } = await import('../services/productImageService');
  //   
  //   // Enrichir les produits avec les images (max 10 pour ne pas surcharger)
  //   const productsToEnrich = productsArray.slice(0, 10);
  //   
  //   for (const product of productsToEnrich) {
  //     try {
  //       const imagePath = await getProductImage(product);
  //       if (imagePath) {
  //         product.imageUrl = imagePath; // Chemin local du fichier
  //         // Mettre à jour l'état pour ce produit spécifique
  //         setProducts(prev => prev.map(p => p.id === product.id ? { ...p, imageUrl: imagePath } : p));
  //         setFilteredProducts(prev => prev.map(p => p.id === product.id ? { ...p, imageUrl: imagePath } : p));
  //       }
  //     } catch (error) {
  //       // Ignorer les erreurs d'image, ne pas bloquer
  //       console.log('Erreur récupération image produit:', product.id, error);
  //     }
  //   }
  // };

  /**
   * Extrait les catégories/labels uniques des produits
   */
  const extractCategories = (productsList) => {
    const categoriesSet = new Set();
    productsList.forEach(product => {
      // Vérifier le label
      if (product.label && product.label.trim()) {
        categoriesSet.add(product.label.trim());
      }
      // Vérifier les catégories (peut être un tableau ou une chaîne)
      if (product.categories) {
        if (Array.isArray(product.categories)) {
          product.categories.forEach(cat => {
            if (cat && typeof cat === 'object' && cat.label) {
              categoriesSet.add(cat.label.trim());
            } else if (cat && typeof cat === 'string') {
              categoriesSet.add(cat.trim());
            }
          });
        } else if (typeof product.categories === 'string') {
          categoriesSet.add(product.categories.trim());
        }
      }
    });
    return Array.from(categoriesSet).sort();
  };

  /**
   * Filtre et recherche les produits
   */
  useEffect(() => {
    let filtered = [...products];

    // Filtre par recherche textuelle
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const name = getProductName(product).toLowerCase();
        const ref = getProductRef(product)?.toLowerCase() || '';
        const label = (product.label || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        return name.includes(query) || 
               ref.includes(query) || 
               label.includes(query) ||
               description.includes(query);
      });
    }

    // Filtre par catégorie/label
    if (categoryFilter) {
      filtered = filtered.filter(product => {
        // Vérifier le label
        if (product.label && product.label.trim() === categoryFilter) {
          return true;
        }
        // Vérifier les catégories
        if (product.categories) {
          if (Array.isArray(product.categories)) {
            return product.categories.some(cat => {
              if (cat && typeof cat === 'object' && cat.label) {
                return cat.label.trim() === categoryFilter;
              }
              return cat && typeof cat === 'string' && cat.trim() === categoryFilter;
            });
          }
          return typeof product.categories === 'string' && product.categories.trim() === categoryFilter;
        }
        return false;
      });
    }

    // Filtre par stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const stock = getStockValue(product);
        switch (stockFilter) {
          case 'in_stock':
            return stock > 0;
            case 'low_stock':
              return stock > 0 && stock < lowStockThreshold;
          case 'out_of_stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    // Filtre pour cacher les produits à stock 0 (appliqué après les autres filtres)
    // Ne pas l'appliquer si le filtre "Rupture" est sélectionné
    if (hideZeroStock && stockFilter !== 'out_of_stock') {
      filtered = filtered.filter(product => {
        const stock = getStockValue(product);
        return stock > 0;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, stockFilter, hideZeroStock, categoryFilter, lowStockThreshold]);

  /**
   * Gère le clic sur un produit
   * Navigue vers l'écran de détails
   */
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  /**
   * Rend un élément de la liste
   * Utilise getProductName() pour extraire le nom selon la priorité Dolibarr :
   * label > name > ref (jamais "Sans nom")
   */
  const renderProduct = ({ item }) => {
    // Utiliser la fonction utilitaire pour extraire le nom
    const productName = getProductName(item);
    const productRef = getProductRef(item);
    const hasFullName = hasProductName(item);
    const stock = getStockValue(item);
    const stockColor = getStockColorSync(stock);
    
    // Afficher la référence en sous-titre seulement si on a un nom complet
    const displaySubtitle = hasFullName && productRef ? `Réf: ${productRef}` : null;

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        {/* Image ou icône produit */}
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              contentFit="cover"
              placeholderContentFit="cover"
            />
          ) : (
            <Ionicons name="cube-outline" size={32} color={Colors.textSecondary} />
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          {displaySubtitle && (
            <Text style={styles.productRef} numberOfLines={1}>
              {displaySubtitle}
            </Text>
          )}
          {/* Badge stock */}
          <View style={styles.stockBadge}>
            <View style={[styles.stockIndicator, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: stockColor }]}>
              Stock: {formatStock(stock)}
            </Text>
          </View>
        </View>
        <View style={styles.productArrow}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.success} />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bannière offline industrielle */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineBannerContent}>
            <Ionicons name="warning" size={20} color={Colors.textPrimary} />
            <Text style={styles.offlineBannerText}>NETWORK LOST – SYNC PAUSED</Text>
          </View>
        </View>
      )}
      
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres rapides stock */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, stockFilter === 'all' && styles.filterChipActive]}
          onPress={() => setStockFilter('all')}
        >
          <Text style={[styles.filterChipText, stockFilter === 'all' && styles.filterChipTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, stockFilter === 'in_stock' && styles.filterChipActive]}
          onPress={() => setStockFilter('in_stock')}
        >
          <Text style={[styles.filterChipText, stockFilter === 'in_stock' && styles.filterChipTextActive]}>
            En stock
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, stockFilter === 'low_stock' && styles.filterChipActive]}
          onPress={() => setStockFilter('low_stock')}
        >
          <Text style={[styles.filterChipText, stockFilter === 'low_stock' && styles.filterChipTextActive]}>
            Stock faible
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, stockFilter === 'out_of_stock' && styles.filterChipActive]}
          onPress={() => setStockFilter('out_of_stock')}
        >
          <Text style={[styles.filterChipText, stockFilter === 'out_of_stock' && styles.filterChipTextActive]}>
            Rupture
          </Text>
        </TouchableOpacity>
        {/* Filtre pour cacher stock 0 */}
        <TouchableOpacity
          style={[styles.filterChip, hideZeroStock && styles.filterChipActive]}
          onPress={() => setHideZeroStock(!hideZeroStock)}
        >
          <Ionicons 
            name={hideZeroStock ? "checkbox" : "checkbox-outline"} 
            size={16} 
            color={hideZeroStock ? Colors.textPrimary : Colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterChipText, hideZeroStock && styles.filterChipTextActive]}>
            {hideZeroStock ? 'Masquer 0 ✓' : 'Masquer 0'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Filtre par catégories */}
      {availableCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !categoryFilter && styles.filterChipActive]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>
              Toutes catégories
            </Text>
          </TouchableOpacity>
          {availableCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterChip, categoryFilter === category && styles.filterChipActive]}
              onPress={() => setCategoryFilter(categoryFilter === category ? null : category)}
            >
              <Text style={[styles.filterChipText, categoryFilter === category && styles.filterChipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={!loading}
        onRefresh={loadProducts}
        // Le contentStyle de React Navigation gère déjà le paddingTop
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || stockFilter !== 'all' 
                ? 'Aucun produit ne correspond aux filtres' 
                : 'Aucun produit trouvé'}
            </Text>
            {isOffline && (
              <Text style={styles.emptySubtext}>
                Connectez-vous à internet pour synchroniser
              </Text>
            )}
          </View>
        }
      />
      
      {/* 🔧 MODE DEBUG : Affichage des données brutes */}
      {DEBUG && products.length > 0 && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔧 DEBUG - Premier produit (JSON brut)</Text>
          <ScrollView style={styles.debugScrollView} nestedScrollEnabled>
            <Text style={styles.debugText}>
              {JSON.stringify(products[0], null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
      
      {/* Bouton Scanner Industriel */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
        activeOpacity={0.9}
      >
        <View style={styles.scanButtonContent}>
          <Ionicons name="qr-code" size={26} color={Colors.textPrimary} />
          <Text style={styles.scanButtonText}>SCAN</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  offlineBanner: {
    backgroundColor: Colors.warning,
    borderBottomWidth: 2,
    borderBottomColor: Colors.warningDark,
  },
  offlineBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  offlineBannerText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.successDark,
    minHeight: 56,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
  },
  retryButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  productItem: {
    backgroundColor: Colors.backgroundCard,
    padding: 16,
    marginBottom: 10,
    borderRadius: 4, // Coins carrés pour look industriel
    borderWidth: 2, // Bordure plus épaisse
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    // Pas d'ombre douce, contraste net
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  productImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 4, // Coins carrés
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18, // Plus grand pour lisibilité
    fontWeight: '700', // Plus gras
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  productRef: {
    fontSize: 13,
    color: Colors.textLabel, // Couleur technique
    fontWeight: '500',
    marginTop: 2,
    fontFamily: 'monospace', // Police technique pour référence
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stockIndicator: {
    width: 10, // Plus grand
    height: 10,
    borderRadius: 5,
  },
  stockText: {
    fontSize: 13, // Plus grand pour lisibilité
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 4, // Coins carrés
    borderWidth: 2, // Bordure plus épaisse
    borderColor: Colors.border,
    paddingHorizontal: 12,
    minHeight: 48, // Plus haut pour touch target
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    maxHeight: 50,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4, // Coins carrés
    backgroundColor: Colors.backgroundCard,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 44, // Touch target large
  },
  filterChipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.successDark,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  productArrow: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Bouton Scanner Industriel
  scanButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.success,
    borderRadius: 4, // Coins carrés
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Colors.successDark,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2, // Espacement large pour look technique
  },
  // 🔧 Styles pour le mode DEBUG
  debugContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.luxgreen,
    padding: 12,
    maxHeight: 200,
    zIndex: 1000,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.luxgreen,
    marginBottom: 8,
  },
  debugScrollView: {
    maxHeight: 150,
  },
  debugText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
});

