import { dolibarrAPI } from './api';
import { getDatabase, addLog } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
}

class SyncService {
  private isSyncing = false;

  async isOnline(): Promise<boolean> {
    try {
      // Tentative de connexion simple pour vérifier la connectivité
      await axios.get('https://www.google.com', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log('Synchronisation déjà en cours...');
      return;
    }

    const online = await this.isOnline();
    if (!online) {
      await addLog('INFO', 'Pas de connexion internet, synchronisation reportée');
      return;
    }

    this.isSyncing = true;
    await addLog('INFO', 'Début de la synchronisation');

    try {
      await this.syncClients();
      await this.syncInvoices();
      await this.syncOrders();
      await this.syncQuotes();
      await this.syncCommercials();
      await this.syncPendingChanges();

      await AsyncStorage.setItem('lastSync', new Date().toISOString());
      await addLog('SUCCESS', 'Synchronisation terminée avec succès');
    } catch (error: any) {
      await addLog('ERROR', 'Erreur lors de la synchronisation', error.message);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncClients() {
    const db = getDatabase();
    try {
      const clients = await dolibarrAPI.getClients('t.rowid', 'ASC', 1000);
      
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM clients WHERE synced = 1;');
          
          if (Array.isArray(clients)) {
            clients.forEach((client: any) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO clients 
                (id, ref, name, firstname, address, zip, town, country, phone, email, 
                 commercial_id, commercial_name, sector, status, last_modified, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
                [
                  client.id,
                  client.ref,
                  client.name,
                  client.firstname || '',
                  client.address || '',
                  client.zip || '',
                  client.town || '',
                  client.country || '',
                  client.phone || '',
                  client.email || '',
                  client.commercial_id || null,
                  client.commercial_name || '',
                  client.sector || '',
                  client.status || 1,
                  client.tms || new Date().toISOString(),
                ]
              );
            });
          }
        }, (error) => {
          console.error('Erreur sync clients:', error);
          reject(error);
        }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des clients:', error);
      throw error;
    }
  }

  private async syncInvoices() {
    const db = getDatabase();
    try {
      const invoices = await dolibarrAPI.getInvoices('t.date_creation', 'DESC', 1000);
      
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM invoices WHERE synced = 1;');
          
          if (Array.isArray(invoices)) {
            invoices.forEach((invoice: any) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO invoices 
                (id, ref, ref_client, client_name, date_creation, date_lim_reglement, 
                 total_ht, total_ttc, status, commercial_id, commercial_name, last_modified, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
                [
                  invoice.id,
                  invoice.ref,
                  invoice.ref_client || '',
                  invoice.client_name || '',
                  invoice.date_creation || invoice.date,
                  invoice.date_lim_reglement || '',
                  invoice.total_ht || 0,
                  invoice.total_ttc || 0,
                  invoice.status || '',
                  invoice.commercial_id || null,
                  invoice.commercial_name || '',
                  invoice.tms || new Date().toISOString(),
                ]
              );
            });
          }
        }, (error) => {
          console.error('Erreur sync factures:', error);
          reject(error);
        }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des factures:', error);
      throw error;
    }
  }

  private async syncOrders() {
    const db = getDatabase();
    try {
      const orders = await dolibarrAPI.getOrders('t.date_creation', 'DESC', 1000);
      
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM orders WHERE synced = 1;');
          
          if (Array.isArray(orders)) {
            orders.forEach((order: any) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO orders 
                (id, ref, ref_client, client_name, date_creation, date_livraison, 
                 total_ht, total_ttc, status, commercial_id, commercial_name, last_modified, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
                [
                  order.id,
                  order.ref,
                  order.ref_client || '',
                  order.client_name || '',
                  order.date_creation || order.date,
                  order.date_livraison || '',
                  order.total_ht || 0,
                  order.total_ttc || 0,
                  order.status || '',
                  order.commercial_id || null,
                  order.commercial_name || '',
                  order.tms || new Date().toISOString(),
                ]
              );
            });
          }
        }, (error) => {
          console.error('Erreur sync commandes:', error);
          reject(error);
        }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des commandes:', error);
      throw error;
    }
  }

  private async syncQuotes() {
    const db = getDatabase();
    try {
      const quotes = await dolibarrAPI.getQuotes('t.date_creation', 'DESC', 1000);
      
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM quotes WHERE synced = 1;');
          
          if (Array.isArray(quotes)) {
            quotes.forEach((quote: any) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO quotes 
                (id, ref, ref_client, client_name, date_creation, date_validite, 
                 total_ht, total_ttc, status, commercial_id, commercial_name, last_modified, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
                [
                  quote.id,
                  quote.ref,
                  quote.ref_client || '',
                  quote.client_name || '',
                  quote.date_creation || quote.date,
                  quote.date_validite || '',
                  quote.total_ht || 0,
                  quote.total_ttc || 0,
                  quote.status || '',
                  quote.commercial_id || null,
                  quote.commercial_name || '',
                  quote.tms || new Date().toISOString(),
                ]
              );
            });
          }
        }, (error) => {
          console.error('Erreur sync devis:', error);
          reject(error);
        }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des devis:', error);
      throw error;
    }
  }

  private async syncCommercials() {
    const db = getDatabase();
    try {
      const commercials = await dolibarrAPI.getCommercials();
      
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM commercials WHERE synced = 1;');
          
          if (Array.isArray(commercials)) {
            commercials.forEach((commercial: any) => {
              tx.executeSql(
                `INSERT OR REPLACE INTO commercials 
                (id, login, name, firstname, email, synced, last_modified)
                VALUES (?, ?, ?, ?, ?, 1, ?);`,
                [
                  commercial.id,
                  commercial.login || '',
                  commercial.lastname || '',
                  commercial.firstname || '',
                  commercial.email || '',
                  commercial.tms || new Date().toISOString(),
                ]
              );
            });
          }
        }, (error) => {
          console.error('Erreur sync commerciaux:', error);
          reject(error);
        }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des commerciaux:', error);
      throw error;
    }
  }

  private async syncPendingChanges() {
    const db = getDatabase();
    const online = await this.isOnline();
    if (!online) return;

    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM pending_sync ORDER BY created_at ASC;',
          [],
          async (_, { rows }) => {
            const pending: any[] = [];
            for (let i = 0; i < rows.length; i++) {
              pending.push(rows.item(i));
            }

            for (const item of pending) {
              try {
                const data = JSON.parse(item.data);
                
                switch (item.action) {
                  case 'CREATE_CLIENT':
                    await dolibarrAPI.createClient(data);
                    break;
                  case 'UPDATE_CLIENT':
                    await dolibarrAPI.updateClient(item.record_id, data);
                    break;
                  case 'CREATE_QUOTE':
                    await dolibarrAPI.createQuote(data);
                    break;
                }

                // Supprimer l'élément après synchronisation réussie
                tx.executeSql('DELETE FROM pending_sync WHERE id = ?;', [item.id]);
              } catch (error) {
                console.error(`Erreur sync pending ${item.id}:`, error);
              }
            }
            resolve();
          },
          (_, error) => {
            console.error('Erreur récupération pending:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async addPendingChange(tableName: string, recordId: number, action: string, data: any) {
    const db = getDatabase();
    const online = await this.isOnline();

    if (online) {
      // Essayer de synchroniser immédiatement
      try {
        switch (action) {
          case 'CREATE_CLIENT':
            await dolibarrAPI.createClient(data);
            return;
          case 'UPDATE_CLIENT':
            await dolibarrAPI.updateClient(recordId, data);
            return;
          case 'CREATE_QUOTE':
            await dolibarrAPI.createQuote(data);
            return;
        }
      } catch (error) {
        // Si échec, ajouter à la file d'attente
        console.log('Synchronisation immédiate échouée, ajout à la file d\'attente');
      }
    }

    // Ajouter à la file d'attente
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO pending_sync (table_name, record_id, action, data) VALUES (?, ?, ?, ?);',
          [tableName, recordId, action, JSON.stringify(data)],
          () => resolve(),
          (_, error) => {
            console.error('Erreur ajout pending:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }
}

export const syncService = new SyncService();
