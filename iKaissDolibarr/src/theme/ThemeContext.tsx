/**
 * Contexte de thème pour l'application
 * Permet de changer le thème en temps réel
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeColors, getTheme, ThemeName } from './themes';
import { loadPOSSettings } from '../config/pos.settings';
import { theme as defaultTheme } from './theme';

interface ThemeContextType {
  themeColors: ThemeColors;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('default');
  const [themeColors, setThemeColors] = useState<ThemeColors>(getTheme('default'));

  useEffect(() => {
    // Charger le thème depuis la configuration au démarrage
    loadPOSSettings().then((settings) => {
      if (settings.colorTheme) {
        const name = settings.colorTheme as ThemeName;
        setThemeNameState(name);
        setThemeColors(getTheme(name));
      }
    }).catch(() => {
      // Ignore les erreurs, utilise le défaut
    });
  }, []);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    setThemeColors(getTheme(name));
    // Sauvegarder immédiatement
    import('../config/pos.settings').then(({ savePOSSettings }) => {
      savePOSSettings({ colorTheme: name }).catch(console.error);
    });
  };

  return (
    <ThemeContext.Provider value={{ themeColors, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook pour utiliser le thème
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback sur le thème par défaut si le contexte n'est pas disponible
    return {
      themeColors: getTheme('default'),
      themeName: 'default',
      setThemeName: () => {},
    };
  }
  return context;
}
