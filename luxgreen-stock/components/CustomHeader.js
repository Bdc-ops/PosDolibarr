/**
 * Composant Header industriel avec gestion correcte de la Safe Area
 * Design robuste, terrain, type scanner professionnel
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { isOnline } from '../services/network';

/**
 * Header industriel avec Safe Area et indicateur réseau
 * @param {Object} props
 * @param {string} props.title - Titre du header (en majuscules recommandé)
 * @param {Function} props.onBackPress - Callback pour le bouton retour (optionnel)
 * @param {React.ReactNode} props.rightComponent - Composant à afficher à droite (optionnel)
 * @param {boolean} props.showBack - Afficher le bouton retour (défaut: false)
 */
export default function CustomHeader({
  title,
  onBackPress,
  rightComponent,
  showBack = false,
}) {
  const insets = useSafeAreaInsets();
  const [isOnlineState, setIsOnlineState] = useState(true);

  // Vérifier l'état réseau
  useEffect(() => {
    const checkNetwork = async () => {
      const online = await isOnline();
      setIsOnlineState(online);
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000); // Vérifier toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  // Hauteur minimale du header (compact pour laisser de la place au contenu)
  const HEADER_MIN_HEIGHT = 48; // Réduit pour compacité
  // Padding top total = safe area + padding interne minimal
  const PADDING_TOP = insets.top + 4; // Réduit pour compacité
  // Hauteur de l'indicateur réseau (plus compact) - intégré inline donc 0
  const NETWORK_INDICATOR_HEIGHT = 0; // Intégré inline, pas de hauteur supplémentaire
  // Hauteur totale du header
  const HEADER_HEIGHT = PADDING_TOP + HEADER_MIN_HEIGHT + NETWORK_INDICATOR_HEIGHT;

  // Couleur de l'indicateur réseau
  const networkColor = isOnlineState ? Colors.success : Colors.warning;
  const networkLabel = isOnlineState ? 'ONLINE' : 'OFFLINE';

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: PADDING_TOP,
          height: HEADER_HEIGHT,
        },
      ]}
    >
      {/* Zone de contenu du header */}
      <View style={styles.headerContent}>
        {/* Zone gauche : Bouton retour ou placeholder */}
        <View style={styles.leftContainer}>
          {showBack && onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Titre centré - en majuscules pour look industriel */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title.toUpperCase()}
          </Text>
        </View>

        {/* Zone droite : Icône paramètres ou placeholder avec indicateur réseau */}
        <View style={styles.rightContainer}>
          {rightComponent ? (
            <View style={styles.rightWithIndicator}>
              <View style={styles.networkIndicatorInline}>
                <View style={[styles.networkDot, { backgroundColor: networkColor }]} />
              </View>
              {rightComponent}
            </View>
          ) : (
            <View style={styles.networkIndicatorInline}>
              <View style={[styles.networkDot, { backgroundColor: networkColor }]} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background,
    borderBottomWidth: 2, // Bordure plus épaisse pour look industriel
    borderBottomColor: Colors.borderStrong,
    // Ombre nette, pas douce
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4, // Android - plus élevé
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48, // Réduit pour compacité
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textPrimary, // Blanc pour visibilité
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  networkIndicatorInline: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

