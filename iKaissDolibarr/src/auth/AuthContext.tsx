import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { dolibarrApi, LoginCredentials } from '../api/dolibarr';
import { getSecureItem, clearAuthData } from '../storage/secureStorage';
import { APP_CONFIG } from '../config/app.config';

/**
 * Interface pour le contexte d'authentification
 */
interface AuthContextType {
  /**
   * État de connexion de l'utilisateur
   */
  isAuthenticated: boolean;

  /**
   * État de chargement lors de la vérification de l'authentification
   */
  isLoading: boolean;

  /**
   * URL du serveur Dolibarr actuel
   */
  serverUrl: string | null;

  /**
   * Login de l'utilisateur actuel
   */
  userLogin: string | null;

  /**
   * Token d'authentification (pour usage interne uniquement)
   */
  token: string | null;

  /**
   * Connecte un utilisateur
   * @param credentials - Identifiants de connexion
   * @throws Erreur si la connexion échoue
   */
  login: (credentials: LoginCredentials) => Promise<void>;

  /**
   * Déconnecte l'utilisateur actuel
   */
  logout: () => Promise<void>;

  /**
   * Vérifie si un token valide est stocké
   * @returns true si un token existe
   */
  checkAuth: () => Promise<boolean>;
}

/**
 * Contexte d'authentification
 * Fournit l'état d'authentification et les méthodes de connexion/déconnexion
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider du contexte d'authentification
 * Gère l'état global de l'authentification et l'initialisation au démarrage
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Vérifie l'authentification au démarrage de l'app
   */
  useEffect(() => {
    console.log('[AuthContext] Démarrage du contexte d\'authentification...');
    console.log('[AuthContext] Vérification de l\'authentification...');
    checkAuth()
      .then((result) => {
        console.log('[AuthContext] Vérification terminée, authentifié:', result);
      })
      .catch((error) => {
        console.error('[AuthContext] Erreur lors de la vérification:', error);
      });
  }, []);

  /**
   * Vérifie si un token valide est stocké et met à jour l'état
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const storedToken = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const storedUrl = await getSecureItem(APP_CONFIG.STORAGE_KEYS.SERVER_URL);
      const storedLogin = await getSecureItem(APP_CONFIG.STORAGE_KEYS.USER_LOGIN);

      if (storedToken && storedUrl && storedLogin) {
        setToken(storedToken);
        setServerUrl(storedUrl);
        setUserLogin(storedLogin);
        setIsAuthenticated(true);

        // Initialise le client API avec l'URL stockée
        await dolibarrApi.getClient().catch(() => {
          // Si l'initialisation échoue, considérer comme non authentifié
          setIsAuthenticated(false);
          return false;
        });

        return true;
      }

      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connecte un utilisateur
   * @param credentials - Identifiants de connexion
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);

      // Valide les champs
      if (!credentials.serverUrl || !credentials.login || !credentials.password) {
        throw new Error(APP_CONFIG.ERROR_MESSAGES.MISSING_FIELDS);
      }

      // Effectue la connexion via l'API
      const newToken = await dolibarrApi.login(credentials);

      // Met à jour l'état
      setToken(newToken);
      setServerUrl(credentials.serverUrl);
      setUserLogin(credentials.login);
      setIsAuthenticated(true);

      // Redirige vers la page principale
      router.replace('/(app)');
    } catch (error) {
      setIsAuthenticated(false);
      setToken(null);
      setServerUrl(null);
      setUserLogin(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déconnecte l'utilisateur actuel
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Réinitialise le client API
      dolibarrApi.reset();

      // Supprime les données stockées
      await clearAuthData();

      // Réinitialise l'état
      setIsAuthenticated(false);
      setToken(null);
      setServerUrl(null);
      setUserLogin(null);

      // Redirige vers la page de connexion
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    serverUrl,
    userLogin,
    token,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour accéder au contexte d'authentification
 * @returns Le contexte d'authentification
 * @throws Erreur si utilisé en dehors d'un AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
