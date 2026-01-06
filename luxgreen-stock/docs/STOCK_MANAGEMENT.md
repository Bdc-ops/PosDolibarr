# Module de Gestion de Stock - Documentation

## Vue d'ensemble

Ce module fournit une gestion complète des mouvements de stock avec synchronisation offline-first vers Dolibarr.

## Architecture

### Services

- **`services/database.js`** : Base de données SQLite locale pour stocker les mouvements et stocks
- **`services/syncService.js`** : Service de synchronisation avec Dolibarr (singleton)
- **`services/network.js`** : Détection et écoute des changements réseau

### Hooks React

- **`hooks/useStockMovement.js`** : Hook principal pour gérer les mouvements de stock

## Utilisation

### 1. Initialisation

Le service se initialise automatiquement lors de l'utilisation du hook. Pour une initialisation manuelle :

```javascript
import { syncService } from './services/syncService';

// Initialiser le service
await syncService.initialize();
```

### 2. Utilisation du Hook dans un Composant

```javascript
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useStockMovement } from '../hooks/useStockMovement';

export default function ProductStockScreen({ route }) {
  const { productId } = route.params;
  
  const {
    localStock,        // Stock local calculé
    syncState,         // État de synchronisation
    loading,          // En cours de chargement
    addStock,         // Fonction pour ajouter du stock
    removeStock,      // Fonction pour retirer du stock
    sync,             // Forcer la synchronisation
    retryFailed,     // Réessayer les erreurs
    isOnline,         // Connexion réseau
    isSyncing,        // Synchronisation en cours
    hasPending,       // Mouvements en attente
    hasErrors,        // Erreurs de synchronisation
  } = useStockMovement(productId);

  const handleAddStock = async () => {
    try {
      await addStock(1, {
        label: 'Réception commande',
        warehouseId: 1,
      });
      Alert.alert('Succès', 'Stock ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleRemoveStock = async () => {
    try {
      await removeStock(1, {
        label: 'Vente',
      });
      Alert.alert('Succès', 'Stock retiré avec succès');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View>
      <Text>Stock local: {localStock}</Text>
      
      {/* Indicateur de synchronisation */}
      <View>
        {isOnline ? (
          isSyncing ? (
            <Text>🟠 Synchronisation en cours...</Text>
          ) : hasPending ? (
            <Text>🟠 {syncState.pendingCount} mouvement(s) en attente</Text>
          ) : hasErrors ? (
            <Text>🔴 {syncState.errorCount} erreur(s)</Text>
          ) : (
            <Text>🟢 Synchronisé</Text>
          )
        ) : (
          <Text>📴 Mode hors ligne</Text>
        )}
      </View>

      <Button title="+ Ajouter stock" onPress={handleAddStock} disabled={loading} />
      <Button title="- Retirer stock" onPress={handleRemoveStock} disabled={loading} />
      
      {hasErrors && (
        <Button title="Réessayer les erreurs" onPress={retryFailed} />
      )}
      
      <Button title="Synchroniser" onPress={sync} disabled={!isOnline || isSyncing} />
    </View>
  );
}
```

### 3. Écouter l'État de Synchronisation

```javascript
import { useEffect } from 'react';
import { syncService } from './services/syncService';

function MyComponent() {
  useEffect(() => {
    const unsubscribe = syncService.addStateListener((state) => {
      console.log('État sync:', state);
      // state.isOnline
      // state.isSyncing
      // state.pendingCount
      // state.errorCount
      // state.lastSyncAt
      // state.lastSyncError
    });

    return unsubscribe;
  }, []);
}
```

### 4. Synchronisation Manuelle

```javascript
import { syncService } from './services/syncService';

// Synchroniser tous les mouvements en attente
const result = await syncService.syncPendingMovements();

console.log('Résultat:', {
  success: result.success,
  syncedCount: result.syncedCount,
  errorCount: result.errorCount,
  errors: result.errors,
});

// Réessayer les erreurs
await syncService.retryFailedMovements();
```

### 5. Récupérer le Stock Local

```javascript
import { calculateLocalStock, getLocalStock } from './services/database';

// Stock depuis la table local_stocks (plus rapide)
const stock = await getLocalStock(productId);

// Stock calculé depuis tous les mouvements (plus précis)
const calculatedStock = await calculateLocalStock(productId);
```

## Structure des Données

### StockMovement

```javascript
{
  id: string,                    // UUID généré localement
  productId: string | number,    // ID du produit
  productRef?: string,           // Référence produit
  type: 'in' | 'out',            // Type de mouvement
  quantity: number,               // Quantité (toujours positive)
  warehouseId?: string | number, // ID entrepôt
  label?: string,                // Libellé
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error',
  createdAt: number,              // Timestamp
  syncedAt?: number,             // Timestamp de sync
  errorMessage?: string,         // Message d'erreur
  retryCount: number,            // Nombre de tentatives
}
```

### SyncState

```javascript
{
  isOnline: boolean,              // Connexion réseau
  isSyncing: boolean,            // Sync en cours
  pendingCount: number,          // Mouvements en attente
  errorCount: number,            // Mouvements en erreur
  lastSyncAt?: number,           // Dernière sync réussie
  lastSyncError?: string,        // Dernière erreur
}
```

## Comportement Offline

1. **Création de mouvement offline** :
   - Le mouvement est sauvegardé localement avec `syncStatus: 'pending'`
   - Le stock local est mis à jour immédiatement
   - Le mouvement est ajouté à la file d'attente

2. **Retour en ligne** :
   - Détection automatique du retour réseau
   - Synchronisation automatique de tous les mouvements en attente
   - Mise à jour des statuts

3. **Gestion des erreurs** :
   - Les mouvements en erreur restent dans la file d'attente
   - Possibilité de réessayer manuellement
   - Logs détaillés pour le diagnostic

## API Dolibarr

Le service envoie les mouvements à Dolibarr via :

```
POST /api/index.php/stockmovements
Headers: {
  DOLAPIKEY: {apiKey},
  Content-Type: application/json
}
Body: {
  product_id: string | number,
  warehouse_id: string | number | null,
  qty: number,  // Positif pour entrée, négatif pour sortie
  label: string,
  type_mouvement: 0 | 1  // 0 = entrée, 1 = sortie
}
```

**Note** : L'endpoint peut varier selon la version de Dolibarr. Vérifier la documentation de votre API.

## Sécurité

- ✅ Clé API stockée dans SecureStore (jamais en dur)
- ✅ Aucune clé API dans les URLs
- ✅ Validation des quantités (toujours positives)
- ✅ Vérification du stock disponible avant retrait

## Performance

- Base de données SQLite locale (rapide)
- Index sur les colonnes fréquemment utilisées
- Nettoyage automatique des anciens mouvements synchronisés
- Synchronisation en arrière-plan (non bloquante)

## Dépannage

### Les mouvements ne se synchronisent pas

1. Vérifier la connexion réseau : `syncState.isOnline`
2. Vérifier la configuration Dolibarr : URL et clé API
3. Vérifier les logs console pour les erreurs détaillées
4. Vérifier l'endpoint API Dolibarr (peut varier selon la version)

### Stock local incorrect

1. Utiliser `calculateLocalStock()` pour recalculer depuis les mouvements
2. Vérifier les mouvements du produit : `getProductMovements(productId)`
3. Vérifier la cohérence entre `local_stocks` et les mouvements

### Erreurs de synchronisation

1. Vérifier `syncState.errorCount` et `syncState.lastSyncError`
2. Utiliser `retryFailed()` pour réessayer
3. Vérifier les logs pour les détails de chaque erreur

