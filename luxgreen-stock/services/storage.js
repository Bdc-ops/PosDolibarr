/**
 * Service de stockage sécurisé et local
 * Gère la configuration (SecureStore) et le cache offline (AsyncStorage)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const STORAGE_KEYS = {
  DOLIBARR_URL: 'dolibarr_url',
  DOLIBARR_API_KEY: 'dolibarr_api_key',
  CONFIGURED: 'app_configured',
  PRODUCTS_CACHE: 'products_cache',
  PRODUCTS_CACHE_DATE: 'products_cache_date',
  LOW_STOCK_THRESHOLD: 'low_stock_threshold',
};

/**
 * Configuration - Stockage sécurisé avec SecureStore
 */

/**
 * Vérifie si l'application est configurée
 * @returns {Promise<boolean>}
 */
export async function isConfigured() {
  try {
    const configured = await SecureStore.getItemAsync(STORAGE_KEYS.CONFIGURED);
    return configured === 'true';
  } catch (error) {
    console.error('Erreur vérification configuration:', error);
    return false;
  }
}

/**
 * Récupère l'URL Dolibarr
 * @returns {Promise<string|null>}
 */
export async function getDolibarrUrl() {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.DOLIBARR_URL);
  } catch (error) {
    console.error('Erreur récupération URL:', error);
    return null;
  }
}

/**
 * Récupère la clé API Dolibarr
 * @returns {Promise<string|null>}
 */
export async function getDolibarrApiKey() {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.DOLIBARR_API_KEY);
  } catch (error) {
    console.error('Erreur récupération clé API:', error);
    return null;
  }
}

/**
 * Sauvegarde la configuration
 * @param {string} url - URL Dolibarr
 * @param {string} apiKey - Clé API Dolibarr
 * @returns {Promise<void>}
 */
export async function saveConfiguration(url, apiKey) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.DOLIBARR_URL, url);
    await SecureStore.setItemAsync(STORAGE_KEYS.DOLIBARR_API_KEY, apiKey);
    await SecureStore.setItemAsync(STORAGE_KEYS.CONFIGURED, 'true');
  } catch (error) {
    console.error('Erreur sauvegarde configuration:', error);
    throw error;
  }
}

/**
 * Réinitialise la configuration
 * @returns {Promise<void>}
 */
export async function resetConfiguration() {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.DOLIBARR_URL);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.DOLIBARR_API_KEY);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.CONFIGURED);
    // Nettoyer aussi le cache
    await AsyncStorage.removeItem(STORAGE_KEYS.PRODUCTS_CACHE);
    await AsyncStorage.removeItem(STORAGE_KEYS.PRODUCTS_CACHE_DATE);
  } catch (error) {
    console.error('Erreur réinitialisation configuration:', error);
    throw error;
  }
}

/**
 * Cache offline - Stockage local avec AsyncStorage
 */

/**
 * Sauvegarde les produits en cache
 * @param {Array} products - Liste des produits
 * @returns {Promise<void>}
 */
export async function saveProductsCache(products) {
  try {
    const cacheData = {
      products,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS_CACHE,
      JSON.stringify(cacheData)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS_CACHE_DATE,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('Erreur sauvegarde cache:', error);
  }
}

/**
 * Récupère les produits depuis le cache
 * @returns {Promise<Array|null>}
 */
export async function getProductsCache() {
  try {
    const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE);
    if (cacheData) {
      const parsed = JSON.parse(cacheData);
      return parsed.products || null;
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération cache:', error);
    return null;
  }
}

/**
 * Récupère la date du dernier cache
 * @returns {Promise<string|null>}
 */
export async function getCacheDate() {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE_DATE);
  } catch (error) {
    console.error('Erreur récupération date cache:', error);
    return null;
  }
}

/**
 * Sauvegarde un produit individuel en cache (pour le scan)
 * @param {Object} product - Produit à sauvegarder
 * @returns {Promise<void>}
 */
export async function saveProductToCache(product) {
  try {
    const products = await getProductsCache() || [];
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    await saveProductsCache(products);
  } catch (error) {
    console.error('Erreur sauvegarde produit cache:', error);
  }
}

/**
 * Recherche un produit dans le cache par code-barres
 * @param {string} barcode - Code-barres à rechercher
 * @returns {Promise<Object|null>}
 */
export async function findProductInCache(barcode) {
  try {
    const products = await getProductsCache() || [];
    return products.find(p => 
      p.barcode === barcode || 
      p.barcode === String(barcode) ||
      p.barcode_text === barcode ||
      p.barcode_text === String(barcode)
    ) || null;
  } catch (error) {
    console.error('Erreur recherche cache:', error);
    return null;
  }
}

/**
 * Récupère le seuil de stock faible (défaut: 5)
 * @returns {Promise<number>}
 */
export async function getLowStockThreshold() {
  try {
    const threshold = await AsyncStorage.getItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD);
    return threshold ? parseInt(threshold, 10) : 5;
  } catch (error) {
    console.error('Erreur récupération seuil stock faible:', error);
    return 5; // Valeur par défaut
  }
}

/**
 * Sauvegarde le seuil de stock faible
 * @param {number} threshold - Seuil de stock faible
 * @returns {Promise<void>}
 */
export async function saveLowStockThreshold(threshold) {
  try {
    const numThreshold = parseInt(threshold, 10);
    if (isNaN(numThreshold) || numThreshold < 0) {
      throw new Error('Seuil invalide');
    }
    await AsyncStorage.setItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD, String(numThreshold));
  } catch (error) {
    console.error('Erreur sauvegarde seuil stock faible:', error);
    throw error;
  }
}

