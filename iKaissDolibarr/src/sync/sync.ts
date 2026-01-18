/**
 * Service de synchronisation Dolibarr
 * Synchronise les données locales avec Dolibarr quand la connexion est disponible
 * Fonctionne en mode offline : stockage local, synchronisation différée
 */

import { getDatabase } from '../database/database';
import { getProducts as apiGetProducts } from '../api/products';
import { getClients as apiGetClients } from '../api/clients';
import { createInvoice, addPaymentToInvoice } from '../api/orders';
import { LocalProduct, DolibarrProduct } from '../types/product';
import { LocalClient, DolibarrClient } from '../types/client';
import { CompletedSale } from '../types/pos';
import { dolibarrApi } from '../api/dolibarr';
import { getSecureItem } from '../storage/secureStorage';
import { APP_CONFIG } from '../config/app.config';

/**
 * État de synchronisation
 */
export interface SyncStatus {
  syncing: boolean;
  lastSync: number | null;
  pendingItems: number;
  errors: string[];
}

/**
 * Synchronise les produits depuis Dolibarr vers la base locale
 */
export async function syncProducts(): Promise<void> {
  try {
    const db = await getDatabase();
    const products = await apiGetProducts(1000);

    for (const product of products) {
      const categoryIds = product.categories
        ? product.categories.map((c) => c.id).join(',')
        : '';

      await db.runAsync(
        `INSERT OR REPLACE INTO products (
          id, ref, label, description, price, price_ttc, price_min,
          price_base_type, tva_tx, stock_reel, stock_available,
          barcode, fk_product_type, tosell, tobuy, status,
          product_image, category_ids, synced_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.ref,
          product.label,
          product.description || null,
          product.price,
          product.price_ttc || product.price,
          product.price_min || null,
          product.price_base_type || 'HT',
          product.tva_tx || 0,
          product.stock_reel || 0,
          product.stock_available || 0,
          product.barcode || null,
          product.fk_product_type || null,
          product.tosell || 1,
          product.tobuy || 0,
          product.status || 1,
          product.product_image || null,
          categoryIds,
          Date.now(),
          Math.floor(Date.now() / 1000),
        ]
      );
    }

    console.log(`Synchronisation produits terminée: ${products.length} produits`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits:', error);
    throw error;
  }
}

/**
 * Synchronise les clients depuis Dolibarr vers la base locale
 */
export async function syncClients(): Promise<void> {
  try {
    const db = await getDatabase();
    const clients = await apiGetClients(1000);

    for (const client of clients) {
      await db.runAsync(
        `INSERT OR REPLACE INTO clients (
          id, ref, ref_ext, name, name_alias, firstname, lastname,
          email, phone, phone_mobile, address, zip, town, country,
          status, client, price_level, note_public, note_private,
          synced_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id,
          client.ref || null,
          client.ref_ext || null,
          client.name,
          client.name_alias || null,
          client.firstname || null,
          client.lastname || null,
          client.email || null,
          client.phone || null,
          client.phone_mobile || null,
          client.address || null,
          client.zip || null,
          client.town || null,
          client.country || null,
          client.status || 1,
          client.client || 1,
          client.price_level || null,
          client.note_public || null,
          client.note_private || null,
          Date.now(),
          Math.floor(Date.now() / 1000),
        ]
      );
    }

    console.log(`Synchronisation clients terminée: ${clients.length} clients`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des clients:', error);
    throw error;
  }
}

/**
 * Synchronise une vente vers Dolibarr (création facture + paiements)
 */
export async function syncSale(sale: CompletedSale): Promise<void> {
  try {
    // La vérification client et produits se fait dans createInvoice
    // qui utilise le client par défaut si nécessaire
    
    // Création de la facture (gère déjà le client par défaut)
    const invoice = await createInvoice(sale);
    
    if (!invoice.id || invoice.id === 0) {
      console.error('[syncSale] Facture créée sans ID valide:', invoice);
      throw new Error(`Erreur lors de la création de la facture: aucun ID retourné par l'API`);
    }

    // Enregistrement des paiements
    for (const payment of sale.payments) {
      if (payment.status === 'completed' && payment.amount > 0) {
        await addPaymentToInvoice(
          invoice.id,
          payment.amount,
          payment.type
        );
      }
    }

    // Validation de la facture si tous les paiements sont complétés
    if (sale.payment_total >= sale.total_ttc) {
      // Note: La validation de facture peut nécessiter des permissions spéciales
      // On peut l'activer si nécessaire via une option
    }

    // Mise à jour de la vente locale avec les IDs Dolibarr
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sales SET 
        synced = 1, 
        synced_at = ?, 
        dolibarr_invoice_id = ?,
        invoice_ref = ?
      WHERE id = ?`,
      [Date.now(), invoice.id, invoice.ref || null, sale.id]
    );

    console.log(`Vente ${sale.id} synchronisée vers Dolibarr (facture ${invoice.id})`);
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de la vente ${sale.id}:`, error);
    throw error;
  }
}

/**
 * Synchronise toutes les ventes en attente vers Dolibarr
 */
export async function syncPendingSales(): Promise<void> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<CompletedSale>(
      `SELECT * FROM sales WHERE synced = 0 AND status = 'completed'`
    );
    const unsyncedSales = result || [];

    for (const sale of unsyncedSales) {
      try {
        await syncSale(sale as CompletedSale);
      } catch (error) {
        console.error(`Échec de synchronisation pour la vente ${sale.id}:`, error);
        // Continue avec les autres ventes
      }
    }

    console.log(`Synchronisation des ventes terminée: ${unsyncedSales.length} ventes`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des ventes:', error);
    throw error;
  }
}

/**
 * Synchronisation complète (produits, clients, ventes en attente)
 */
export async function fullSync(): Promise<SyncStatus> {
  const status: SyncStatus = {
    syncing: true,
    lastSync: null,
    pendingItems: 0,
    errors: [],
  };

  try {
    // Vérifie la connexion
    const token = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('Non authentifié');
    }

    // Synchronise les produits
    try {
      await syncProducts();
    } catch (error) {
      status.errors.push(`Produits: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    // Synchronise les clients
    try {
      await syncClients();
    } catch (error) {
      status.errors.push(`Clients: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    // Synchronise les ventes en attente
    try {
      await syncPendingSales();
    } catch (error) {
      status.errors.push(`Ventes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    status.lastSync = Date.now();
  } catch (error) {
    status.errors.push(
      `Synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  } finally {
    status.syncing = false;
  }

  return status;
}
