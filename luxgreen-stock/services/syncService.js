/**
 * Service de synchronisation des mouvements de stock
 * Gère la file d'attente offline et la synchronisation avec Dolibarr
 */

import { isOnline, watchNetwork } from './network';
import { getDolibarrUrl, getDolibarrApiKey } from './storage';
import {
  saveStockMovement,
  getPendingMovements,
  updateMovementSyncStatus,
  updateLocalStock,
  getLocalStock,
  calculateLocalStock,
  getSyncStats,
  cleanupSyncedMovements,
} from './database';

// Instance singleton du service
class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.networkWatcher = null;
    this.syncStateListeners = [];
    this.syncState = {
      isOnline: false,
      isSyncing: false,
      pendingCount: 0,
      errorCount: 0,
    };
  }

  /**
   * Initialise le service de synchronisation
   * Démarre l'écoute du réseau et la synchronisation automatique
   */
  async initialize() {
    try {
      // Vérifier l'état réseau initial
      const online = await isOnline();
      this.syncState.isOnline = online;
      this.notifyListeners();

      // Démarrer l'écoute du réseau
      this.networkWatcher = watchNetwork(async (online) => {
        this.syncState.isOnline = online;
        this.notifyListeners();

        // Si on revient en ligne, synchroniser automatiquement
        if (online && !this.syncInProgress) {
          await this.syncPendingMovements();
        }
      });

      // Synchroniser immédiatement si online
      if (online) {
        await this.syncPendingMovements();
      }

      // Mettre à jour les stats
      await this.updateStats();

      console.log('✅ SyncService initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation SyncService:', error);
    }
  }

  /**
   * Arrête le service de synchronisation
   */
  stop() {
    if (this.networkWatcher) {
      this.networkWatcher();
      this.networkWatcher = null;
    }
  }

  /**
   * Ajoute un listener pour les changements d'état de synchronisation
   */
  addStateListener(listener) {
    this.syncStateListeners.push(listener);
    // Retourner une fonction pour se désabonner
    return () => {
      const index = this.syncStateListeners.indexOf(listener);
      if (index > -1) {
        this.syncStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Récupère l'état actuel de synchronisation
   */
  getState() {
    return { ...this.syncState };
  }

  /**
   * Notifie tous les listeners du changement d'état
   */
  notifyListeners() {
    this.syncStateListeners.forEach((listener) => {
      try {
        listener(this.syncState);
      } catch (error) {
        console.error('❌ Erreur notification listener:', error);
      }
    });
  }

  /**
   * Met à jour les statistiques de synchronisation
   */
  async updateStats() {
    try {
      const stats = await getSyncStats();
      this.syncState.pendingCount = stats.pendingCount;
      this.syncState.errorCount = stats.errorCount;
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Erreur mise à jour stats:', error);
    }
  }

  /**
   * Crée un mouvement de stock (entrée ou sortie)
   * @param {string|number} productId - ID du produit
   * @param {'in'|'out'} type - Type de mouvement
   * @param {number} quantity - Quantité (toujours positive)
   * @param {Object} options - Options supplémentaires
   */
  async createStockMovement(productId, type, quantity, options = {}) {
    if (quantity <= 0) {
      throw new Error('La quantité doit être positive');
    }

    // Générer un ID unique pour le mouvement
    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Récupérer le stock local actuel
    const currentStock = await getLocalStock(productId);

    // Créer le mouvement
    const movement = {
      id: movementId,
      productId,
      type,
      quantity,
      warehouseId: options.warehouseId,
      label: options.label || (type === 'in' ? 'Entrée de stock' : 'Sortie de stock'),
      syncStatus: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      serverStockBefore: currentStock,
    };

    // Sauvegarder localement
    await saveStockMovement(movement);

    // Mettre à jour le stock local immédiatement
    const newStock = type === 'in' 
      ? currentStock + quantity 
      : Math.max(0, currentStock - quantity);
    
    await updateLocalStock(productId, newStock);

    // Mettre à jour les stats
    await this.updateStats();

    // Si online et pas de skipSync, synchroniser immédiatement
    if (this.syncState.isOnline && !options.skipSync) {
      // Synchroniser en arrière-plan (ne pas bloquer)
      this.syncPendingMovements().catch((error) => {
        console.error('❌ Erreur synchronisation automatique:', error);
      });
    }

    console.log(`📦 Mouvement créé: ${type} ${quantity} pour produit ${productId}`);
    return movement;
  }

  /**
   * Synchronise tous les mouvements en attente avec Dolibarr
   * @param {boolean} forceRetry - Forcer la resynchronisation même si erreur précédente
   */
  async syncPendingMovements(forceRetry = false) {
    // Vérifier si déjà en cours
    if (this.syncInProgress) {
      console.log('⏳ Synchronisation déjà en cours');
      return {
        success: false,
        syncedCount: 0,
        errorCount: 0,
        errors: [],
      };
    }

    // Vérifier si online
    if (!this.syncState.isOnline) {
      console.log('📴 Mode offline, synchronisation impossible');
      return {
        success: false,
        syncedCount: 0,
        errorCount: 0,
        errors: [],
      };
    }

    this.syncInProgress = true;
    this.syncState.isSyncing = true;
    this.notifyListeners();

    try {
      // Récupérer les mouvements en attente
      const pendingMovements = await getPendingMovements();
      
      if (pendingMovements.length === 0) {
        this.syncState.isSyncing = false;
        this.syncState.lastSyncAt = Date.now();
        this.notifyListeners();
        return {
          success: true,
          syncedCount: 0,
          errorCount: 0,
          errors: [],
        };
      }

      console.log(`🔄 Synchronisation de ${pendingMovements.length} mouvements...`);

      const result = {
        success: true,
        syncedCount: 0,
        errorCount: 0,
        errors: [],
        conflicts: [],
      };

      // Synchroniser chaque mouvement
      for (const movement of pendingMovements) {
        try {
          // Marquer comme en cours de synchronisation
          await updateMovementSyncStatus(movement.id, 'syncing');

          // Envoyer à Dolibarr
          const syncSuccess = await this.sendMovementToDolibarr(movement);

          if (syncSuccess) {
            // Marquer comme synchronisé
            await updateMovementSyncStatus(
              movement.id,
              'synced',
              undefined,
              Date.now()
            );
            result.syncedCount++;
          } else {
            throw new Error('Échec de la synchronisation');
          }
        } catch (error) {
          // Marquer comme erreur
          const errorMessage = error?.message || error?.toString() || String(error) || 'Erreur inconnue';
          await updateMovementSyncStatus(movement.id, 'error', errorMessage);
          
          result.errorCount++;
          result.errors.push({
            movementId: movement.id,
            error: errorMessage,
          });
          result.success = false;

          console.error(`❌ Erreur synchronisation mouvement ${movement.id}:`, error);
        }
      }

      // Mettre à jour les stats
      await this.updateStats();
      this.syncState.lastSyncAt = Date.now();
      this.syncState.lastSyncError = result.errors.length > 0 
        ? `${result.errors.length} erreur(s)` 
        : undefined;

      // Nettoyer les anciens mouvements synchronisés
      await cleanupSyncedMovements();

      console.log(`✅ Synchronisation terminée: ${result.syncedCount} réussis, ${result.errorCount} erreurs`);

      return result;
    } catch (error) {
      console.error('❌ Erreur synchronisation globale:', error);
      this.syncState.lastSyncError = error instanceof Error ? error.message : 'Erreur inconnue';
      return {
        success: false,
        syncedCount: 0,
        errorCount: 0,
        errors: [{ movementId: 'global', error: String(error) }],
      };
    } finally {
      this.syncInProgress = false;
      this.syncState.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Envoie un mouvement de stock à Dolibarr via l'API
   * @param {Object} movement - Mouvement à synchroniser
   * @returns {Promise<boolean>} - true si succès, false sinon
   */
  async sendMovementToDolibarr(movement) {
    try {
      const url = await getDolibarrUrl();
      const apiKey = await getDolibarrApiKey();

      if (!url || !apiKey) {
        throw new Error('Configuration manquante');
      }

      const cleanUrl = url.replace(/\/$/, '');
      
      // Construire le payload selon l'API Dolibarr
      // Format attendu par Dolibarr pour les mouvements de stock
      // Note: Les mouvements de la DB utilisent snake_case, ceux créés utilisent camelCase
      // Note: warehouse_id est requis par l'API Dolibarr, utiliser 1 par défaut si non fourni
      const warehouseId = movement.warehouse_id || movement.warehouseId;
      const payload = {
        product_id: movement.product_id || movement.productId,
        warehouse_id: (warehouseId !== null && warehouseId !== undefined) ? warehouseId : 1, // Entrepôt par défaut = 1
        qty: movement.type === 'in' ? movement.quantity : -movement.quantity,
        label: movement.label || (movement.type === 'in' ? 'Entrée' : 'Sortie'),
        type_mouvement: movement.type === 'in' ? 0 : 1, // 0 = entrée, 1 = sortie
      };

      // Appel API Dolibarr
      // Note: L'endpoint exact peut varier selon la version Dolibarr
      // Endpoints possibles:
      // - /api/index.php/stockmovements
      // - /api/index.php/products/{id}/stock
      const endpoint = `/api/index.php/stockmovements`;
      const fullUrl = `${cleanUrl}${endpoint}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'DOLAPIKEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        let errorBody = null;
        try {
          errorBody = await response.json();
          // Extraire le message d'erreur depuis la structure Dolibarr
          if (errorBody.error && typeof errorBody.error === 'object' && errorBody.error.message) {
            errorMessage = errorBody.error.message;
          } else if (errorBody.error && typeof errorBody.error === 'string') {
            errorMessage = errorBody.error;
          } else if (errorBody.message) {
            errorMessage = errorBody.message;
          } else if (errorBody.error) {
            errorMessage = JSON.stringify(errorBody.error);
          } else {
            errorMessage = JSON.stringify(errorBody);
          }
        } catch (e) {
          // Essayer de lire le texte brut
          try {
            const text = await response.text();
            errorMessage = `Erreur HTTP ${response.status}: ${text}`;
          } catch (textError) {
            // Ignorer si impossible de lire le texte
          }
        }
        throw new Error(errorMessage);
      }

      // Vérifier la réponse
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Erreur parsing réponse: ${parseError.message || String(parseError)}`);
      }
      console.log('✅ Mouvement synchronisé:', movement.id, responseData);

      return true;
    } catch (error) {
      console.error('❌ Erreur envoi mouvement à Dolibarr:', error);
      throw error;
    }
  }

  /**
   * Réessaie la synchronisation des mouvements en erreur
   */
  async retryFailedMovements() {
    console.log('🔄 Nouvelle tentative de synchronisation des erreurs...');
    return await this.syncPendingMovements(true);
  }

  /**
   * Récupère le stock local d'un produit (calculé depuis les mouvements)
   */
  async getProductLocalStock(productId) {
    return await calculateLocalStock(productId);
  }
}

// Instance singleton
export const syncService = new SyncService();

