/**
 * Système de thèmes pour l'application POS
 * Supporte 3 thèmes : black, pastels, futuristes
 */

export type ThemeName = 'default' | 'black' | 'pastels' | 'futuristes';

export interface ThemeColors {
  // Couleurs primaires
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Couleurs secondaires
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  // Couleurs de statut
  success: string;
  error: string;
  warning: string;
  info: string;

  // Couleurs de fond
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Couleurs de texte
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Couleurs de bordure
  border: string;
  borderLight: string;
  borderDark: string;

  // Couleurs d'entrée
  inputBackground: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputPlaceholder: string;
}

/**
 * Thème par défaut (bleu professionnel Dolibarr)
 */
export const defaultThemeColors: ThemeColors = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primaryLight: '#3b82f6',
  secondary: '#64748b',
  secondaryDark: '#475569',
  secondaryLight: '#94a3b8',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  inputBackground: '#ffffff',
  inputBorder: '#e2e8f0',
  inputBorderFocus: '#2563eb',
  inputPlaceholder: '#94a3b8',
};

/**
 * Thème Black (sombre, élégant, moderne)
 */
export const blackThemeColors: ThemeColors = {
  primary: '#1a1a1a',
  primaryDark: '#0a0a0a',
  primaryLight: '#2a2a2a',
  secondary: '#3a3a3a',
  secondaryDark: '#2a2a2a',
  secondaryLight: '#4a4a4a',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  background: '#0f0f0f',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#252525',
  text: '#f5f5f5',
  textSecondary: '#d4d4d4',
  textTertiary: '#a3a3a3',
  textInverse: '#ffffff',
  border: '#2a2a2a',
  borderLight: '#1f1f1f',
  borderDark: '#3a3a3a',
  inputBackground: '#1a1a1a',
  inputBorder: '#2a2a2a',
  inputBorderFocus: '#3b82f6',
  inputPlaceholder: '#737373',
};

/**
 * Thème Pastels (doux, apaisant, harmonieux)
 */
export const pastelsThemeColors: ThemeColors = {
  primary: '#94a3b8', // Bleu-gris pastel doux
  primaryDark: '#64748b',
  primaryLight: '#cbd5e1',
  secondary: '#f1c5d1', // Rose pastel
  secondaryDark: '#e6a5b8',
  secondaryLight: '#f8d7e2',
  success: '#86efac', // Vert pastel
  error: '#fca5a5', // Rouge pastel
  warning: '#fcd34d', // Jaune pastel
  info: '#93c5fd', // Bleu pastel
  background: '#fefefe',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  text: '#475569',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  inputBackground: '#ffffff',
  inputBorder: '#e2e8f0',
  inputBorderFocus: '#94a3b8',
  inputPlaceholder: '#94a3b8',
};

/**
 * Thème Futuristes (moderne, techno, cyberpunk)
 */
export const futuristesThemeColors: ThemeColors = {
  primary: '#00f5ff', // Cyan néon brillant
  primaryDark: '#00b8cc',
  primaryLight: '#4dffff',
  secondary: '#9d4edd', // Violet néon
  secondaryDark: '#7b2cbf',
  secondaryLight: '#c77dff',
  success: '#39ff14', // Vert néon
  error: '#ff006e', // Rose néon
  warning: '#ffbe0b', // Jaune néon
  info: '#00f5ff',
  background: '#0d1117',
  backgroundSecondary: '#161b22',
  backgroundTertiary: '#1f2328',
  text: '#f0f6fc',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textInverse: '#0d1117',
  border: '#30363d',
  borderLight: '#21262d',
  borderDark: '#484f58',
  inputBackground: '#161b22',
  inputBorder: '#30363d',
  inputBorderFocus: '#00f5ff',
  inputPlaceholder: '#6e7681',
};

/**
 * Tous les thèmes disponibles
 */
export const themes: Record<ThemeName, ThemeColors> = {
  default: defaultThemeColors,
  black: blackThemeColors,
  pastels: pastelsThemeColors,
  futuristes: futuristesThemeColors,
};

/**
 * Récupère un thème par son nom
 */
export function getTheme(themeName: ThemeName = 'default'): ThemeColors {
  return themes[themeName] || themes.default;
}
