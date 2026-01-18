import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const dbName = 'dolibarr_crm.db';

export const getDatabase = () => {
  if (Platform.OS === 'web') {
    return {
      transaction: (callback: any) => {
        console.warn('SQLite not supported on web');
      },
    };
  }
  return SQLite.openDatabase(dbName);
};

export const initDatabase = () => {
  const db = getDatabase();
  
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      // Table des utilisateurs
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          login TEXT UNIQUE NOT NULL,
          api_key TEXT,
          server_url TEXT,
          last_sync TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des clients
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY,
          ref TEXT,
          name TEXT NOT NULL,
          firstname TEXT,
          address TEXT,
          zip TEXT,
          town TEXT,
          country TEXT,
          phone TEXT,
          email TEXT,
          commercial_id INTEGER,
          commercial_name TEXT,
          sector TEXT,
          latitude REAL,
          longitude REAL,
          status INTEGER DEFAULT 1,
          last_modified TEXT,
          synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des factures
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY,
          ref TEXT NOT NULL,
          ref_client TEXT,
          client_name TEXT,
          date_creation TEXT,
          date_lim_reglement TEXT,
          total_ht REAL,
          total_ttc REAL,
          status TEXT,
          commercial_id INTEGER,
          commercial_name TEXT,
          synced INTEGER DEFAULT 0,
          last_modified TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des commandes
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY,
          ref TEXT NOT NULL,
          ref_client TEXT,
          client_name TEXT,
          date_creation TEXT,
          date_livraison TEXT,
          total_ht REAL,
          total_ttc REAL,
          status TEXT,
          commercial_id INTEGER,
          commercial_name TEXT,
          synced INTEGER DEFAULT 0,
          last_modified TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des devis
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS quotes (
          id INTEGER PRIMARY KEY,
          ref TEXT NOT NULL,
          ref_client TEXT,
          client_name TEXT,
          date_creation TEXT,
          date_validite TEXT,
          total_ht REAL,
          total_ttc REAL,
          status TEXT,
          commercial_id INTEGER,
          commercial_name TEXT,
          synced INTEGER DEFAULT 0,
          last_modified TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des commerciaux
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS commercials (
          id INTEGER PRIMARY KEY,
          login TEXT,
          name TEXT,
          firstname TEXT,
          email TEXT,
          synced INTEGER DEFAULT 0,
          last_modified TEXT
        );`
      );

      // Table des logs
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          details TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Table des modifications en attente de synchronisation
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pending_sync (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Index pour améliorer les performances
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_clients_commercial ON clients(commercial_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_clients_sector ON clients(sector);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_invoices_commercial ON invoices(commercial_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_orders_commercial ON orders(commercial_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_quotes_commercial ON quotes(commercial_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_pending_sync_table ON pending_sync(table_name, record_id);');
    }, (error) => {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      reject(error);
    }, () => {
      console.log('Base de données initialisée avec succès');
      resolve();
    });
  });
};

export const addLog = (type: string, message: string, details?: string) => {
  const db = getDatabase();
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO logs (type, message, details) VALUES (?, ?, ?);',
        [type, message, details || ''],
        () => resolve(),
        (_, error) => {
          console.error('Erreur lors de l\'ajout du log:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getLogs = (limit: number = 100) => {
  const db = getDatabase();
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM logs ORDER BY created_at DESC LIMIT ?;',
        [limit],
        (_, { rows }) => {
          const logs: any[] = [];
          for (let i = 0; i < rows.length; i++) {
            logs.push(rows.item(i));
          }
          resolve(logs);
        },
        (_, error) => {
          console.error('Erreur lors de la récupération des logs:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const clearLogs = () => {
  const db = getDatabase();
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM logs;',
        [],
        () => resolve(),
        (_, error) => {
          console.error('Erreur lors de la suppression des logs:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};
