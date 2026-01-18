/**
 * Service de gestion des logs
 * Permet de stocker, visualiser et envoyer les logs par email
 */

import { Linking, Alert } from 'react-native';
import { APP_CONFIG } from '../config/app.config';

// Memory storage fallback
const memoryStorage: any = {
  _storage: {} as Record<string, string>,
  async getItem(key: string) { 
    return this._storage[key] || null; 
  },
  async setItem(key: string, value: string) { 
    this._storage[key] = value; 
  },
  async removeItem(key: string) {
    delete this._storage[key];
  },
};

// Get AsyncStorage with fallback - lazy loading to avoid initialization errors
let asyncStorageInstance: any = null;

function getAsyncStorage() {
  if (asyncStorageInstance) return asyncStorageInstance;
  
  // Always return memory storage for now to avoid native module initialization issues
  // AsyncStorage will be available once the native module is properly initialized
  // In the meantime, memory storage works fine for logs
  console.warn('AsyncStorage not yet initialized, using memory storage for logs');
  asyncStorageInstance = memoryStorage;
  return memoryStorage;
  
  /* 
  // TODO: Re-enable AsyncStorage once native module is properly initialized
  try {
    // Try to require AsyncStorage, but catch if native module is not available
    let AsyncStorageModule: any;
    try {
      AsyncStorageModule = require('@react-native-async-storage/async-storage');
      
      // Check if the module itself is null (native module not initialized)
      if (!AsyncStorageModule) {
        throw new Error('AsyncStorage module is null');
      }
    } catch (requireError: any) {
      // If require fails or module is null, use memory storage
      console.warn('AsyncStorage module not available, using memory storage:', requireError?.message || requireError);
      asyncStorageInstance = memoryStorage;
      return memoryStorage;
    }
    
    const AsyncStorage = AsyncStorageModule?.default || AsyncStorageModule;
    
    // Check if AsyncStorage is null or methods are missing
    if (!AsyncStorage) {
      console.warn('AsyncStorage is null, using memory storage');
      asyncStorageInstance = memoryStorage;
      return memoryStorage;
    }
    
    // Check if AsyncStorage has required methods
    if (typeof AsyncStorage.getItem === 'function' && 
        typeof AsyncStorage.setItem === 'function' &&
        typeof AsyncStorage.removeItem === 'function') {
      
      // The module seems valid, assign it
      asyncStorageInstance = AsyncStorage;
      return AsyncStorage;
    }
    
    // If methods are missing, use fallback
    console.warn('AsyncStorage methods not found, using memory storage');
    asyncStorageInstance = memoryStorage;
    return memoryStorage;
  } catch (error: any) {
    console.warn('AsyncStorage not available, using memory storage:', error?.message || error);
    asyncStorageInstance = memoryStorage;
    return memoryStorage;
  }
  */
}

// Lazy initialization - only get AsyncStorage when actually used
function getAsyncStorageSafe() {
  try {
    return getAsyncStorage();
  } catch (error) {
    console.warn('Error getting AsyncStorage, using memory storage:', error);
    return memoryStorage;
  }
}




export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
}

const MAX_LOGS = 1000;
const LOG_STORAGE_KEY = APP_CONFIG.STORAGE_KEYS.LOGS;

function getCopyrightText(): string {
  const { company, year } = APP_CONFIG.COPYRIGHT;
  return `© ${year} ${company}. Tous droits réservés.`;
}

export async function addLog(level: LogEntry['level'], message: string, data?: any, stack?: string): Promise<void> {
  try {
    const logs = await getLogs();
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      stack,
    };
    logs.unshift(newLog);
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS);
    }
    const storage = getAsyncStorageSafe();
    await storage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Erreur lors de l\'ajout du log:', error);
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const storage = getAsyncStorageSafe();
    const logsJson = await storage.getItem(LOG_STORAGE_KEY);
    if (!logsJson) {
      return [];
    }
    return JSON.parse(logsJson) as LogEntry[];
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  try {
    const storage = getAsyncStorageSafe();
    await storage.removeItem(LOG_STORAGE_KEY);
  } catch (error) {
    console.error('Erreur lors de la suppression des logs:', error);
    throw error;
  }
}

export function formatLogsForDisplay(logs: LogEntry[]): string {
  return logs
    .map((log) => {
      const date = new Date(log.timestamp).toLocaleString('fr-FR');
      const levelEmoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🔍',
      }[log.level];
      let text = `[${date}] ${levelEmoji} [${log.level.toUpperCase()}] ${log.message}`;
      if (log.data) {
        text += `\n${log.data}`;
      }
      if (log.stack) {
        text += `\n${log.stack}`;
      }
      return text;
    })
    .join('\n\n');
}

export function formatLogsForEmail(logs: LogEntry[]): string {
  const appInfo = `${APP_CONFIG.VERSION}\n${getCopyrightText()}\n\n`;
  const logsText = formatLogsForDisplay(logs);
  return `${appInfo}\n\n=== LOGS ===\n\n${logsText}`;
}

export async function sendLogsByEmail(): Promise<void> {
  try {
    const logs = await getLogs();
    if (logs.length === 0) {
      Alert.alert('Information', 'Aucun log à envoyer');
      return;
    }
    const emailBody = formatLogsForEmail(logs);
    const emailSubject = `[POS Dolibarr] Logs - ${new Date().toLocaleString('fr-FR')}`;
    const emailTo = APP_CONFIG.SUPPORT.email;
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le client email');
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des logs:', error);
    Alert.alert('Erreur', 'Impossible d\'envoyer les logs par email');
  }
}

export async function contactSupport(): Promise<void> {
  try {
    const emailSubject = `[POS Dolibarr] Demande de support`;
    const emailBody = `Bonjour,\n\n[Votre message ici]\n\n---\nVersion: ${APP_CONFIG.VERSION}\n${getCopyrightText()}`;
    const emailTo = APP_CONFIG.SUPPORT.email;
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le client email');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du client email:', error);
    Alert.alert('Erreur', 'Impossible d\'ouvrir le client email');
  }
}

export async function clearCache(): Promise<void> {
  try {
    await clearLogs();
  } catch (error) {
    console.error('Erreur lors du vidage du cache:', error);
    throw error;
  }
}
