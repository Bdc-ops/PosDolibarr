/**
 * Utilitaires pour l'affichage du stock produit
 * Gère les couleurs et formats selon la quantité
 */

import { Colors } from '../constants/colors';
import { getLowStockThreshold } from '../services/storage';

// Seuil par défaut (sera remplacé par la valeur configurée)
let cachedThreshold = 5;

/**
 * Récupère la valeur du stock depuis un produit
 * Vérifie plusieurs champs possibles selon Dolibarr
 * 
 * @param {Object} product - Objet produit
 * @returns {number} - Valeur du stock (0 si non trouvé)
 */
export function getStockValue(product) {
  if (!product || typeof product !== 'object') {
    return 0;
  }

  // Priorité : stock_reel > stock > stock_physique
  if (product.stock_reel !== undefined && product.stock_reel !== null) {
    const value = Number(product.stock_reel);
    return isNaN(value) ? 0 : value;
  }

  if (product.stock !== undefined && product.stock !== null) {
    const value = Number(product.stock);
    return isNaN(value) ? 0 : value;
  }

  if (product.stock_physique !== undefined && product.stock_physique !== null) {
    const value = Number(product.stock_physique);
    return isNaN(value) ? 0 : value;
  }

  return 0;
}

/**
 * Détermine la couleur du stock selon sa valeur
 * Utilise le seuil configuré pour le stock faible
 * 
 * @param {number} stock - Valeur du stock
 * @param {number} threshold - Seuil de stock faible (optionnel, sinon récupère depuis config)
 * @returns {string} - Couleur hexadécimale
 */
export async function getStockColor(stock, threshold = null) {
  if (stock === undefined || stock === null || isNaN(stock)) {
    return Colors.textTertiary;
  }

  const stockValue = Number(stock);
  
  // Si pas de seuil fourni, récupérer depuis la config (avec cache)
  if (threshold === null) {
    try {
      threshold = await getLowStockThreshold();
      cachedThreshold = threshold;
    } catch (error) {
      threshold = cachedThreshold; // Utiliser la valeur en cache en cas d'erreur
    }
  }

  if (stockValue === 0) {
    return Colors.error; // Rouge si stock = 0
  } else if (stockValue < threshold) {
    return Colors.warning; // Orange si stock < seuil
  } else {
    return Colors.success; // Vert si stock >= seuil
  }
}

/**
 * Version synchrone qui utilise le seuil en cache
 * @param {number} stock - Valeur du stock
 * @returns {string} - Couleur hexadécimale
 */
export function getStockColorSync(stock) {
  if (stock === undefined || stock === null || isNaN(stock)) {
    return Colors.textTertiary;
  }

  const stockValue = Number(stock);

  if (stockValue === 0) {
    return Colors.error; // Rouge si stock = 0
  } else if (stockValue < cachedThreshold) {
    return Colors.warning; // Orange si stock < seuil
  } else {
    return Colors.success; // Vert si stock >= seuil
  }
}

/**
 * Formate le texte du stock pour l'affichage
 * 
 * @param {number} stock - Valeur du stock
 * @returns {string} - Texte formaté
 */
export function formatStock(stock) {
  if (stock === undefined || stock === null || isNaN(stock)) {
    return 'N/A';
  }

  const stockValue = Number(stock);
  return stockValue.toString();
}

/**
 * Détermine le libellé du stock selon sa valeur
 * Utilise le seuil configuré pour le stock faible
 * 
 * @param {number} stock - Valeur du stock
 * @param {number} threshold - Seuil de stock faible (optionnel)
 * @returns {Promise<string>} - Libellé (ex: "En stock", "Stock faible", "Rupture")
 */
export async function getStockLabel(stock, threshold = null) {
  if (stock === undefined || stock === null || isNaN(stock)) {
    return 'Stock inconnu';
  }

  const stockValue = Number(stock);
  
  if (threshold === null) {
    try {
      threshold = await getLowStockThreshold();
      cachedThreshold = threshold;
    } catch (error) {
      threshold = cachedThreshold;
    }
  }

  if (stockValue === 0) {
    return 'Rupture de stock';
  } else if (stockValue < threshold) {
    return 'Stock faible';
  } else {
    return 'En stock';
  }
}

/**
 * Met à jour le seuil en cache
 * @param {number} threshold - Nouveau seuil
 */
export function updateThresholdCache(threshold) {
  cachedThreshold = threshold;
}

