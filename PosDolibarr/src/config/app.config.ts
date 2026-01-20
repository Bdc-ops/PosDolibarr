/**
 * Configuration globale de l'application
 * Centralise les constantes et paramètres réutilisables
 */

export const APP_CONFIG = {
  /**
   * Clés de stockage pour expo-secure-store
   */
  STORAGE_KEYS: {
    AUTH_TOKEN: 'dolibarr_auth_token',
    SERVER_URL: 'dolibarr_server_url',
    USER_LOGIN: 'dolibarr_user_login',
    LANGUAGE: 'app_language',
  },

  /**
   * Configuration API Dolibarr
   */
  API: {
    LOGIN_ENDPOINT: '/api/index.php/login',
    PRODUCTS_ENDPOINT: '/api/index.php/products',
    CLIENTS_ENDPOINT: '/api/index.php/thirdparties',
    ORDERS_ENDPOINT: '/api/index.php/orders',
    INVOICES_ENDPOINT: '/api/index.php/invoices',
    PAYMENTS_ENDPOINT: '/api/index.php/payments',
    CATEGORIES_ENDPOINT: '/api/index.php/categories',
    DEFAULT_TIMEOUT: 30000, // 30 secondes
  },

  /**
   * Messages d'erreur standardisés
   */
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Identifiants incorrects',
    NETWORK_ERROR: 'Erreur de connexion au serveur',
    SERVER_ERROR: 'Erreur serveur. Veuillez réessayer.',
    INVALID_URL: "L'URL du serveur est invalide",
    MISSING_FIELDS: 'Veuillez remplir tous les champs',
  },

  /**
   * Messages de succès
   */
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGOUT_SUCCESS: 'Déconnexion réussie',
  },
} as const;

/**
 * Type pour les clés de stockage
 */
export type StorageKey = typeof APP_CONFIG.STORAGE_KEYS[keyof typeof APP_CONFIG.STORAGE_KEYS];
