import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../config/app.config';
import { getSecureItem, setSecureItem } from '../storage/secureStorage';

/**
 * Interface pour les réponses de l'API Dolibarr
 */
export interface DolibarrLoginResponse {
  success?: {
    token: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Interface pour les paramètres de connexion
 */
export interface LoginCredentials {
  serverUrl: string;
  login: string;
  password: string;
}

/**
 * Client API Dolibarr centralisé
 * Gère toutes les interactions avec l'API REST Dolibarr
 * Inclut la gestion automatique du token d'authentification
 */
class DolibarrApiClient {
  private client: AxiosInstance | null = null;
  private currentServerUrl: string | null = null;

  /**
   * Normalise l'URL serveur (l'utilisateur peut coller une URL TakePOS ou API)
   * Exemples acceptés:
   * - https://host/ (OK)
   * - https://host/takepos/index.php?... -> https://host
   * - https://host/api/index.php/...     -> https://host
   */
  private normalizeServerUrl(input: string): { normalized: string; rule: string } {
    const raw = input.trim();
    try {
      const u = new URL(raw);
      const path = u.pathname || '/';
      const lower = path.toLowerCase();

      // If user pasted a TakePOS URL, cut everything from /takepos
      const takeposIdx = lower.indexOf('/takepos');
      if (takeposIdx >= 0) {
        const basePath = path.slice(0, takeposIdx) || '/';
        const normalized = `${u.origin}${basePath}`.replace(/\/$/, '');
        return { normalized, rule: 'strip:/takepos' };
      }

      // If user pasted an API URL, cut everything from /api
      const apiIdx = lower.indexOf('/api/');
      if (apiIdx >= 0) {
        const basePath = path.slice(0, apiIdx) || '/';
        const normalized = `${u.origin}${basePath}`.replace(/\/$/, '');
        return { normalized, rule: 'strip:/api' };
      }

      // Default: origin + pathname (for subdir installs), without trailing slash
      const normalized = `${u.origin}${path}`.replace(/\/$/, '');
      return { normalized, rule: 'keep:origin+path' };
    } catch {
      // Fallback: trim trailing slash
      return { normalized: raw.replace(/\/$/, ''), rule: 'fallback:trim' };
    }
  }

  /**
   * Initialise le client API avec l'URL du serveur
   * @param serverUrl - URL du serveur Dolibarr (ex: https://demo.dolibarr.fr)
   */
  private initializeClient(serverUrl: string): void {
    const { normalized, rule } = this.normalizeServerUrl(serverUrl);

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/dolibarr.ts:63',message:'initializeClient normalizeServerUrl',data:{rule,hasChanged:normalized.trim()!==serverUrl.trim(),normalized},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    this.currentServerUrl = normalized;
    this.client = axios.create({
      baseURL: normalized,
      timeout: APP_CONFIG.API.DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter automatiquement le token d'authentification
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token && config.headers) {
          // Dolibarr REST API: DOLAPIKEY is the standard header for API key
          (config.headers as any).DOLAPIKEY = token;
          // Some deployments also accept Bearer; keep it for compatibility
          config.headers.Authorization = `Bearer ${token}`;

          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/dolibarr.ts:102',message:'request interceptor auth headers set',data:{method:config.method||null,url:config.url||null,hasToken:true,hasDOLAPIKEY:true,hasAuthorization:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/dolibarr.ts:111',message:'request interceptor no token',data:{method:config.method||null,url:config.url||null,hasToken:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs globales
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          console.warn('Token d\'authentification invalide ou expiré');
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api/dolibarr.ts:128',message:'response 401',data:{url:(error.config as any)?.url||null,baseURL:(error.config as any)?.baseURL||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentifie un utilisateur via l'API Dolibarr
   * @param credentials - Identifiants de connexion
   * @returns Le token d'authentification
   * @throws Erreur si l'authentification échoue
   */
  async login(credentials: LoginCredentials): Promise<string> {
    try {
      // Valide l'URL du serveur
      if (!this.isValidUrl(credentials.serverUrl)) {
        throw new Error(APP_CONFIG.ERROR_MESSAGES.INVALID_URL);
      }

      // Initialise le client avec la nouvelle URL
      this.initializeClient(credentials.serverUrl);

      if (!this.client) {
        throw new Error('Erreur lors de l\'initialisation du client API');
      }

      // Effectue la requête de login
      const response = await this.client.post<DolibarrLoginResponse>(
        APP_CONFIG.API.LOGIN_ENDPOINT,
        {
          login: credentials.login,
          password: credentials.password,
        }
      );

      // Vérifie la réponse
      if (response.data.error) {
        throw new Error(
          response.data.error.message || APP_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS
        );
      }

      if (!response.data.success?.token) {
        throw new Error(APP_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const token = response.data.success.token;

      // Stocke les informations de manière sécurisée
      await Promise.all([
        setSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token),
        setSecureItem(APP_CONFIG.STORAGE_KEYS.SERVER_URL, credentials.serverUrl),
        setSecureItem(APP_CONFIG.STORAGE_KEYS.USER_LOGIN, credentials.login),
      ]);

      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          throw new Error(APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error(APP_CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        if (error.response?.status && error.response.status >= 500) {
          throw new Error(APP_CONFIG.ERROR_MESSAGES.SERVER_ERROR);
        }
      }

      // Si l'erreur est déjà une instance d'Error avec un message personnalisé, la propager
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * Vérifie si une URL est valide
   * @param url - URL à valider
   * @returns true si l'URL est valide
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Récupère le client API initialisé
   * Initialise le client si nécessaire avec l'URL stockée
   * @returns Instance Axios configurée
   * @throws Erreur si le client n'est pas initialisé et aucune URL n'est stockée
   */
  async getClient(): Promise<AxiosInstance> {
    if (this.client && this.currentServerUrl) {
      // Vérifier que le token est toujours valide
      const token = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        // Token manquant, réinitialiser
        this.client = null as any;
        this.currentServerUrl = null;
        throw new Error('Client API non initialisé. Veuillez vous connecter.');
      }
      return this.client;
    }

    // Essaie de récupérer l'URL stockée
    const storedUrl = await getSecureItem(APP_CONFIG.STORAGE_KEYS.SERVER_URL);
    const storedToken = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    if (storedUrl && storedToken) {
      this.initializeClient(storedUrl);
      if (this.client) {
        return this.client;
      }
    }

    throw new Error('Client API non initialisé. Veuillez vous connecter.');
  }

  /**
   * Réinitialise le client API
   * Utilisé lors de la déconnexion ou du changement de serveur
   */
  reset(): void {
    this.client = null;
    this.currentServerUrl = null;
  }
}

// Export d'une instance singleton
export const dolibarrApi = new DolibarrApiClient();
