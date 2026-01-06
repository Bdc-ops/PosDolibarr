/**
 * Service API pour communiquer DIRECTEMENT avec Dolibarr
 * Gère les appels API, le cache offline et la synchronisation
 */

import { isOnline } from './network';
import { findProductInCache, getDolibarrApiKey, getDolibarrUrl, getProductsCache, saveProductsCache, saveProductToCache } from './storage';

/**
 * Fonction générique pour effectuer des requêtes vers Dolibarr
 * @param {string} endpoint - L'endpoint à appeler (ex: /api/index.php/products)
 * @param {Object} options - Options de requête (method, body, etc.)
 * @returns {Promise} - La réponse JSON
 */
async function fetchDolibarrAPI(endpoint, options = {}) {
  try {
    const url = await getDolibarrUrl();
    const apiKey = await getDolibarrApiKey();

    if (!url || !apiKey) {
      throw new Error('Configuration manquante. Veuillez configurer l\'application.');
    }

    // Nettoyer l'URL (supprimer le slash final si présent)
    const cleanUrl = url.replace(/\/$/, '');
    const fullUrl = `${cleanUrl}${endpoint}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'DOLAPIKEY': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Clé API invalide ou expirée';
      } else if (response.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else {
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Ignorer si ce n'est pas du JSON
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // 📦 LOG DEBUG : Réponse complète de l'API Dolibarr
      console.log('📦 RAW RESPONSE FROM DOLIBARR API:', JSON.stringify(data, null, 2));
      
      return data;
    }

    return null;
  } catch (error) {
    // Si erreur réseau, vérifier si on est offline
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      const online = await isOnline();
      if (!online) {
        throw new Error('Mode hors ligne');
      }
    }
    
    console.error('Erreur API Dolibarr:', error);
    throw error;
  }
}

/**
 * Teste la connexion à Dolibarr
 * @param {string} url - URL Dolibarr
 * @param {string} apiKey - Clé API
 * @returns {Promise<boolean>}
 */
export async function testConnection(url, apiKey) {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    const testUrl = `${cleanUrl}/api/index.php/products?limit=1`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'DOLAPIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return true;
    } else if (response.status === 401 || response.status === 403) {
      throw new Error('Clé API invalide');
    } else {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    if (error.message === 'Clé API invalide' || error.message.includes('HTTP')) {
      throw error;
    }
    throw new Error('Impossible de se connecter à Dolibarr. Vérifiez l\'URL.');
  }
}

/**
 * Récupère la liste de tous les produits
 * @param {boolean} useCache - Utiliser le cache si offline
 * @returns {Promise<Array>} - Liste des produits
 */
export async function getProducts(useCache = true) {
  try {
    const online = await isOnline();
    
    if (!online && useCache) {
      // Mode offline : charger depuis le cache
      const cachedProducts = await getProductsCache();
      if (cachedProducts && cachedProducts.length > 0) {
        return cachedProducts;
      }
      throw new Error('Mode hors ligne - Aucune donnée en cache');
    }

    // Mode online : appeler l'API
    const data = await fetchDolibarrAPI('/api/index.php/products');
    
    // Dolibarr retourne un objet avec une propriété contenant le tableau
    // Structure possible :
    // - Array direct : [product1, product2, ...]
    // - Objet avec clé : { "products": [product1, product2, ...] }
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === 'object') {
      // Chercher la propriété qui contient le tableau
      const keys = Object.keys(data);
      if (keys.length > 0 && Array.isArray(data[keys[0]])) {
        products = data[keys[0]];
      }
    }

    // 📦 LOG DEBUG : Produits parsés et exemple de structure
    console.log('📦 PARSED PRODUCTS COUNT:', products.length);
    if (products.length > 0) {
      console.log('📦 FIRST PRODUCT EXAMPLE:', JSON.stringify(products[0], null, 2));
      console.log('📦 FIRST PRODUCT KEYS:', Object.keys(products[0]));
      console.log('📦 FIRST PRODUCT NAME FIELDS:', {
        label: products[0].label,
        name: products[0].name,
        ref: products[0].ref,
        description: products[0].description,
      });
      // 📦 LOG DEBUG : Champs stock du premier produit
      console.log('📦 FIRST PRODUCT STOCK FIELDS:', {
        stock_reel: products[0].stock_reel,
        stock: products[0].stock,
        stock_physique: products[0].stock_physique,
        stock_warehouse: products[0].stock_warehouse,
      });
    }

    // Sauvegarder en cache
    if (products.length > 0) {
      await saveProductsCache(products);
    }

    return products;
  } catch (error) {
    // Si erreur et qu'on peut utiliser le cache, essayer
    if (useCache && error.message !== 'Mode hors ligne - Aucune donnée en cache') {
      const cachedProducts = await getProductsCache();
      if (cachedProducts && cachedProducts.length > 0) {
        return cachedProducts;
      }
    }
    throw error;
  }
}

/**
 * Récupère les détails d'un produit par son ID
 * @param {string|number} productId - L'ID du produit
 * @returns {Promise<Object>} - Les détails du produit
 */
export async function getProductById(productId) {
  try {
    const online = await isOnline();
    
    if (!online) {
      // Mode offline : chercher dans le cache
      const cachedProducts = await getProductsCache();
      if (cachedProducts) {
        const product = cachedProducts.find(p => p.id === productId || p.id === String(productId));
        if (product) {
          return product;
        }
      }
      throw new Error('Mode hors ligne - Produit non trouvé en cache');
    }

    // Mode online : appeler l'API
    const data = await fetchDolibarrAPI(`/api/index.php/products/${productId}`);
    
    // 📦 LOG DEBUG : Détails d'un produit
    if (data) {
      console.log('📦 PRODUCT DETAIL FROM API:', JSON.stringify(data, null, 2));
      console.log('📦 PRODUCT NAME FIELDS:', {
        label: data.label,
        name: data.name,
        ref: data.ref,
        description: data.description,
      });
    }
    
    // Sauvegarder en cache
    if (data) {
      await saveProductToCache(data);
    }

    return data;
  } catch (error) {
    // Si erreur, essayer le cache
    const cachedProducts = await getProductsCache();
    if (cachedProducts) {
      const product = cachedProducts.find(p => p.id === productId || p.id === String(productId));
      if (product) {
        return product;
      }
    }
    throw error;
  }
}

/**
 * Recherche un produit par code-barres
 * @param {string} barcode - Le code-barres à rechercher
 * @returns {Promise<Object|null>} - Le produit trouvé ou null
 */
export async function scanProduct(barcode) {
  try {
    // D'abord chercher dans le cache (rapide)
    const cachedProduct = await findProductInCache(barcode);
    if (cachedProduct) {
      // Si on est online, mettre à jour depuis l'API en arrière-plan
      const online = await isOnline();
      if (online) {
        // Essayer de récupérer depuis l'API (ne pas bloquer si échec)
        getProductById(cachedProduct.id).catch(() => {});
      }
      return cachedProduct;
    }

    // Si pas trouvé en cache et online, chercher via API
    const online = await isOnline();
    if (!online) {
      return null; // Pas trouvé en cache et offline
    }

    // Recherche via API Dolibarr avec sqlfilters
    // Format Dolibarr : sqlfilters=barcode_text='CODE' ou barcode='CODE'
    const data = await fetchDolibarrAPI(
      `/api/index.php/products?sqlfilters=(barcode_text='${encodeURIComponent(barcode)}'%20OR%20barcode='${encodeURIComponent(barcode)}')&limit=1`
    );

    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length > 0 && Array.isArray(data[keys[0]])) {
        products = data[keys[0]];
      }
    }

    if (products.length > 0) {
      const product = products[0];
      
      // 📦 LOG DEBUG : Produit trouvé par scan
      console.log('📦 SCANNED PRODUCT FROM API:', JSON.stringify(product, null, 2));
      console.log('📦 SCANNED PRODUCT NAME FIELDS:', {
        label: product.label,
        name: product.name,
        ref: product.ref,
        barcode: product.barcode || product.barcode_text,
      });
      
      // Sauvegarder en cache
      await saveProductToCache(product);
      return product;
    }

    return null;
  } catch (error) {
    console.error('Erreur scan produit:', error);
    // Si erreur réseau, retourner null (déjà cherché en cache)
    if (error.message.includes('Mode hors ligne') || error.message.includes('Network')) {
      return null;
    }
    throw error;
  }
}

/**
 * Récupère le stock d'un produit depuis Dolibarr
 * Dolibarr peut stocker le stock dans plusieurs champs :
 * - stock_reel : stock réel calculé
 * - stock : stock disponible
 * - stock_physique : stock physique
 * - ou via un appel séparé à /products/{id}/stock
 * 
 * @param {string|number} productId - L'ID du produit
 * @returns {Promise<Object>} - Les détails du produit avec stock calculé
 */
export async function getProductStock(productId) {
  try {
    // 📦 LOG DEBUG : Début récupération stock
    console.log('📦 STOCK: Récupération stock pour produit ID:', productId);
    
    // Utiliser getProductById qui gère déjà le cache
    const product = await getProductById(productId);
    
    // 📦 LOG DEBUG : Produit brut avec champs stock
    console.log('📦 STOCK RAW PRODUCT:', {
      id: product.id,
      ref: product.ref,
      stock_reel: product.stock_reel,
      stock: product.stock,
      stock_physique: product.stock_physique,
      stock_warehouse: product.stock_warehouse,
    });
    
    // Vérifier les champs stock possibles dans le produit
    let stockValue = null;
    
    if (product.stock_reel !== undefined && product.stock_reel !== null) {
      stockValue = Number(product.stock_reel);
    } else if (product.stock !== undefined && product.stock !== null) {
      stockValue = Number(product.stock);
    } else if (product.stock_physique !== undefined && product.stock_physique !== null) {
      stockValue = Number(product.stock_physique);
    }
    
    // Si stock trouvé dans le produit, le retourner
    if (stockValue !== null && !isNaN(stockValue)) {
      console.log('📦 STOCK CALCULATED:', stockValue, '(depuis champs produit)');
      return { ...product, stock: stockValue, stock_reel: stockValue };
    }

    // Si pas de stock dans le produit, essayer un appel API dédié
    const online = await isOnline();
    if (!online) {
      console.log('📦 STOCK: Mode offline, stock non disponible');
      return { ...product, stock: 0, stock_reel: 0 };
    }

    try {
      // Essayer l'endpoint stock dédié
      const stockData = await fetchDolibarrAPI(`/api/index.php/products/${productId}/stock`);
      
      // 📦 LOG DEBUG : Réponse API stock
      console.log('📦 STOCK API RESPONSE:', JSON.stringify(stockData, null, 2));
      
      // Extraire le stock de la réponse
      let calculatedStock = 0;
      
      if (stockData && typeof stockData === 'object') {
        // Structure possible : { stock_reel: X } ou { stock: X } ou { warehouses: [...] }
        if (stockData.stock_reel !== undefined) {
          calculatedStock = Number(stockData.stock_reel) || 0;
        } else if (stockData.stock !== undefined) {
          calculatedStock = Number(stockData.stock) || 0;
        } else if (stockData.warehouses && Array.isArray(stockData.warehouses)) {
          // Calculer le stock total depuis les entrepôts
          calculatedStock = stockData.warehouses.reduce((total, wh) => {
            const whStock = Number(wh.stock_reel || wh.stock || 0);
            return total + (isNaN(whStock) ? 0 : whStock);
          }, 0);
        }
      }
      
      console.log('📦 STOCK CALCULATED:', calculatedStock, '(depuis API stock)');
      
      return { 
        ...product, 
        stock: calculatedStock, 
        stock_reel: calculatedStock,
        stock_warehouse: stockData.warehouses || null,
      };
    } catch (error) {
      console.log('📦 STOCK: Erreur API stock, utilisation valeur par défaut');
      // Si erreur, retourner le produit avec stock à 0
      return { ...product, stock: 0, stock_reel: 0 };
    }
  } catch (error) {
    console.error('📦 STOCK ERROR:', error);
    throw error;
  }
}

/**
 * ⚠️ DÉPRÉCIÉ : Utiliser productImageService.getProductImage() à la place
 * 
 * Récupère l'URL de l'image d'un produit depuis Dolibarr
 * Cette fonction utilise viewimage.php qui ne fonctionne PAS avec DOLAPIKEY
 * 
 * @deprecated Utiliser services/productImageService.js::getProductImage() à la place
 * @param {Object} product - Objet produit
 * @returns {Promise<string|null>} - URL de l'image ou null
 */
export async function getProductImageUrl(product) {
  try {
    if (!product || !product.ref) {
      return null;
    }

    // 🖼️ LOG DEBUG : Début récupération image
    console.log('🖼️ IMAGE SOURCE RAW:', {
      id: product.id,
      ref: product.ref,
      photo: product.photo,
      photos: product.photos,
      documents: product.documents,
      images: product.images,
    });

    // Vérifier d'abord les champs directs (peu probable mais possible)
    if (product.photo && typeof product.photo === 'string' && product.photo.trim() !== '') {
      const url = await getDolibarrUrl();
      if (url) {
        const cleanUrl = url.replace(/\/$/, '');
        const imageUrl = product.photo.startsWith('http') 
          ? product.photo 
          : `${cleanUrl}${product.photo.startsWith('/') ? '' : '/'}${product.photo}`;
        console.log('🖼️ IMAGE URL (depuis champ photo):', imageUrl);
        return imageUrl;
      }
    }

    // Si pas de champ direct, appeler l'API documents
    const online = await isOnline();
    if (!online) {
      console.log('🖼️ IMAGE: Mode offline, image non disponible');
      return null;
    }

    try {
      const url = await getDolibarrUrl();
      if (!url) return null;

      const cleanUrl = url.replace(/\/$/, '');
      
      // Appeler l'API documents pour récupérer les fichiers du produit
      const documents = await fetchDolibarrAPI(
        `/api/index.php/documents?modulepart=product&ref=${encodeURIComponent(product.ref)}`
      );

      // 🖼️ LOG DEBUG : Documents récupérés
      console.log('🖼️ PRODUCT DOCUMENTS:', JSON.stringify(documents, null, 2));

      if (documents && Array.isArray(documents) && documents.length > 0) {
        // Chercher le premier document image (jpg, png, webp, etc.)
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const imageDoc = documents.find(doc => {
          const filename = (doc.filename || doc.name || '').toLowerCase();
          return imageExtensions.some(ext => filename.endsWith(ext));
        });

        if (imageDoc) {
          // Construire l'URL de l'image via viewimage.php
          const filePath = imageDoc.filename || imageDoc.name || imageDoc.file;
          if (filePath) {
            const imageUrl = `${cleanUrl}/viewimage.php?modulepart=product&file=${encodeURIComponent(filePath)}`;
            console.log('🖼️ IMAGE URL:', imageUrl);
            return imageUrl;
          }
        }
      } else if (documents && typeof documents === 'object') {
        // Structure possible : { documents: [...] }
        const docs = documents.documents || documents.files || [];
        if (Array.isArray(docs) && docs.length > 0) {
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const imageDoc = docs.find(doc => {
            const filename = (doc.filename || doc.name || '').toLowerCase();
            return imageExtensions.some(ext => filename.endsWith(ext));
          });

          if (imageDoc) {
            const filePath = imageDoc.filename || imageDoc.name || imageDoc.file;
            if (filePath) {
              const imageUrl = `${cleanUrl}/viewimage.php?modulepart=product&file=${encodeURIComponent(filePath)}`;
              console.log('🖼️ IMAGE URL:', imageUrl);
              return imageUrl;
            }
          }
        }
      }

      console.log('🖼️ IMAGE: Aucune image trouvée dans les documents');
      return null;
    } catch (error) {
      console.log('🖼️ IMAGE ERROR:', error.message);
      // Ne pas bloquer si erreur récupération image
      return null;
    }
  } catch (error) {
    console.error('🖼️ IMAGE ERROR:', error);
    return null;
  }
}
