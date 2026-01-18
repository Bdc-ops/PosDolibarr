/**
 * Service API Dolibarr - Commandes
 * Gère toutes les interactions avec l'API REST Dolibarr pour les commandes et factures
 */

import { dolibarrApi } from './dolibarr';
import { CompletedSale } from '../types/pos';

/**
 * Interface pour une ligne de commande Dolibarr
 */
export interface DolibarrOrderLine {
  desc: string;
  qty: number;
  tva_tx: number;
  subprice: number;
  fk_product?: number;
  product_ref?: string;
  product_label?: string;
}

/**
 * Interface pour une commande Dolibarr
 */
export interface DolibarrOrder {
  id?: number;
  ref?: string;
  fk_soc: number;
  date?: string;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  lines?: DolibarrOrderLine[];
}

/**
 * Interface pour une facture Dolibarr
 */
export interface DolibarrInvoice {
  id?: number;
  ref?: string;
  ref_ext?: string;
  fk_soc: number;
  date?: string;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  paye?: number;
  lines?: DolibarrOrderLine[];
}

/**
 * Crée une commande dans Dolibarr à partir d'une vente
 * @param sale - Vente complétée
 * @returns Commande créée dans Dolibarr
 */
export async function createOrder(sale: CompletedSale): Promise<DolibarrOrder> {
  try {
    if (!sale.client_id) {
      throw new Error('Un client est requis pour créer une commande');
    }

    const client = await dolibarrApi.getClient();

    // Préparation des lignes de commande
    const lines: DolibarrOrderLine[] = sale.products.map((product) => ({
      desc: product.label,
      qty: product.quantity,
      tva_tx: product.tva_tx,
      subprice: product.price,
      fk_product: product.id,
      product_ref: product.ref,
      product_label: product.label,
    }));

    const orderData: DolibarrOrder = {
      fk_soc: sale.client_id,
      date: new Date().toISOString().split('T')[0],
      lines,
    };

    const response = await client.post<DolibarrOrder>(
      '/api/index.php/orders',
      orderData
    );

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    throw error;
  }
}

/**
 * Valide une commande (passe en statut validé)
 * @param orderId - ID de la commande
 * @returns Commande validée
 */
