import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { dolibarrAPI } from './api';
import { getDatabase, addLog } from '../database/database';

export interface User {
  login: string;
  apiKey: string;
  serverUrl: string;
  id?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  photo?: string;
  lastLogin?: string;
}

class AuthService {
  private currentUser: User | null = null;

  async login(serverUrl: string, login: string, password: string): Promise<User> {
    try {
      await addLog('INFO', 'Tentative de connexion', `Utilisateur: ${login}`);
      
      // Authentification avec Dolibarr
      const apiKey = await dolibarrAPI.authenticate(serverUrl, login, password);
      
      const baseUser: User = {
        login,
        apiKey,
        serverUrl: serverUrl.replace(/\/$/, ''), // Retirer le slash final
        lastLogin: new Date().toISOString(),
      };

      // Initialiser l'API avec les credentials
      await dolibarrAPI.initialize(baseUser);

      // Récupérer les informations complètes de l'utilisateur depuis Dolibarr
      let userInfo: any = {};
      try {
        // Essayer de récupérer les infos utilisateur via l'API
        const userData = await dolibarrAPI.getCurrentUser();
        if (userData) {
          userInfo = {
            id: userData.id,
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email,
            phone: userData.phone,
            photo: userData.photo,
          };
        }
      } catch (error) {
        console.log('Impossible de récupérer les infos utilisateur:', error);
        // Continuer même si on ne peut pas récupérer les infos
      }

      const user: User = {
        ...baseUser,
        ...userInfo,
      };

      // Sauvegarder les credentials de manière sécurisée
      await SecureStore.setItemAsync('apiKey', apiKey);
      await AsyncStorage.setItem('login', login);
      await AsyncStorage.setItem('serverUrl', user.serverUrl);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

      // Sauvegarder dans la base de données locale
      const db = getDatabase();
      await new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO users (login, api_key, server_url, last_sync)
             VALUES (?, ?, ?, ?);`,
            [login, apiKey, user.serverUrl, new Date().toISOString()],
            () => resolve(),
            (_, error) => {
              console.error('Erreur sauvegarde user:', error);
              reject(error);
              return false;
            }
          );
        });
      });

      this.currentUser = user;
      await addLog('SUCCESS', 'Connexion réussie', `Utilisateur: ${login} - ${user.firstname || ''} ${user.lastname || ''}`);
      
      return user;
    } catch (error: any) {
      await addLog('ERROR', 'Échec de la connexion', error.message);
      throw new Error('Identifiants incorrects ou serveur inaccessible');
    }
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('apiKey');
    await AsyncStorage.removeItem('login');
    await AsyncStorage.removeItem('serverUrl');
    await AsyncStorage.removeItem('userInfo');
    this.currentUser = null;
    await addLog('INFO', 'Déconnexion', 'Utilisateur déconnecté');
  }

  async getStoredUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const login = await AsyncStorage.getItem('login');
      const serverUrl = await AsyncStorage.getItem('serverUrl');
      const apiKey = await SecureStore.getItemAsync('apiKey');
      const userInfoStr = await AsyncStorage.getItem('userInfo');

      if (login && serverUrl && apiKey) {
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};
        const user: User = {
          login,
          apiKey,
          serverUrl,
          ...userInfo,
        };
        
        await dolibarrAPI.initialize(user);
        this.currentUser = user;
        return user;
      }
    } catch (error) {
      console.error('Erreur récupération user stocké:', error);
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getStoredUser();
    return user !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
