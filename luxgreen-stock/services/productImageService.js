/**
 * Service de gestion des images produits Dolibarr
 * Télécharge et met en cache les images via l'API REST
 * SANS utiliser viewimage.php (incompatible avec DOLAPIKEY)
 */

import * as FileSystem from 'expo-file-system';
import { getDolibarrUrl, getDolibarrApiKey } from './storage';
import { isOnline } from './network';

// Répertoire de cache des images
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}product_images/`;

/**
 * Initialise le répertoire de cache
 */
async function ensureCacheDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
    console.log('📁 Cache directory créé:', IMAGE_CACHE_DIR);
  }
}

/**
 * Récupère la liste des documents d'un produit
 * @param {string} productRef - Référence du produit
 * @returns {Promise<Array>} - Liste des documents
 */
async function fetchProductDocuments(productRef) {
  try {
    const url = await getDolibarrUrl();
    const apiKey = await getDolibarrApiKey();

    if (!url || !apiKey) {
      throw new Error('Configuration manquante');
    }

    const cleanUrl = url.replace(/\/$/, '');
    const endpoint = `/api/index.php/documents?modulepart=product&ref=${encodeURIComponent(productRef)}`;

    const response = await fetch(`${cleanUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'DOLAPIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // 🖼️ DEBUG : Logger la réponse
    console.log('🖼️ DOCUMENTS RAW:', JSON.stringify(data, null, 2));

    // Dolibarr peut retourner différentes structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.documents && Array.isArray(data.documents)) {
      return data.documents;
    } else if (data.files && Array.isArray(data.files)) {
      return data.files;
    }

    return [];
  } catch (error) {
    console.error('❌ Erreur récupération documents:', error);
    throw error;
  }
}

/**
 * Extrait le chemin relatif depuis le chemin complet Dolibarr
 * Supprime "/var/www/documents/" ou équivalent
 * @param {string} fullPath - Chemin complet (ex: /var/www/documents/produit/REF/file.jpg)
 * @returns {string} - Chemin relatif (ex: produit/REF/file.jpg)
 */
function extractRelativePath(fullPath) {
  if (!fullPath) return null;

  // Supprimer les préfixes communs
  const prefixes = [
    '/var/www/documents/',
    '/var/www/html/documents/',
    '/home/dolibarr/documents/',
    'documents/',
  ];

  let relativePath = fullPath;
  for (const prefix of prefixes) {
    if (relativePath.startsWith(prefix)) {
      relativePath = relativePath.substring(prefix.length);
      break;
    }
  }

  // Si le chemin commence encore par /, le supprimer
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1);
  }

  return relativePath;
}

/**
 * Télécharge une image depuis l'API Dolibarr
 * @param {string} relativePath - Chemin relatif du fichier
 * @param {string} productId - ID du produit (pour le nom de fichier cache)
 * @param {string} originalPath - Chemin original (pour debug)
 * @returns {Promise<string>} - Chemin local du fichier téléchargé
 */
async function downloadProductImage(relativePath, productId, originalPath = null) {
  try {
    const url = await getDolibarrUrl();
    const apiKey = await getDolibarrApiKey();

    if (!url || !apiKey) {
      throw new Error('Configuration manquante');
    }

    const cleanUrl = url.replace(/\/$/, '');
    
    // Construire l'URL de téléchargement
    const downloadUrl = `${cleanUrl}/api/index.php/documents/download?modulepart=product&file=${encodeURIComponent(relativePath)}`;

    // 🖼️ DEBUG : Logger les chemins
    console.log('🖼️ DOWNLOAD URL:', downloadUrl);
    console.log('🖼️ RELATIVE PATH:', relativePath);
    if (originalPath) {
      console.log('🖼️ ORIGINAL PATH:', originalPath);
    }

    // S'assurer que le répertoire de cache existe
    await ensureCacheDirectory();

    // Déterminer l'extension du fichier
    const extension = relativePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
    const cacheFileName = `${productId}${extension}`;
    const cacheFilePath = `${IMAGE_CACHE_DIR}${cacheFileName}`;

    // Télécharger le fichier avec les headers d'authentification
    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      cacheFilePath,
      {
        headers: {
          'DOLAPIKEY': apiKey,
        },
      }
    );

    // Vérifier le statut du téléchargement
    if (downloadResult.status !== 200) {
      // Supprimer le fichier partiel s'il existe
      try {
        const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(cacheFilePath, { idempotent: true });
        }
      } catch (e) {
        // Ignorer les erreurs de suppression
      }
      throw new Error(`Erreur téléchargement: HTTP ${downloadResult.status}`);
    }

    // Vérifier que le fichier a bien été créé
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('Fichier téléchargé vide ou inexistant');
    }

    console.log('✅ Image téléchargée:', downloadResult.uri);
    console.log('✅ Taille fichier:', fileInfo.size, 'bytes');
    return downloadResult.uri;
  } catch (error) {
    console.error('❌ Erreur téléchargement image:', error);
    throw error;
  }
}

