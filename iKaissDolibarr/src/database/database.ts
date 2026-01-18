/**
 * Base de données locale SQLite
 * Stocke les données offline pour fonctionnement sans connexion
 * Synchronisation automatique avec Dolibarr quand la connexion est disponible
 */

import * as SQLite from 'expo-sqlite';

/**
 * Instance de la base de données
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialise la base de données locale
 * Gère les erreurs si le module natif n'est pas disponible (Expo Go)
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    // Vérifie si le module SQLite est disponible
    if (!SQLite || !SQLite.openDatabaseAsync) {
      throw new Error('Module SQLite non disponible. Un build développement peut être nécessaire.');
    }

    db = await SQLite.openDatabaseAsync('dolibarr_pos.db');

    // Création des tables
    await createTables(db);

    return db;
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation de la base de données:', error);
    // Relance l'erreur pour que l'appelant puisse la gérer
    throw error;
  }
}

/**
 * Crée toutes les tables nécessaires
 */
async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  // Table des produits
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      ref TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      price_ttc REAL,
      price_min REAL,
      price_base_type TEXT DEFAULT 'HT',
      tva_tx REAL DEFAULT 0,
      stock_reel REAL DEFAULT 0,
      stock_available REAL DEFAULT 0,
      barcode TEXT,
      fk_product_type INTEGER,
      tosell INTEGER DEFAULT 1,
      tobuy INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      product_image TEXT,
      category_ids TEXT,
      image_path TEXT,
      synced_at INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des catégories
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT,
      color TEXT,
      fk_parent INTEGER,
      synced_at INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des clients
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY,
      ref TEXT,
      ref_ext TEXT,
      name TEXT NOT NULL,
      name_alias TEXT,
      firstname TEXT,
      lastname TEXT,
      email TEXT,
      phone TEXT,
      phone_mobile TEXT,
      address TEXT,
      zip TEXT,
      town TEXT,
      country TEXT,
      status INTEGER DEFAULT 1,
      client INTEGER DEFAULT 1,
      price_level INTEGER,
      note_public TEXT,
      note_private TEXT,
      last_order_at INTEGER,
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      synced_at INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des ventes en cours (paniers)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'draft',
      client_id INTEGER,
      subtotal REAL DEFAULT 0,
      subtotal_ttc REAL DEFAULT 0,
      total_discount REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      payment_total REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      ticket_number TEXT,
      invoice_ref TEXT,
      invoice_id INTEGER,
      synced INTEGER DEFAULT 0,
      synced_at INTEGER,
      dolibarr_invoice_id INTEGER,
      dolibarr_order_id INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des lignes de vente (produits dans le panier)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_lines (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_ref TEXT NOT NULL,
      product_label TEXT NOT NULL,
      price REAL NOT NULL,
      price_ttc REAL NOT NULL,
      tva_tx REAL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 1,
      discount_amount REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      subtotal_ttc REAL NOT NULL,
      total REAL NOT NULL,
      total_ttc REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des remises
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_discounts (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      type TEXT NOT NULL,
      line_index INTEGER,
      amount REAL NOT NULL,
      percent REAL NOT NULL,
      requires_authorization INTEGER DEFAULT 0,
      authorized_by TEXT,
      reason TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des paiements
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_payments (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      reference TEXT,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des tickets en attente
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_sales (
      id TEXT PRIMARY KEY,
      sale_data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des cartes cadeaux / avoirs
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS giftcards (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      remaining REAL NOT NULL,
      used REAL DEFAULT 0,
      expires_at INTEGER,
      client_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des retours
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      original_sale_id TEXT,
      original_ticket_number TEXT,
      client_id INTEGER,
      total_refund REAL NOT NULL,
      create_credit INTEGER DEFAULT 0,
      credit_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      synced INTEGER DEFAULT 0,
      synced_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des lignes de retour
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS return_lines (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      refund_amount REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Table des tables (restauration)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      label TEXT,
      capacity INTEGER DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'available',
      current_sale_id TEXT,
      area TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Index pour améliorer les performances
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_products_ref ON products(ref);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sales_synced ON sales(synced);
    CREATE INDEX IF NOT EXISTS idx_sale_lines_sale_id ON sale_lines(sale_id);
  `);
}

/**
 * Récupère l'instance de la base de données
 * @returns Instance de la base de données
 * @throws Erreur si la base de données n'est pas disponible
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    try {
      return await initDatabase();
    } catch (error) {
      // Si l'initialisation échoue, retourne une erreur claire
      throw new Error(
        'Base de données non disponible. ' +
        'Certaines fonctionnalités nécessitent un build développement. ' +
        'Erreur: ' + (error instanceof Error ? error.message : 'Inconnue')
      );
    }
  }
  return db;
}

/**
 * Ferme la base de données
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