export async function validateOrder(orderId: number): Promise<DolibarrOrder> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.put<DolibarrOrder>(
      `/api/index.php/orders/${orderId}/validate`
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la validation de la commande ${orderId}:`, error);
    throw error;
  }
}

/**
 * Crée une facture dans Dolibarr à partir d'une vente
 * @param sale - Vente complétée
 * @returns Facture créée dans Dolibarr
 */
export async function createInvoice(
  sale: CompletedSale
): Promise<DolibarrInvoice> {
  try {
    // Utiliser le client par défaut si aucun client n'est sélectionné
    let clientId = sale.client_id;
    if (!clientId) {
      // Essayer de charger le client par défaut depuis les settings
      try {
        const { loadPOSSettings } = await import('../config/pos.settings');
        const settings = await loadPOSSettings();
        if (settings.defaultClientId) {
          clientId = settings.defaultClientId;
        }
      } catch (e) {
        // Ignorer les erreurs de chargement des settings
      }
    }

    if (!clientId) {
      throw new Error('Un client est requis pour créer une facture. Sélectionnez un client ou configurez un client par défaut.');
    }

    // Vérifier qu'il y a des produits
    if (!sale.products || sale.products.length === 0) {
      throw new Error('Au moins un produit est requis pour créer une facture.');
    }

    const client = await dolibarrApi.getClient();

    // Préparation des lignes de facture selon le format Dolibarr API
    const lines: any[] = sale.products.map((product) => {
      // Format correct pour Dolibarr : les lignes doivent avoir les champs corrects
      const line: any = {
        desc: product.label || product.ref || 'Produit',
        qty: Number(product.quantity) || 1,
        tva_tx: Number(product.tva_tx) || 0,
        subprice: Number(product.price) || 0,
      };
      
      // Ajouter fk_product seulement si disponible
      if (product.id) {
        line.fk_product = Number(product.id);
      }
      
      // Ajouter les refs si disponibles
      if (product.ref) {
        line.product_ref = product.ref;
      }
      if (product.label) {
        line.product_label = product.label;
      }
      
      return line;
    });

    // Préparer les données de facture - Dolibarr attend "socid" et non "fk_soc"
    const invoiceData: any = {
      socid: Number(clientId), // Champ correct pour Dolibarr API
      date: new Date().toISOString().split('T')[0],
      lines: lines, // Lignes directement dans l'objet
    };

    console.log('[createInvoice] Données envoyées:', JSON.stringify(invoiceData, null, 2));

    const response = await client.post<any>(
      '/api/index.php/invoices',
      invoiceData
    );

    console.log('[createInvoice] Réponse brute:', JSON.stringify(response.data, null, 2));

    // Dolibarr peut retourner l'ID de différentes façons
    // Essayons plusieurs formats de réponse
    const invoiceDataReturned: any = response.data || {};
    
    // Format 1: { id: 123, ... }
    // Format 2: { invoice: { id: 123, ... } }
    // Format 3: réponse directe avec id
    let invoiceId: number | undefined = invoiceDataReturned.id || 
                                       invoiceDataReturned.invoice?.id ||
                                       invoiceDataReturned.rowid ||
                                       invoiceDataReturned.fk_facture;
    
    // Si l'ID est une string, convertir en number
    if (invoiceId && typeof invoiceId === 'string') {
      invoiceId = parseInt(invoiceId, 10);
    }

    const invoiceResult: DolibarrInvoice = {
      id: invoiceId,
      ref: invoiceDataReturned.ref || invoiceDataReturned.invoice?.ref || invoiceDataReturned.ref_ext,
      ref_ext: invoiceDataReturned.ref_ext || invoiceDataReturned.invoice?.ref_ext,
      fk_soc: Number(clientId),
      date: invoiceDataReturned.date || invoiceData.date || new Date().toISOString().split('T')[0],
      total_ht: invoiceDataReturned.total_ht || invoiceDataReturned.invoice?.total_ht,
      total_tva: invoiceDataReturned.total_tva || invoiceDataReturned.invoice?.total_tva,
      total_ttc: invoiceDataReturned.total_ttc || invoiceDataReturned.invoice?.total_ttc,
      paye: invoiceDataReturned.paye || invoiceDataReturned.invoice?.paye || 0,
    };

    console.log('[createInvoice] Facture créée avec ID:', invoiceId);
    
    if (!invoiceId) {
      console.warn('[createInvoice] ATTENTION: Aucun ID trouvé dans la réponse, structure:', invoiceDataReturned);
    }

    return invoiceResult;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Erreur inconnue';
    const errorDetails = error?.response?.data ? JSON.stringify(error.response.data, null, 2) : '';
    console.error('Erreur lors de la création de la facture:', errorMessage);
    console.error('Détails:', errorDetails);
    throw new Error(`Impossible de créer la facture: ${errorMessage}`);
  }
}

/**
 * Récupère une facture par son ID avec tous les détails
 * @param invoiceId - ID de la facture
 * @returns Facture avec détails
 */
export async function getInvoiceById(invoiceId: number): Promise<DolibarrInvoice> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrInvoice>(
      `/api/index.php/invoices/${invoiceId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la facture ${invoiceId}:`, error);
    throw error;
  }
}

/**
 * Récupère toutes les factures d'un tiers (client)
 * @param thirdpartyId - ID du tiers
 * @returns Liste des factures
 */
export async function getInvoicesByThirdparty(thirdpartyId: number): Promise<DolibarrInvoice[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrInvoice[]>(
      '/api/index.php/invoices',
      {
        params: {
          limit: 100,
          sortfield: 't.rowid',
          sortorder: 'ASC',
          thirdparty_ids: String(thirdpartyId),
        },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des factures du tiers ${thirdpartyId}:`, error);
    return [];
  }
}

/**
 * Crée un avoir (credit note) à partir d'une facture
 * @param invoiceId - ID de la facture source
 * @param lines - Lignes à retourner (produits à créditer), si vide retourne tout
 * @returns Avoir créé
 */
