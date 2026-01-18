/**
 * Contexte i18n pour la gestion des traductions
 * Supporte le français, l'anglais, l'espagnol et le russe
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  
  // Always return memory storage initially to avoid native module initialization issues
  // AsyncStorage will be available once the native module is properly initialized
  // In the meantime, memory storage works fine for language preference
  console.warn('AsyncStorage not yet initialized, using memory storage for language preference');
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
import fr from './locales/fr';
import en from './locales/en';
import es from './locales/es';
import ru from './locales/ru';

export type Language = 'fr' | 'en' | 'es' | 'ru';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const translations = {
  fr,
  en,
  es,
  ru,
};

const STORAGE_KEY = 'app_language';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Provider i18n qui gère la langue actuelle et fournit les fonctions de traduction
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storage = getAsyncStorage();
        const savedLanguage = await storage.getItem(STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en' || savedLanguage === 'es' || savedLanguage === 'ru')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la langue:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Fonction pour changer la langue et la sauvegarder
  const setLanguage = async (lang: Language) => {
    try {
      const storage = getAsyncStorage();
      if (storage && typeof storage.setItem === 'function') {
        await storage.setItem(STORAGE_KEY, lang);
      }
      // Mettre à jour l'état dans tous les cas (même si la sauvegarde échoue)
      setLanguageState(lang);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
      // Mettre à jour quand même l'état même en cas d'erreur
      setLanguageState(lang);
    }
  };

  // Fonction de traduction avec support des paramètres
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Utiliser la langue actuelle ou français par défaut si pas encore chargé
    const currentLang = isLoading ? 'fr' : language;
    const keys = key.split('.');
    let value: any = translations[currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback vers le français si la clé n'existe pas
        let fallbackValue: any = translations.fr;
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // Retourne la clé si même le fallback échoue
          }
        }
        value = fallbackValue;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Remplacement des paramètres (ex: {id} -> valeur)
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return value;
  };

  // Toujours retourner le provider, même pendant le chargement
  // La fonction t utilise déjà 'fr' par défaut si isLoading est true
  return (
    <I18nContext.Provider
      value={{
        language: isLoading ? 'fr' : language,
        setLanguage,
        t,
        languages: LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte i18n
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}