import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeader from './components/CustomHeader';
import { Colors } from './constants/colors';

// Import des écrans
import CatalogueScreen from './screens/CatalogueScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ScanScreen from './screens/ScanScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

/**
 * Composant de navigation Stack avec headers personnalisés
 */
function StackNavigatorWithHeader() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        // Désactiver le header par défaut pour utiliser notre CustomHeader
        headerShown: false,
        // Pas de paddingTop par défaut - les écrans avec CustomHeader gèrent leur propre espace
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="Configuration"
        component={ConfigurationScreen}
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="Catalogue"
        component={CatalogueScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              title="Catalogue"
              rightComponent={
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="settings" size={26} color={Colors.textPrimary} />
                </TouchableOpacity>
              }
            />
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.textPrimary,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              title="Paramètres"
              showBack={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        })}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              title="Scanner"
              showBack={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              title="Détails produit"
              showBack={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        })}
      />
    </Stack.Navigator>
  );
}

/**
 * Application principale Luxgreen Go
 * Configuration de la navigation Stack
 */
function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <StackNavigatorWithHeader />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
