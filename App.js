import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from './src/theme/theme';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthContext } from './src/context/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isDemoMode, setIsDemoMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const demoMode = await AsyncStorage.getItem('demoMode');
      setIsAuthenticated(!!token);
      setIsDemoMode(demoMode === 'true');
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authContextValue = {
    isAuthenticated: isAuthenticated || isDemoMode,
    isDemoMode,
    setIsAuthenticated,
    login: async (token) => {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.removeItem('demoMode');
      setIsAuthenticated(true);
      setIsDemoMode(false);
    },
    logout: async () => {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('demoMode');
      setIsAuthenticated(false);
      setIsDemoMode(false);
    },
    enableDemoMode: async () => {
      await AsyncStorage.setItem('demoMode', 'true');
      await AsyncStorage.removeItem('authToken');
      setIsDemoMode(true);
      setIsAuthenticated(true);
    },
  };

  if (isLoading) {
    return null; // Vous pouvez ajouter un écran de chargement ici
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider value={authContextValue}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
}
