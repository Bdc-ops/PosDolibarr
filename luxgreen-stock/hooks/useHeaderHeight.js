/**
 * Hook pour calculer la hauteur exacte du header personnalisé
 * Utilise la même logique que CustomHeader pour garantir la cohérence
 */

import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Constantes du header (doivent correspondre à CustomHeader)
 */
const HEADER_MIN_HEIGHT = 48; // Hauteur du contenu principal
const HEADER_PADDING_TOP = 4; // Padding interne en plus de la safe area
const NETWORK_INDICATOR_HEIGHT = 0; // Indicateur intégré dans la barre, pas de hauteur supplémentaire

/**
 * Calcule la hauteur totale du header (safe area + contenu + indicateur)
 * @returns {number} Hauteur totale en pixels
 */
export function useHeaderHeight() {
  const insets = useSafeAreaInsets();
  
  // Même calcul que CustomHeader
  const paddingTop = insets.top + HEADER_PADDING_TOP;
  const totalHeight = paddingTop + HEADER_MIN_HEIGHT + NETWORK_INDICATOR_HEIGHT;
  
  return totalHeight;
}

/**
 * Calcule uniquement la hauteur du contenu (sans safe area)
 * Utile pour certains calculs
 */
export function useHeaderContentHeight() {
  return HEADER_MIN_HEIGHT + NETWORK_INDICATOR_HEIGHT;
}
