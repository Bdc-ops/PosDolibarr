/**
 * Service de gestion des logs
 * Permet de stocker, visualiser et envoyer les logs par email
 */

// AsyncStorage sera importé dynamiquement si nécessaire
import { Linking, Alert } from 'react-native';
import { APP_CONFIG } from '../config/app.config';




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
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Erreur lors de l\'ajout du log:', error);
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
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
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
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
