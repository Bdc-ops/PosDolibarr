/**
 * Palette de couleurs industrielle pour iStock
 * Design robuste, terrain, type scanner professionnel
 */

export const Colors = {
  // Fond principal - noir charbon / gris anthracite
  background: '#1A1A1A',        // Gris anthracite profond
  backgroundSecondary: '#252525', // Gris foncé texturé
  backgroundCard: '#2A2A2A',     // Surface cartes (contraste net)
  
  // Accents fonctionnels uniquement
  success: '#00C853',      // Vert industriel (action valide / stock OK)
  successDark: '#00A043',
  warning: '#FF6F00',      // Orange industriel (attente / offline / stock faible)
  warningDark: '#E65100',
  error: '#D32F2F',       // Rouge industriel (erreur / stock critique)
  errorDark: '#B71C1C',
  
  // Compatibilité avec ancien code
  luxgreen: '#00C853',     // Alias pour success
  luxgreenDark: '#00A043',
  
  // Texte - lisibilité maximale
  textPrimary: '#FFFFFF',      // Texte principal (fort contraste)
  textSecondary: '#CCCCCC',    // Texte secondaire (lisible)
  textTertiary: '#999999',      // Texte tertiaire (discret mais lisible)
  textLabel: '#B0B0B0',        // Labels techniques
  
  // Bordures - contraste net, pas de subtilité
  border: '#404040',       // Bordure principale (visible)
  borderLight: '#505050',  // Bordure secondaire
  borderStrong: '#606060', // Bordure forte (focus)
  
  // Ombres - nettes, pas douces
  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowStrong: 'rgba(0, 0, 0, 0.7)',
  shadowLight: 'rgba(0, 0, 0, 0.3)',
};

