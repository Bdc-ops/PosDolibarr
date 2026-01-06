import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProductStock } from '../services/api';
// import { getProductImage } from '../services/productImageService';
import { isOnline } from '../services/network';
import { Colors } from '../constants/colors';
import { getProductName, getProductRef } from '../utils/productHelpers';
import { getStockValue, getStockColor, getStockColorSync, formatStock } from '../utils/stockHelpers';
import { useStockMovement } from '../hooks/useStockMovement';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * Écran de détails d'un produit
 * Affiche les informations complètes du produit et son stock
 */
export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');

  // Utiliser le hook pour gérer les mouvements de stock
  const { addStock, removeStock, localStock, loading: stockLoading, refreshStock } = useStockMovement(productId);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  /**
   * Charge les détails du produit et son stock
   */
  const loadProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductStock(productId);
      if (data) {
        setProduct(data);
        // Rafraîchir le stock local après chargement
        refreshStock();
        
        // Images désactivées pour l'instant
        // try {
        //   const imgPath = await getProductImage(data);
        //   if (imgPath) {
        //     setImageUrl(imgPath);
        //   }
        // } catch (imgError) {
        //   console.log('Erreur récupération image:', imgError);
        // }
      } else {
        setError('Produit introuvable');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des détails du produit';
      setError(errorMessage);
      console.error('Erreur chargement détails:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.luxgreen} />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Produit introuvable'}
        </Text>
      </View>
    );
  }

  // Récupérer le prix (peut être price, price_ttc, price_ht, etc.)
  const getPrice = () => {
    if (product.price !== undefined && product.price !== null) return product.price;
    if (product.price_ttc !== undefined && product.price_ttc !== null) return product.price_ttc;
    if (product.price_ht !== undefined && product.price_ht !== null) return product.price_ht;
    return null;
  };

  const price = getPrice();
  // Utiliser le stock local si disponible, sinon le stock du produit
  const stock = localStock > 0 || localStock === 0 ? localStock : getStockValue(product);
  const stockColor = getStockColorSync(stock);

  /**
   * Gère l'ajout de stock
   */
  const handleAddStock = async () => {
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addStock(qty);
      // Recharger les détails du produit pour mettre à jour le stock affiché
      await loadProductDetails();
    } catch (error) {
      console.error('Erreur ajout stock:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Gère le retrait de stock
   */
  const handleRemoveStock = async () => {
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await removeStock(qty);
      // Recharger les détails du produit pour mettre à jour le stock affiché
      await loadProductDetails();
    } catch (error) {
      console.error('Erreur retrait stock:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        // Le contentStyle de React Navigation gère déjà le paddingTop
      >
        {/* Photo du produit */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              contentFit="contain"
              placeholderContentFit="contain"
              transition={200}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="bulb-outline" size={64} color={Colors.luxgreen} />
              <Text style={styles.placeholderText}>Aucune image</Text>
            </View>
          )}
        </View>

        {/* Nom et Prix */}
        <View style={styles.headerSection}>
          <Text style={styles.productName}>{getProductName(product)}</Text>
          {price !== null && (
            <Text style={styles.productPrice}>
              {formatPrice(price)} €
            </Text>
          )}
        </View>

        {/* Informations principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations produit</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Référence:</Text>
            <Text style={styles.value}>{getProductRef(product) || 'N/A'}</Text>
          </View>
          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Code-barres:</Text>
              <Text style={styles.value}>{product.barcode}</Text>
            </View>
          )}
        </View>

        {/* Dimensions et poids */}
        {(product.length || product.width || product.height || product.weight) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dimensions et poids</Text>
            {product.length && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Longueur:</Text>
                <Text style={styles.value}>{product.length} {product.length_units || 'cm'}</Text>
              </View>
            )}
            {product.width && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Largeur:</Text>
                <Text style={styles.value}>{product.width} {product.width_units || 'cm'}</Text>
              </View>
            )}
            {product.height && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Hauteur:</Text>
                <Text style={styles.value}>{product.height} {product.height_units || 'cm'}</Text>
              </View>
            )}
            {product.weight && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Poids:</Text>
                <Text style={styles.value}>{product.weight} {product.weight_units || 'kg'}</Text>
              </View>
            )}
          </View>
        )}

        {/* Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock</Text>
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stock réel:</Text>
            <View style={styles.stockValueContainer}>
              <View style={[styles.stockIndicator, { backgroundColor: stockColor }]} />
              <Text style={[styles.stockValue, { color: stockColor }]}>
                {formatStock(stock)}
              </Text>
              {/* Boutons rapides + et - */}
              <View style={styles.quickStockButtons}>
                <TouchableOpacity
                  style={[styles.quickStockButton, styles.quickStockButtonMinus]}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await removeStock(1);
                      await loadProductDetails();
                    } catch (error) {
                      console.error('Erreur retrait stock rapide:', error);
                    }
                  }}
                  disabled={stockLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="remove" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickStockButton, styles.quickStockButtonPlus]}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await addStock(1);
                      await loadProductDetails();
                    } catch (error) {
                      console.error('Erreur ajout stock rapide:', error);
                    }
                  }}
                  disabled={stockLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {product.warehouse && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Entrepôt:</Text>
              <Text style={styles.value}>{product.warehouse}</Text>
            </View>
          )}
          {product.location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Emplacement:</Text>
              <Text style={styles.value}>{product.location}</Text>
            </View>
          )}
        </View>

        {/* Gestion du stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modifier le stock</Text>
          <View style={styles.stockControlContainer}>
            <Text style={styles.controlLabel}>Quantité:</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantityInput}
              onChangeText={setQuantityInput}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={Colors.textTertiary}
            />
            <View style={styles.stockButtonsContainer}>
              <TouchableOpacity
                style={[styles.stockButton, styles.removeButton]}
                onPress={handleRemoveStock}
                disabled={stockLoading}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
                <Text style={styles.stockButtonText}>RETIRER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockButton, styles.addButton]}
                onPress={handleAddStock}
                disabled={stockLoading}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
                <Text style={styles.stockButtonText}>AJOUTER</Text>
              </TouchableOpacity>
            </View>
            {stockLoading && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color={Colors.success} />
                <Text style={styles.loadingText}>Mise à jour...</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Formate le prix avec 2 décimales
 */
function formatPrice(price) {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      return numPrice.toFixed(2);
    }
  }
  return price;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: 15,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.7,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.textTertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  headerSection: {
    backgroundColor: Colors.backgroundCard,
    padding: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  productName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.luxgreen,
  },
  section: {
    backgroundColor: Colors.backgroundCard,
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 120,
  },
  value: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '400',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginRight: 12,
  },
  stockValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stockValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  quickStockButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  quickStockButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickStockButtonMinus: {
    backgroundColor: Colors.error,
    borderColor: Colors.errorDark,
  },
  quickStockButtonPlus: {
    backgroundColor: Colors.success,
    borderColor: Colors.successDark,
  },
  stockControlContainer: {
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  quantityInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    minHeight: 48,
  },
  stockButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  stockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minHeight: 52,
  },
  removeButton: {
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.errorDark,
  },
  addButton: {
    backgroundColor: Colors.success,
    borderWidth: 1,
    borderColor: Colors.successDark,
  },
  stockButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});

