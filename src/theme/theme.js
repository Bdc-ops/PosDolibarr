import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0066CC', // Bleu médical professionnel
    accent: '#00A86B', // Vert médical
    background: '#F5F7FA', // Fond clair
    surface: '#FFFFFF',
    text: '#1A1A1A',
    placeholder: '#6B7280',
    disabled: '#D1D5DB',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    onSurface: '#1A1A1A',
    onPrimary: '#FFFFFF',
  },
  roundness: 8,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
