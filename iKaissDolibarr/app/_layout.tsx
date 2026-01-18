import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/auth/AuthContext';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { I18nProvider } from '../src/i18n/I18nContext';
import { View, StyleSheet } from 'react-native';
import { theme } from '../src/theme/theme';

/**
 * Layout racine de l'application
 * Configure la navigation et les providers globaux
 * Initialise le contexte d'authentification
 * Note: La base de données sera initialisée de manière lazy lors de sa première utilisation
 * Note: GestureHandlerRootView n'est plus nécessaire avec Expo Router SDK 54+
 */
export default function RootLayout() {
  console.log('[RootLayout] Initialisation du layout racine...');
  
  return (
    <View style={styles.container}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.textInverse,
            headerTitleStyle: {
              ...theme.typography.h3,
            },
          }}
        >
          <Stack.Screen
            name="(auth)/login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(app)/index"
            options={{
              title: 'Accueil',
            }}
          />
          <Stack.Screen
            name="(app)/settings"
            options={{
              title: 'Configuration',
            }}
          />
          <Stack.Screen
            name="(app)/pos-config"
            options={{
              title: 'Configuration POS',
              headerShown: true,
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.textInverse,
              ...theme.typography.h3,
            }}
          />
          <Stack.Screen
            name="(pos)/index"
            options={{
              title: 'Caisse',
              headerRight: () => null, // Le bouton de config est dans le composant
            }}
          />
          <Stack.Screen
            name="(pos)/cart"
            options={{
              title: 'Panier',
            }}
          />
          <Stack.Screen
            name="(pos)/payment"
            options={{
              title: 'Paiement',
            }}
          />
          <Stack.Screen
            name="(pos)/receipt"
            options={{
              title: 'Ticket',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(pos)/clients"
            options={{
              title: 'Clients',
            }}
          />
          <Stack.Screen
            name="(pos)/products"
            options={{
              title: 'Produits',
            }}
          />
          <Stack.Screen
            name="(pos)/discount"
            options={{
              title: 'Remise',
            }}
          />
          <Stack.Screen
            name="(pos)/split"
            options={{
              title: 'Split',
            }}
          />
          <Stack.Screen
            name="(pos)/held"
            options={{
              title: 'Tickets en attente',
            }}
          />
          <Stack.Screen
            name="(pos)/returns"
            options={{
              title: 'Retour / Avoir',
            }}
          />
          <Stack.Screen
            name="(pos)/invoice-details"
            options={{
              title: 'Détails facture',
            }}
          />
        </Stack>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});