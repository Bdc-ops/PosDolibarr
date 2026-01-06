import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { scanProduct } from '../services/api';
import { isOnline } from '../services/network';
import { useStockMovement } from '../hooks/useStockMovement';

/**
 * Écran de scan de code-barres
 * Utilise la caméra pour scanner un code-barres
 * Recherche le produit correspondant dans l'API
 * Navigue vers les détails si trouvé
 */
export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [showStockUpdate, setShowStockUpdate] = useState(false);

  // Hook pour les mouvements de stock (doit toujours être appelé, utilise scannedProduct?.id)
  const stockMovement = useStockMovement(scannedProduct?.id);

  // Réinitialise le scan quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setLoading(false);
    }, [])
  );

  /**
   * Gère le scan d'un code-barres
   */
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      // Vérifier le statut réseau
      const online = await isOnline();
      setIsOffline(!online);

      // Recherche le produit par code-barres (cherche d'abord en cache, puis API si online)
      const product = await scanProduct(data);

      if (product && product.id) {
        // Produit trouvé - feedback haptique
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScannedProduct(product);
        setShowStockUpdate(true);
        setQuantity('1');
        // Ne pas naviguer automatiquement, afficher les boutons + / -
      } else {
        // Produit non trouvé
        const message = isOffline
          ? `Aucun produit trouvé en cache pour le code-barres: ${data}`
          : `Aucun produit trouvé pour le code-barres: ${data}`;
        
        Alert.alert(
          'Produit non trouvé',
          message,
          [
            {
              text: 'OK',
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      let errorMessage = error.message || 'Une erreur est survenue lors de la recherche du produit';
      
      if (errorMessage.includes('hors ligne') || errorMessage.includes('offline')) {
        setIsOffline(true);
        errorMessage = 'Mode hors ligne - Recherche dans le cache uniquement';
      }
      
      Alert.alert(
        'Erreur',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Gestion des permissions
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.luxgreen} />
        <Text style={styles.text}>Demande de permission caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Accès à la caméra refusé
        </Text>
        <Text style={styles.text}>
          Veuillez autoriser l'accès à la caméra pour utiliser le scanner
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'codabar', 'itf14'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {/* Bouton retour visible en haut à gauche */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <View style={styles.exitButtonInner}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </View>
      </TouchableOpacity>
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          {/* Coin indicateurs */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instructionText}>
          SCANNEZ UN CODE-BARRES
        </Text>
      </View>

      {/* Produit scanné - Vue mise à jour stock */}
      {scannedProduct && !loading && showStockUpdate && (
        <View style={styles.productActions}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {scannedProduct.label || scannedProduct.name || scannedProduct.ref || 'Produit'}
            </Text>
            <Text style={styles.productRef}>
              REF: {scannedProduct.ref || 'N/A'}
            </Text>
            {stockMovement && (
              <Text style={styles.stockInfo}>
                Stock: {stockMovement.localStock || 0}
              </Text>
            )}
          </View>

          {/* Contrôle quantité */}
          <View style={styles.quantityControl}>
            <Text style={styles.quantityLabel}>QUANTITÉ</Text>
            <View style={styles.quantityInputContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const qty = Math.max(1, Number(quantity) - 1);
                  setQuantity(String(qty));
                }}
                disabled={loading}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '');
                  setQuantity(numeric || '1');
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const qty = Number(quantity) + 1;
                  setQuantity(String(qty));
                }}
                disabled={loading}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={async () => {
                if (!stockMovement || !scannedProduct?.id) return;
                try {
                  setLoading(true);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const qty = Number(quantity) || 1;
                  await stockMovement.addStock(qty, {
                    label: 'Mise à jour via scan',
                  });
                  Alert.alert('Succès', `Stock augmenté de ${qty}`, [
                    { text: 'OK', onPress: () => {
                      setScannedProduct(null);
                      setScanned(false);
                      setShowStockUpdate(false);
                    }}
                  ]);
                } catch (error) {
                  Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !stockMovement || !scannedProduct?.id}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={32} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>+ AJOUTER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={async () => {
                if (!stockMovement || !scannedProduct?.id) return;
                try {
                  setLoading(true);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const qty = Number(quantity) || 1;
                  await stockMovement.removeStock(qty, {
                    label: 'Mise à jour via scan',
                  });
                  Alert.alert('Succès', `Stock réduit de ${qty}`, [
                    { text: 'OK', onPress: () => {
                      setScannedProduct(null);
                      setScanned(false);
                      setShowStockUpdate(false);
                    }}
                  ]);
                } catch (error) {
                  Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !stockMovement || !scannedProduct?.id}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={32} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>- RETIRER</Text>
            </TouchableOpacity>
          </View>

          {/* Indicateur sync */}
          {stockMovement && (
            <View style={styles.syncIndicator}>
              {stockMovement.isSyncing ? (
                <Text style={styles.syncText}>🟠 Synchronisation...</Text>
              ) : stockMovement.hasPending ? (
                <Text style={styles.syncText}>
                  🟠 {stockMovement.syncState.pendingCount} mouvement(s) en attente
                </Text>
              ) : stockMovement.hasErrors ? (
                <Text style={styles.syncText}>
                  🔴 {stockMovement.syncState.errorCount} erreur(s)
                </Text>
              ) : stockMovement.isOnline ? (
                <Text style={styles.syncText}>🟢 Synchronisé</Text>
              ) : (
                <Text style={styles.syncText}>📴 Mode hors ligne</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => {
              setScannedProduct(null);
              setScanned(false);
              setShowStockUpdate(false);
            }}
          >
            <Text style={styles.dismissButtonText}>FERMER</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.success} />
          <Text style={styles.loadingText}>RECHERCHE...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  exitButton: {
    position: 'absolute',
    top: 60, // Sous le header (safe area + header)
    left: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: 8,
  },
  exitButtonInner: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanArea: {
    width: 300,
    height: 300,
    borderWidth: 4,
    borderColor: Colors.success,
    borderRadius: 4, // Coins carrés
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.success,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderBottomRightRadius: 4,
  },
  instructionText: {
    marginTop: 40,
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  productActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 3,
    borderTopColor: Colors.borderStrong,
    padding: 20,
  },
  productInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  productRef: {
    fontSize: 14,
    color: Colors.textLabel,
    fontWeight: '500',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  stockInfo: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 8,
  },
  quantityControl: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 100,
    height: 56,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 80, // Touch target large pour gants
  },
  addButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.successDark,
  },
  removeButton: {
    backgroundColor: Colors.error,
    borderColor: Colors.errorDark,
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  syncIndicator: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  syncText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  permissionButton: {
    marginTop: 24,
    backgroundColor: Colors.success,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.successDark,
    minHeight: 56,
  },
  permissionButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

