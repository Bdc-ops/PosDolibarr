/**
 * Service API Dolibarr - Clients
 * Gère toutes les interactions avec l'API REST Dolibarr pour les clients (tiers)
 */

import { dolibarrApi } from './dolibarr';
import { DolibarrClient } from '../types/client';

/**
 * Récupère la liste des clients depuis Dolibarr
 * @param limit - Nombre maximum de résultats
 * @param offset - Décalage pour la pagination
 * @param sortfield - Champ de tri
 * @param sortorder - Ordre de tri (ASC/DESC)
 * @returns Liste des clients
 */
export async function getClients(
  limit: number = 100,
  offset: number = 0,
  sortfield: string = 't.nom',
  sortorder: string = 'ASC'
): Promise<DolibarrClient[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrClient[]>(
      '/api/index.php/thirdparties',
      {
        params: {
          limit,
          sortfield,
          sortorder,
          offset,
          sqlfilters: '(t.client=1)',
        },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    throw error;
  }
}

/**
 * Récupère un client par son ID
 * @param id - ID du client
 * @returns Client
 */
export async function getClientById(id: number): Promise<DolibarrClient> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrClient>(
      `/api/index.php/thirdparties/${id}`
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du client ${id}:`, error);
    throw error;
  }
}

/**
 * Recherche des clients par terme
 * @param term - Terme de recherche (nom, prénom, email, téléphone)
 * @returns Liste des clients correspondants
 */
export async function searchClients(term: string): Promise<DolibarrClient[]> {
  try {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || trimmedTerm.length < 2) {
      return [];
    }

    const client = await dolibarrApi.getClient();
    
    // Récupérer TOUS les tiers sans filtre SQL (plus sûr)
    // Filtrer côté client ensuite
    const response = await client.get<DolibarrClient[]>(
      '/api/index.php/thirdparties',
      {
        params: {
          limit: 500, // Augmenter pour avoir plus de résultats
          sortfield: 't.nom',
          sortorder: 'ASC',
          // NE PAS utiliser sqlfilters pour éviter les erreurs 400
        },
      }
    );

    // Filtrer côté client pour la recherche (plus sûr et compatible avec les accents)
    // Normaliser le terme de recherche (enlever les accents pour la comparaison si nécessaire)
    const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedTerm = normalize(trimmedTerm);
    
    const allTiers = (response?.data || []) as DolibarrClient[];
    
    // Filtrer d'abord les clients (client=1), puis la recherche
    const clientsOnly = allTiers.filter((c) => {
      // Vérifier si c'est un client (propriété client peut être 1, true, "1", etc.)
      if (c.client === undefined || c.client === null) return false;
      return c.client === 1 || c.client === true || String(c.client) === '1';
    });
    
    // Ensuite filtrer par terme de recherche
    const filtered = clientsOnly.filter((c) => {
      const fields = [
        c.name || '',
        c.firstname || '',
        c.lastname || '',
        c.email || '',
        c.phone || '',
        c.phone_mobile || '',
        c.ref || '',
        c.ref_ext || '',
      ];
      
      // Vérifier si le terme normalisé correspond à un champ normalisé
      return fields.some((field) => normalize(field).includes(normalizedTerm));
    });

    return filtered.slice(0, 50); // Limiter à 50 résultats
  } catch (error: any) {
    console.error('Erreur lors de la recherche de clients:', error?.response?.data || error?.message || error);
    // Retourner un tableau vide au lieu de lancer l'erreur pour éviter de casser l'UI
    return [];
  }
}

/**
 * Crée un nouveau client dans Dolibarr
 * @param clientData - Données du client à créer
 * @returns Client créé avec son ID
 */
export async function createClient(
  clientData: Partial<DolibarrClient>
): Promise<DolibarrClient> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.post<DolibarrClient>(
      '/api/index.php/thirdparties',
      {
        ...clientData,
        client: 1, // Force le type client
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    throw error;
  }
}

/**
 * Met à jour un client dans Dolibarr
 * @param id - ID du client
 * @param clientData - Données à mettre à jour
 * @returns Client mis à jour
 */
export async function updateClient(
  id: number,
  clientData: Partial<DolibarrClient>
): Promise<DolibarrClient> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.put<DolibarrClient>(
      `/api/index.php/thirdparties/${id}`,
      clientData
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
    throw error;
  }
}

/**
 * Interface pour un contact Dolibarr
 */
export interface DolibarrContact {
  id: number;
  ref?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  email?: string;
  mail?: string;
  phone_pro?: string;
  phone_perso?: string;
  phone_mobile?: string;
  fax?: string;
  poste?: string;
  address?: string;
  zip?: string;
  town?: string;
  socid?: string;
  fk_soc?: string;
  socname?: string;
  civility?: string;
  civility_code?: string;
  photo?: string;
  birthday?: string;
  roles?: any[];
  statut_commercial?: string;
}

/**
 * Récupère les contacts associés à un tiers (thirdparty)
 * @param thirdpartyId - ID du tiers
 * @returns Liste des contacts
 */
export async function getContactsByThirdparty(thirdpartyId: number): Promise<DolibarrContact[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrContact[]>(
      '/api/index.php/contacts',
      {
        params: {
          limit: 100,
          sortfield: 't.rowid',
          sortorder: 'ASC',
          thirdparty_ids: String(thirdpartyId),
          includeroles: 1,
        },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des contacts du tiers ${thirdpartyId}:`, error);
    return [];
  }
}

/**
 * Récupère les comptes bancaires d'un tiers
 * @param thirdpartyId - ID du tiers
 * @returns Liste des comptes bancaires
 */
export async function getBankAccountsByThirdparty(thirdpartyId: number): Promise<any[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get(
      `/api/index.php/thirdparties/${thirdpartyId}/bankaccounts`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des comptes bancaires du tiers ${thirdpartyId}:`, error);
    return [];
  }
}

/**
 * Récupère les factures en attente d'un tiers
 * @param thirdpartyId - ID du tiers
 * @returns Liste des factures en attente
 */
export async function getOutstandingInvoices(thirdpartyId: number): Promise<any[]> {
  try {
    const client = await dolibarrApi.getClient();
    const response = await client.get(
      `/api/index.php/thirdparties/${thirdpartyId}/outstandinginvoices`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des factures en attente du tiers ${thirdpartyId}:`, error);
    return [];
  }
}
