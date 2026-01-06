/**
 * Service de détection réseau
 * Vérifie la disponibilité de la connexion internet
 */

import * as Network from 'expo-network';

/**
 * Vérifie si l'appareil est connecté à internet
 * @returns {Promise<boolean>}
 */
export async function isOnline() {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected && networkState.isInternetReachable;
  } catch (error) {
    console.error('Erreur vérification réseau:', error);
    // En cas d'erreur, supposer offline pour sécurité
    return false;
  }
}

/**
 * Écoute les changements de connexion réseau
 * @param {Function} callback - Fonction appelée lors des changements
 * @returns {Function} Fonction pour arrêter l'écoute
 */
export function watchNetwork(callback) {
  let isListening = true;
  
  const checkNetwork = async () => {
    if (!isListening) return;
    
    const online = await isOnline();
    callback(online);
    
    // Vérifier toutes les 3 secondes
    setTimeout(checkNetwork, 3000);
  };
  
  checkNetwork();
  
  // Retourner une fonction pour arrêter l'écoute
  return () => {
    isListening = false;
  };
}

