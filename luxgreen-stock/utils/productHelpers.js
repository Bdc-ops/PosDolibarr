/**
 * Utilitaires pour l'extraction des données produits Dolibarr
 * 
 * NOTE IMPORTANTE sur les champs Dolibarr :
 * - "label" : Nom commercial/libellé du produit (priorité 1)
 * - "name" : Nom technique du produit (priorité 2)
 * - "ref" : Référence du produit (priorité 3, utilisé si label/name absents)
 * - "description" : Description longue (non utilisé pour le nom)
 * 
 * Certains produits peuvent n'avoir que "ref" si :
 * - Le produit n'a pas de libellé défini dans Dolibarr
 * - Le produit est un service ou un article générique
 * - La configuration Dolibarr n'exige pas de libellé
 */

/**
 * Extrait le nom du produit selon la priorité Dolibarr
 * Priorité : label > name > ref
 * Ne retourne JAMAIS "Sans nom" ou une valeur vide
 * 
 * @param {Object} product - Objet produit de l'API Dolibarr
 * @returns {string} - Le nom du produit (toujours une valeur valide)
 */
export function getProductName(product) {
  if (!product || typeof product !== 'object') {
    return 'Produit sans référence';
  }

  // Priorité 1 : label (libellé commercial)
  if (product.label && typeof product.label === 'string' && product.label.trim() !== '') {
    return product.label.trim();
  }

  // Priorité 2 : name (nom technique)
  if (product.name && typeof product.name === 'string' && product.name.trim() !== '') {
    return product.name.trim();
  }

  // Priorité 3 : ref (référence) - toujours présent dans Dolibarr
  if (product.ref && typeof product.ref === 'string' && product.ref.trim() !== '') {
    return product.ref.trim();
  }

  // Fallback : si vraiment rien n'est disponible
  return `Produit #${product.id || 'inconnu'}`;
}

/**
 * Extrait la référence du produit
 * 
 * @param {Object} product - Objet produit de l'API Dolibarr
 * @returns {string|null} - La référence ou null
 */
export function getProductRef(product) {
  if (!product || typeof product !== 'object') {
    return null;
  }

  if (product.ref && typeof product.ref === 'string' && product.ref.trim() !== '') {
    return product.ref.trim();
  }

  return null;
}

/**
 * Détermine si le produit a un nom "complet" (label ou name)
 * vs juste une référence
 * 
 * @param {Object} product - Objet produit de l'API Dolibarr
 * @returns {boolean} - true si le produit a un label ou name
 */
export function hasProductName(product) {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const hasLabel = product.label && typeof product.label === 'string' && product.label.trim() !== '';
  const hasName = product.name && typeof product.name === 'string' && product.name.trim() !== '';
  
  return hasLabel || hasName;
}

