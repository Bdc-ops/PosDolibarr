import { APP_CONFIG, StorageKey } from '../config/app.config';

/**
 * Service de stockage sécurisé
 * Utilise expo-secure-store pour stocker des données sensibles (token, credentials)
 * Implémentation thread-safe et sécurisée pour iOS et Android
 */

// Import lazy du module pour éviter les problèmes de chargement au démarrage
let SecureStore: any = null;

/**
 * Récupère le module SecureStore de manière lazy
 */
async function getSecureStore() {
  if (SecureStore) {
    return SecureStore;
  }

  try {
    console.log('[SecureStore] Chargement du module expo-secure-store...');
    // Import dynamique pour éviter le chargement au démarrage
    const SecureStoreModule = await import('expo-secure-store');
    // expo-secure-store SDK 14 utilise des exports nommés
    SecureStore = SecureStoreModule.default || SecureStoreModule;
    
    // Vérifie que le module a les méthodes nécessaires
    if (!SecureStore || !SecureStore.setItemAsync) {
      throw new Error('Module SecureStore invalide');
    }
    
    console.log('[SecureStore] Module chargé avec succès');
    return SecureStore;
  } catch (error: any) {
    console.error('[SecureStore] Erreur lors du chargement du module:', error?.message || error);
    throw new Error(`Impossible de charger SecureStore: ${error?.message || 'Erreur inconnue'}`);
  }
}

/**
 * Stocke une valeur de manière sécurisée
 * @param key - Clé de stockage
 * @param value - Valeur à stocker
 */
export async function setSecureItem(key: StorageKey, value: string): Promise<void> {
  try {
    console.log(`[SecureStore] Tentative de stockage de ${key}...`);
    const SecureStore = await getSecureStore();
    await SecureStore.setItemAsync(key, value);
    console.log(`[SecureStore] Stockage réussi pour ${key}`);
  } catch (error) {
    console.error(`[SecureStore] Erreur lors du stockage sécurisé de ${key}:`, error);
    throw new Error(`Impossible de stocker ${key}`);
  }
}

/**
 * Récupère une valeur stockée de manière sécurisée
 * @param key - Clé de stockage
 * @returns La valeur stockée ou null si inexistante
 */
export async function getSecureItem(key: StorageKey): Promise<string | null> {
  try {
    console.log(`[SecureStore] Tentative de récupération de ${key}...`);
    const SecureStore = await getSecureStore();
    const value = await SecureStore.getItemAsync(key);
    console.log(`[SecureStore] Récupération ${value ? 'réussie' : 'vide'} pour ${key}`);
    return value;
  } catch (error) {
    console.error(`[SecureStore] Erreur lors de la récupération de ${key}:`, error);
    return null;
  }
}

/**
 * Supprime une valeur stockée de manière sécurisée
 * @param key - Clé de stockage
 */
export async function deleteSecureItem(key: StorageKey): Promise<void> {
  try {
    console.log(`[SecureStore] Tentative de suppression de ${key}...`);
    const SecureStore = await getSecureStore();
    await SecureStore.deleteItemAsync(key);
    console.log(`[SecureStore] Suppression réussie pour ${key}`);
  } catch (error) {
    console.error(`[SecureStore] Erreur lors de la suppression de ${key}:`, error);
    // Ne pas lever d'erreur si la clé n'existe pas
  }
}

/**
 * Supprime toutes les données d'authentification stockées
 * Utilisé lors de la déconnexion
 */
export async function clearAuthData(): Promise<void> {
  try {
    await Promise.all([
      deleteSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN),
      deleteSecureItem(APP_CONFIG.STORAGE_KEYS.SERVER_URL),
      deleteSecureItem(APP_CONFIG.STORAGE_KEYS.USER_LOGIN),
    ]);
  } catch (error) {
    console.error('Erreur lors de la suppression des données d\'authentification:', error);
  }
}