/**
 * Récupère le chemin local d'une image en cache
 * @param {string|number} productId - ID du produit
 * @returns {Promise<string|null>} - Chemin local ou null si non trouvé
 */
async function getCachedProductImage(productId) {
  try {
    await ensureCacheDirectory();
    
    // Chercher le fichier avec différentes extensions possibles
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    for (const ext of extensions) {
      const imagePath = `${IMAGE_CACHE_DIR}${productId}${ext}`;
      const fileInfo = await FileSystem.getInfoAsync(imagePath);

      if (fileInfo.exists) {
        console.log('📦 Image en cache trouvée:', imagePath);
        return imagePath;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur vérification cache:', error);
    return null;
  }
}

/**
 * Récupère ou télécharge l'image d'un produit
 * @param {Object} product - Objet produit avec id et ref
 * @returns {Promise<string|null>} - Chemin local de l'image ou null
 */
export async function getProductImage(product) {
  try {
    if (!product || !product.id || !product.ref) {
      console.log('🖼️ Produit invalide pour image');
      return null;
    }

    const productId = String(product.id);
    const productRef = product.ref;

    // 🖼️ DEBUG : Logger le produit
    console.log('🖼️ GET IMAGE:', { id: productId, ref: productRef });

    // Vérifier d'abord le cache
    const cachedImage = await getCachedProductImage(productId);
    if (cachedImage) {
      return cachedImage;
    }

    // Si pas en cache, vérifier la connexion
    const online = await isOnline();
    if (!online) {
      console.log('🖼️ Mode offline, image non disponible');
      return null;
    }

    // Récupérer les documents du produit
    const documents = await fetchProductDocuments(productRef);

    if (!documents || documents.length === 0) {
      console.log('🖼️ Aucun document trouvé pour le produit');
      return null;
    }

    // Chercher un document image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageDoc = documents.find(doc => {
      const filename = (doc.filename || doc.name || doc.fullname || '').toLowerCase();
      return imageExtensions.some(ext => filename.endsWith(ext));
    });

    if (!imageDoc) {
      console.log('🖼️ Aucune image trouvée dans les documents');
      return null;
    }

    // 🖼️ DEBUG : Logger le document trouvé
    console.log('🖼️ IMAGE DOC:', {
      filename: imageDoc.filename,
      name: imageDoc.name,
      fullname: imageDoc.fullname,
    });

    // Extraire le chemin relatif
    const fullPath = imageDoc.fullname || imageDoc.filename || imageDoc.name || imageDoc.file;
    if (!fullPath) {
      console.log('🖼️ Chemin du document introuvable');
      return null;
    }

    const relativePath = extractRelativePath(fullPath);
    if (!relativePath) {
      console.log('🖼️ Impossible d\'extraire le chemin relatif, utilisation du chemin complet');
      // Si on ne peut pas extraire, essayer d'utiliser le chemin tel quel
      // mais en supprimant juste le préfixe absolu
      const pathToUse = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
      const localPath = await downloadProductImage(pathToUse, productId, fullPath);
      return localPath;
    }

    // Télécharger l'image
    const localPath = await downloadProductImage(relativePath, productId, fullPath);
    return localPath;
  } catch (error) {
    console.error('❌ Erreur getProductImage:', error);
    return null;
  }
}

/**
 * Nettoie le cache des images (supprime les fichiers anciens)
 * @param {number} maxAge - Âge maximum en millisecondes (défaut: 7 jours)
 */
export async function clearImageCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    await ensureCacheDirectory();
    
    const files = await FileSystem.readDirectoryAsync(IMAGE_CACHE_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = `${IMAGE_CACHE_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists && fileInfo.modificationTime) {
        const age = now - fileInfo.modificationTime * 1000;
        if (age > maxAge) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log('🗑️ Image supprimée du cache:', file);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage cache:', error);
  }
}

/**
 * Supprime l'image en cache d'un produit spécifique
 * @param {string|number} productId - ID du produit
 */
export async function clearProductImageCache(productId) {
  try {
    const imagePath = `${IMAGE_CACHE_DIR}${productId}.jpg`;
    await FileSystem.deleteAsync(imagePath, { idempotent: true });
    console.log('🗑️ Image supprimée du cache:', productId);
  } catch (error) {
    console.error('❌ Erreur suppression image cache:', error);
  }
}

