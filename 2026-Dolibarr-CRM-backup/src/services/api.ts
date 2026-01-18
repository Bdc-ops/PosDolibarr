import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addLog } from '../database/database';

const API_TIMEOUT = 30000;

export interface DolibarrConfig {
  serverUrl: string;
  apiKey: string;
}

class DolibarrAPI {
  private client: AxiosInstance | null = null;
  private config: DolibarrConfig | null = null;

  async initialize(config: DolibarrConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.serverUrl}/api/index.php`,
      timeout: API_TIMEOUT,
      headers: {
        'DOLAPIKEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour logger les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        await addLog('ERROR', 'Erreur API', JSON.stringify(error.response?.data || error.message));
        return Promise.reject(error);
      }
    );
  }

  async authenticate(serverUrl: string, login: string, password: string): Promise<string> {
    try {
      const response = await axios.post(
        `${serverUrl}/api/index.php/login`,
        {
          login,
          password,
        },
        { timeout: API_TIMEOUT }
      );

      if (response.data && response.data.success && response.data.token) {
        return response.data.token;
      }
      throw new Error('Authentification échouée');
    } catch (error: any) {
      await addLog('ERROR', 'Erreur authentification', error.message);
      throw error;
    }
  }

  // Clients
  async getClients(sortfield: string = 't.rowid', sortorder: string = 'ASC', limit: number = 100) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get('/thirdparties', {
      params: { sortfield, sortorder, limit },
    });
    return response.data;
  }

  async getClient(id: number) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get(`/thirdparties/${id}`);
    return response.data;
  }

  async createClient(clientData: any) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.post('/thirdparties', clientData);
    return response.data;
  }

  async updateClient(id: number, clientData: any) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.put(`/thirdparties/${id}`, clientData);
    return response.data;
  }

  // Factures
  async getInvoices(sortfield: string = 't.date_creation', sortorder: string = 'DESC', limit: number = 100) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get('/invoices', {
      params: { sortfield, sortorder, limit },
    });
    return response.data;
  }

  async getInvoice(id: number) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get(`/invoices/${id}`);
    return response.data;
  }

  // Commandes
  async getOrders(sortfield: string = 't.date_creation', sortorder: string = 'DESC', limit: number = 100) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get('/orders', {
      params: { sortfield, sortorder, limit },
    });
    return response.data;
  }

  async getOrder(id: number) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  // Devis
  async getQuotes(sortfield: string = 't.date_creation', sortorder: string = 'DESC', limit: number = 100) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get('/proposals', {
      params: { sortfield, sortorder, limit },
    });
    return response.data;
  }

  async getQuote(id: number) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get(`/proposals/${id}`);
    return response.data;
  }

  async createQuote(quoteData: any) {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.post('/proposals', quoteData);
    return response.data;
  }

  // Commerciaux
  async getCommercials() {
    if (!this.client) throw new Error('API non initialisée');
    const response = await this.client.get('/users', {
      params: { sqlfilters: "(t.fk_user=0 OR t.fk_user IS NULL) AND t.statut=1" },
    });
    return response.data;
  }

  // Récupérer les informations de l'utilisateur actuel
  async getCurrentUser() {
    if (!this.client) throw new Error('API non initialisée');
    try {
      // Essayer de récupérer l'utilisateur via l'endpoint users avec le login
      // Note: Cette méthode dépend de votre configuration Dolibarr
      const response = await this.client.get('/users', {
        params: { limit: 1 },
      });
      
      // Si l'API retourne les infos de l'utilisateur connecté
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      
      // Sinon, retourner un objet vide (les infos seront récupérées autrement)
      return null;
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  // Statistiques CA
  async getSalesStats(period: string = 'month') {
    if (!this.client) throw new Error('API non initialisée');
    // Récupérer les factures et calculer le CA
    const invoices = await this.getInvoices('t.date_creation', 'DESC', 1000);
    let total = 0;
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'day':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    if (Array.isArray(invoices)) {
      invoices.forEach((invoice: any) => {
        const invoiceDate = new Date(invoice.date_creation || invoice.date);
        if (invoiceDate >= periodStart && invoice.total_ttc) {
          total += parseFloat(invoice.total_ttc);
        }
      });
    }

    return { total, period };
  }
}

export const dolibarrAPI = new DolibarrAPI();
