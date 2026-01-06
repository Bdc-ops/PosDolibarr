/**
 * Types pour la gestion de stock
 * Documentation des structures de données utilisées
 */

/**
 * @typedef {'pending' | 'syncing' | 'synced' | 'error'} SyncStatus
 * Statut de synchronisation d'un mouvement
 */

/**
 * @typedef {'in' | 'out'} StockMovementType
 * Type de mouvement de stock
 */

/**
 * @typedef {Object} StockMovement
 * @property {string} id - UUID généré localement
 * @property {string|number} productId - ID du produit
 * @property {string} [productRef] - Référence produit
 * @property {StockMovementType} type - 'in' pour entrée, 'out' pour sortie
 * @property {number} quantity - Quantité (toujours positive)
 * @property {string|number} [warehouseId] - ID entrepôt si applicable
 * @property {string} [label] - Libellé du mouvement
 * @property {SyncStatus} syncStatus - État de synchronisation
 * @property {number} createdAt - Timestamp de création (local)
 * @property {number} [syncedAt] - Timestamp de synchronisation réussie
 * @property {string} [errorMessage] - Message d'erreur si syncStatus === 'error'
 * @property {number} retryCount - Nombre de tentatives de synchronisation
 * @property {number} [serverStockBefore] - Stock serveur avant le mouvement
 * @property {number} [serverStockAfter] - Stock serveur après le mouvement
 */

/**
 * @typedef {Object} SyncState
 * @property {boolean} isOnline - État de la connexion réseau
 * @property {boolean} isSyncing - Synchronisation en cours
 * @property {number} pendingCount - Nombre de mouvements en attente
 * @property {number} errorCount - Nombre de mouvements en erreur
 * @property {number} [lastSyncAt] - Timestamp de la dernière synchronisation réussie
 * @property {string} [lastSyncError] - Dernière erreur de synchronisation
 */

/**
 * @typedef {Object} SyncResult
 * @property {boolean} success - Succès global
 * @property {number} syncedCount - Nombre de mouvements synchronisés
 * @property {number} errorCount - Nombre d'erreurs
 * @property {Array<{movementId: string, error: string}>} errors - Liste des erreurs
 * @property {Array} [conflicts] - Conflits détectés
 */

/**
 * @typedef {Object} StockMovementOptions
 * @property {string|number} [warehouseId] - ID entrepôt
 * @property {string} [label] - Libellé du mouvement
 * @property {boolean} [skipSync] - Ne pas synchroniser immédiatement
 */

// Export des constantes pour utilisation dans le code
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
};

export const MOVEMENT_TYPE = {
  IN: 'in',
  OUT: 'out',
};

