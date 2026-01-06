import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { isConfigured } from '../services/storage';

/**
 * Écran de démarrage (Splash Screen)
 * Vérifie la configuration et redirige vers Configuration ou Catalogue
 */
export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkConfiguration = async () => {
      // Attendre 1.5 secondes pour l'animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const configured = await isConfigured();
        if (configured) {
          navigation.replace('Catalogue');
        } else {
          navigation.replace('Configuration');
        }
      } catch (error) {
        console.error('Erreur vérification configuration:', error);
        // En cas d'erreur, rediriger vers la configuration
        navigation.replace('Configuration');
      }
    };

    checkConfiguration();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Luxgreen Go</Text>
      <ActivityIndicator size="large" color={Colors.luxgreen} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
    letterSpacing: 3,
  },
  loader: {
    marginTop: 24,
  },
});