export async function createCreditNote(
  invoiceId: number,
  lines?: Array<{ id: number; qty: number }>
): Promise<DolibarrInvoice> {
  try {
    const client = await dolibarrApi.getClient();
    
    // Récupérer la facture source pour avoir les informations nécessaires
    const sourceInvoice = await getInvoiceById(invoiceId);
    
    // Préparer les données de l'avoir
    const creditNoteData: any = {
      type: '2', // Type avoir (2) vs facture (0)
      fk_facture_source: invoiceId, // Référence à la facture source
      socid: sourceInvoice.fk_soc,
      date: new Date().toISOString().split('T')[0],
    };
    
    // Si des lignes spécifiques sont fournies, les ajouter
    if (lines && lines.length > 0) {
      // Récupérer les lignes de la facture source
      const sourceLines = sourceInvoice.lines || [];
      const creditLines = lines.map((line) => {
        const sourceLine = sourceLines.find((l: any) => l.id === line.id || l.fk_product === line.id);
        if (sourceLine) {
          return {
            desc: sourceLine.desc || sourceLine.product_label,
            qty: -Math.abs(line.qty), // Quantité négative pour un avoir
            tva_tx: sourceLine.tva_tx || 0,
            subprice: sourceLine.subprice || 0,
            fk_product: sourceLine.fk_product,
            product_ref: sourceLine.product_ref,
            product_label: sourceLine.product_label,
          };
        }
        return null;
      }).filter((l) => l !== null);
      
      if (creditLines.length > 0) {
        creditNoteData.lines = creditLines;
      }
    }
    
    console.log('[createCreditNote] Données avoir:', JSON.stringify(creditNoteData, null, 2));
    
    const response = await client.post<DolibarrInvoice>(
      '/api/index.php/invoices',
      creditNoteData
    );

    console.log('[createCreditNote] Réponse:', JSON.stringify(response.data, null, 2));

    // Parser la réponse comme pour createInvoice
    const invoiceDataReturned: any = response.data || {};
    let creditNoteId: number | undefined = invoiceDataReturned.id || 
                                         invoiceDataReturned.invoice?.id ||
                                         invoiceDataReturned.rowid;
    
    if (creditNoteId && typeof creditNoteId === 'string') {
      creditNoteId = parseInt(creditNoteId, 10);
    }

    const creditNote: DolibarrInvoice = {
      id: creditNoteId,
      ref: invoiceDataReturned.ref || invoiceDataReturned.invoice?.ref,
      ref_ext: invoiceDataReturned.ref_ext || invoiceDataReturned.invoice?.ref_ext,
      fk_soc: sourceInvoice.fk_soc,
      date: invoiceDataReturned.date || creditNoteData.date,
      total_ht: invoiceDataReturned.total_ht || invoiceDataReturned.invoice?.total_ht,
      total_tva: invoiceDataReturned.total_tva || invoiceDataReturned.invoice?.total_tva,
      total_ttc: invoiceDataReturned.total_ttc || invoiceDataReturned.invoice?.total_ttc,
      paye: 0,
    };

    return creditNote;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Erreur inconnue';
    console.error('Erreur lors de la création de l\'avoir:', errorMessage);
    throw new Error(`Impossible de créer l'avoir: ${errorMessage}`);
  }
}

/**
 * Valide une facture (passe en statut validé)
 * @param invoiceId - ID de la facture
 * @returns Facture validée
 */
export async function validateInvoice(
  invoiceId: number
): Promise<DolibarrInvoice> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.put<DolibarrInvoice>(
      `/api/index.php/invoices/${invoiceId}/validate`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de la validation de la facture ${invoiceId}:`,
      error
    );
    throw error;
  }
}

/**
 * Enregistre un paiement sur une facture
 * @param invoiceId - ID de la facture
 * @param amount - Montant du paiement
 * @param paymentType - Type de paiement
 * @returns Paiement enregistré
 */
export async function addPaymentToInvoice(
  invoiceId: number,
  amount: number,
  paymentType: string = 'cash'
): Promise<any> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.post('/api/index.php/invoices/' + invoiceId + '/payments', {
      payment_type: paymentType,
      payment_mode: paymentType,
      amount,
      date: new Date().toISOString().split('T')[0],
    });
    return response.data;
  } catch (error) {
    console.error(
      `Erreur lors de l'enregistrement du paiement pour la facture ${invoiceId}:`,
      error
    );
    throw error;
  }
}
