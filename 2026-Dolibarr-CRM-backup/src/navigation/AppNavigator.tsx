import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth';
import { initDatabase } from '../database/database';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientsScreen from '../screens/ClientsScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import QuotesScreen from '../screens/QuotesScreen';
import ConfigScreen from '../screens/ConfigScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import ClientMapScreen from '../screens/ClientMapScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Factures"
        component={InvoicesScreen}
        options={{
          tabBarLabel: 'Factures',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Commandes"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Devis"
        component={QuotesScreen}
        options={{
          tabBarLabel: 'Devis',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          tabBarLabel: 'Config',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
    
    // Écouter les changements d'authentification
    const checkAuth = async () => {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    
    // Vérifier périodiquement (toutes les 2 secondes pendant le chargement)
    const interval = setInterval(checkAuth, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      await initDatabase();
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Erreur initialisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              headerShown: false,
              animationTypeForReplace: isAuthenticated ? 'push' : 'pop'
            }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ClientDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Détails client' }}
            />
            <Stack.Screen
              name="ClientMap"
              component={ClientMapScreen}
              options={{ headerShown: true, title: 'Localisation' }}
            />
            <Stack.Screen
              name="InvoiceDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Détails facture' }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Détails commande' }}
            />
            <Stack.Screen
              name="QuoteDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Détails devis' }}
            />
            <Stack.Screen
              name="ClientForm"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Nouveau client' }}
            />
            <Stack.Screen
              name="QuoteForm"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Nouveau devis' }}
            />
            <Stack.Screen
              name="CommercialDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Commercial' }}
            />
            <Stack.Screen
              name="LogsDetail"
              component={ConfigScreen}
              options={{ headerShown: true, title: 'Logs' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
