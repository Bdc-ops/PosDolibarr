/**
 * Hook React pour la gestion des mouvements de stock
 * API simple et réactive pour les composants
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { getLocalStock, calculateLocalStock } from '../services/database';
import * as Haptics from 'expo-haptics';

/**
 * Hook pour gérer les mouvements de stock
 * @param {string|number} [productId] - ID du produit (optionnel, pour récupérer le stock)
 * @returns {Object} API pour les mouvements de stock
 */
export function useStockMovement(productId) {
  const [syncState, setSyncState] = useState(syncService.getState());
  const [localStock, setLocalStock] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialiser le service et écouter les changements d'état
  useEffect(() => {
    // Initialiser le service
    syncService.initialize().catch(console.error);

    // Écouter les changements d'état
    const unsubscribe = syncService.addStateListener((state) => {
      setSyncState(state);
    });

    // Charger le stock local si productId fourni
    if (productId) {
      loadLocalStock();
    }

    return () => {
      unsubscribe();
      syncService.stop();
    };
  }, [productId]);

  /**
   * Charge le stock local du produit
   */
  const loadLocalStock = useCallback(async () => {
    if (!productId) return;

    try {
      const stock = await calculateLocalStock(productId);
      setLocalStock(stock);
    } catch (error) {
      console.error('❌ Erreur chargement stock local:', error);
    }
  }, [productId]);

  /**
   * Ajoute du stock (entrée)
   * @param {number} quantity - Quantité à ajouter
   * @param {Object} options - Options supplémentaires
   */
  const addStock = useCallback(
    async (quantity, options = {}) => {
      if (!productId) {
        throw new Error('productId requis pour addStock');
      }

      if (quantity <= 0) {
        throw new Error('La quantité doit être positive');
      }

      setLoading(true);

      try {
        // Feedback haptique
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Créer le mouvement
        const movement = await syncService.createStockMovement(
          productId,
          'in',
          quantity,
          options
        );

        // Recharger le stock local
        await loadLocalStock();

        // Feedback visuel (optionnel, peut être géré par le composant)
        console.log(`✅ Stock ajouté: +${quantity}`);

        return movement;
      } catch (error) {
        console.error('❌ Erreur ajout stock:', error);
        // Feedback haptique erreur
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [productId, loadLocalStock]
  );

  /**
   * Retire du stock (sortie)
   * @param {number} quantity - Quantité à retirer
   * @param {Object} options - Options supplémentaires
   */
  const removeStock = useCallback(
    async (quantity, options = {}) => {
      if (!productId) {
        throw new Error('productId requis pour removeStock');
      }

      if (quantity <= 0) {
        throw new Error('La quantité doit être positive');
      }

      setLoading(true);

      try {
        // Vérifier le stock disponible
        const currentStock = await getLocalStock(productId);
        if (currentStock < quantity) {
          throw new Error(
            `Stock insuffisant. Stock disponible: ${currentStock}, demandé: ${quantity}`
          );
        }

        // Feedback haptique
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Créer le mouvement
        const movement = await syncService.createStockMovement(
          productId,
          'out',
          quantity,
          options
        );

        // Recharger le stock local
        await loadLocalStock();

        console.log(`✅ Stock retiré: -${quantity}`);

        return movement;
      } catch (error) {
        console.error('❌ Erreur retrait stock:', error);
        // Feedback haptique erreur
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [productId, loadLocalStock]
  );

  /**
   * Force la synchronisation des mouvements en attente
   */
  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncService.syncPendingMovements();
      // Recharger le stock après synchronisation
      if (productId) {
        await loadLocalStock();
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [productId, loadLocalStock]);

  /**
   * Réessaie les mouvements en erreur
   */
  const retryFailed = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncService.retryFailedMovements();
      if (productId) {
        await loadLocalStock();
      }
      return result;
    } catch (error) {
      console.error('❌ Erreur retry:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [productId, loadLocalStock]);

  return {
    // État
    localStock,
    syncState,
    loading,

    // Actions
    addStock,
    removeStock,
    sync,
    retryFailed,
    refreshStock: loadLocalStock,

    // Helpers
    isOnline: syncState.isOnline,
    isSyncing: syncState.isSyncing,
    hasPending: syncState.pendingCount > 0,
    hasErrors: syncState.errorCount > 0,
  };
}

/**
 * Hook simplifié pour récupérer uniquement le stock local
 * @param {string|number} productId - ID du produit
 */
export function useLocalStock(productId) {
  const { localStock, refreshStock } = useStockMovement(productId);
  return { localStock, refreshStock };
}

