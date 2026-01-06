/**
 * Service de base de données SQLite
 * Gère le stockage local persistant pour le mode offline
 */

import * as SQLite from 'expo-sqlite';

// Instance de la base de données
let db = null;

/**
 * Initialise la base de données SQLite
 * Crée les tables si elles n'existent pas
 */
export async function initDatabase() {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync('luxgreen_stock.db');
    
    // Créer les tables
    await db.execAsync(`
      -- Table des mouvements de stock
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_ref TEXT,
        type TEXT NOT NULL CHECK(type IN ('in', 'out')),
        quantity REAL NOT NULL,
        warehouse_id TEXT,
        label TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'syncing', 'synced', 'error')),
        created_at INTEGER NOT NULL,
        synced_at INTEGER,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        server_stock_before REAL,
        server_stock_after REAL
      );

      -- Index pour les requêtes fréquentes
      CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_movements_sync_status ON stock_movements(sync_status);
      CREATE INDEX IF NOT EXISTS idx_movements_created_at ON stock_movements(created_at);

      -- Table des stocks locaux calculés
      CREATE TABLE IF NOT EXISTS local_stocks (
        product_id TEXT PRIMARY KEY,
        product_ref TEXT,
        stock REAL NOT NULL DEFAULT 0,
        stock_reel REAL,
        last_sync_at INTEGER,
        updated_at INTEGER NOT NULL
      );

      -- Index pour les requêtes de stock
      CREATE INDEX IF NOT EXISTS idx_local_stocks_ref ON local_stocks(product_ref);
    `);

    console.log('✅ Base de données SQLite initialisée');
    return db;
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
    throw error;
  }
}

/**
 * Ferme la connexion à la base de données
 */
export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Récupère l'instance de la base de données
 * Initialise si nécessaire
 */
export async function getDatabase() {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

/**
 * Exécute une requête SQL avec gestion d'erreur
 */
async function executeQuery(query, params = []) {
  const database = await getDatabase();
  return await database.runAsync(query, params);
}

/**
 * Exécute une requête SELECT et retourne les résultats
 */
async function executeSelect(query, params = []) {
  const database = await getDatabase();
  const result = await database.getAllAsync(query, params);
  return result;
}

/**
 * Stocke un mouvement de stock dans la base locale
 */
export async function saveStockMovement(movement) {
  try {
    await executeQuery(
      `INSERT OR REPLACE INTO stock_movements (
        id, product_id, product_ref, type, quantity, warehouse_id, label,
        sync_status, created_at, synced_at, error_message, retry_count,
        server_stock_before, server_stock_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        String(movement.productId),
        movement.productRef || null,
        movement.type,
        movement.quantity,
        movement.warehouseId ? String(movement.warehouseId) : null,
        movement.label || null,
        movement.syncStatus,
        movement.createdAt,
        movement.syncedAt || null,
        movement.errorMessage || null,
        movement.retryCount,
        movement.serverStockBefore || null,
        movement.serverStockAfter || null,
      ]
    );
  } catch (error) {
    console.error('❌ Erreur sauvegarde mouvement:', error);
    throw error;
  }
}

/**
 * Récupère tous les mouvements en attente de synchronisation
 */
export async function getPendingMovements() {
  try {
    return await executeSelect(
      `SELECT * FROM stock_movements 
       WHERE sync_status IN ('pending', 'error')
       ORDER BY created_at ASC`
    );
  } catch (error) {
    console.error('❌ Erreur récupération mouvements en attente:', error);
    return [];
  }
}

/**
 * Récupère tous les mouvements d'un produit
 */
export async function getProductMovements(productId) {
  try {
    return await executeSelect(
      `SELECT * FROM stock_movements 
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [String(productId)]
    );
  } catch (error) {
    console.error('❌ Erreur récupération mouvements produit:', error);
    return [];
  }
}

/**
 * Met à jour le statut de synchronisation d'un mouvement
 */
export async function updateMovementSyncStatus(
  movementId,
  status,
  errorMessage,
  syncedAt
) {
  try {
    await executeQuery(
      `UPDATE stock_movements 
       SET sync_status = ?, 
           error_message = ?,
           synced_at = ?,
           retry_count = retry_count + 1
       WHERE id = ?`,
      [status, errorMessage || null, syncedAt || null, movementId]
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour statut mouvement:', error);
    throw error;
  }
}

/**
 * Met à jour ou crée le stock local d'un produit
 */
export async function updateLocalStock(
  productId,
  stock,
  stockReel,
  lastSyncAt
) {
  try {
    await executeQuery(
      `INSERT OR REPLACE INTO local_stocks 
       (product_id, stock, stock_reel, last_sync_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(productId),
        stock,
        stockReel || null,
        lastSyncAt || null,
        Date.now(),
      ]
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour stock local:', error);
    throw error;
  }
}

/**
 * Récupère le stock local d'un produit
 */
export async function getLocalStock(productId) {
  try {
    const result = await executeSelect(
      `SELECT stock FROM local_stocks WHERE product_id = ?`,
      [String(productId)]
    );
    
    if (result.length > 0) {
      return result[0].stock;
    }
    
    return 0;
  } catch (error) {
    console.error('❌ Erreur récupération stock local:', error);
    return 0;
  }
}

/**
 * Calcule le stock local d'un produit depuis tous ses mouvements
 */
export async function calculateLocalStock(productId) {
  try {
    const movements = await getProductMovements(productId);
    
    let stock = 0;
    for (const movement of movements) {
      if (movement.type === 'in') {
        stock += movement.quantity;
      } else if (movement.type === 'out') {
        stock -= movement.quantity;
      }
    }
    
    return Math.max(0, stock); // Stock ne peut pas être négatif
  } catch (error) {
    console.error('❌ Erreur calcul stock local:', error);
    return 0;
  }
}

/**
 * Récupère les statistiques de synchronisation
 */
export async function getSyncStats() {
  try {
    const stats = await executeSelect(
      `SELECT sync_status, COUNT(*) as count 
       FROM stock_movements 
       GROUP BY sync_status`
    );
    
    const result = {
      pendingCount: 0,
      errorCount: 0,
      syncedCount: 0,
    };
    
    for (const stat of stats) {
      if (stat.sync_status === 'pending' || stat.sync_status === 'syncing') {
        result.pendingCount += stat.count;
      } else if (stat.sync_status === 'error') {
        result.errorCount += stat.count;
      } else if (stat.sync_status === 'synced') {
        result.syncedCount += stat.count;
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur récupération stats sync:', error);
    return { pendingCount: 0, errorCount: 0, syncedCount: 0 };
  }
}

/**
 * Supprime les mouvements synchronisés anciens (nettoyage)
 * Garde uniquement les 1000 derniers mouvements synchronisés
 */
export async function cleanupSyncedMovements() {
  try {
    await executeQuery(
      `DELETE FROM stock_movements 
       WHERE sync_status = 'synced' 
       AND id NOT IN (
         SELECT id FROM stock_movements 
         WHERE sync_status = 'synced'
         ORDER BY synced_at DESC 
         LIMIT 1000
       )`
    );
  } catch (error) {
    console.error('❌ Erreur nettoyage mouvements:', error);
  }
}

