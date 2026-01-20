import "react-native-gesture-handler"
import React, { useState, useEffect } from "react"
import { View, Text } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { dolibarrClient } from "./src/api/dolibarr.client"
import { StatusBar } from "expo-status-bar"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"

// Import des écrans
import LoginScreen from "./src/screens/LoginScreen"
import DashboardScreen from "./src/screens/DashboardScreen"
import ProductsScreen from "./src/screens/ProductsScreen"
import CreateOrderScreen from "./src/screens/CreateOrderScreen"
import OrdersScreen from "./src/screens/OrdersScreen"
import InvoicesScreen from "./src/screens/InvoicesScreen"
import InvoiceDetailsScreen from "./src/screens/InvoiceDetailsScreen"
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen"
import StatsScreen from "./src/screens/StatsScreen"
import ConfigurationScreen from "./src/screens/ConfigurationScreen"
import SelectClientScreen from "./src/screens/SelectClientScreen"
import EditClientScreen from "./src/screens/EditClientScreen"
import ClientsScreen from "./src/screens/ClientsScreen"
import AccountScreen from "./src/screens/AccountScreen"
import DegradedModeBanner from "./src/components/DegradedModeBanner"
import DemoModeBanner from "./src/components/DemoModeBanner"
import LoadingScreen from "./src/components/LoadingScreen"
import { LoadingProvider } from "./src/contexts/LoadingContext"
import { CategoriesProvider, useCategories } from "./src/contexts/CategoriesContext"
import { DemoProvider, useDemo } from "./src/contexts/DemoContext"
import GlobalLoadingBar from "./src/components/GlobalLoadingBar"
import { InvoicesAPI } from "./src/api/invoices"
import { OrdersAPI } from "./src/api/orders"
import { buildSortParams } from "./src/utils/dolibarrSort"
import { AuthContext } from "./src/contexts/AuthContext"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// 🚀 Fonction de préchargement des données de statistiques
async function preloadStatsData() {
  console.log("🔄 [App] Préchargement des données statistiques en background...")
  
  try {
    // Charger les factures en background (jusqu'à 10 pages de 100, arrêt si 404)
    const invoicesPromises = []
    for (let page = 0; page < 10; page++) {
      invoicesPromises.push(
        InvoicesAPI.getAll({
          limit: 100,
          page,
          ...buildSortParams("invoices", "DESC", "date"),
        }).catch(err => {
          // 404 = pas assez de factures, c'est normal, ne pas logger
          const is404 = err?.response?.status === 404 || err?.is404
          if (!is404) {
            console.warn(`⚠️ [Preload] Erreur page ${page + 1} factures:`, err.message)
          }
          return []
        })
      )
    }
    
    // Charger les commandes en background (jusqu'à 10 pages de 100, arrêt si 404)
    const ordersPromises = []
    for (let page = 0; page < 10; page++) {
      ordersPromises.push(
        OrdersAPI.getAll({
          limit: 100,
          page,
          ...buildSortParams("orders", "DESC", "date"),
        }).catch(err => {
          // 404 = pas assez de commandes, c'est normal, ne pas logger
          const is404 = err?.response?.status === 404 || err?.is404
          if (!is404) {
            console.warn(`⚠️ [Preload] Erreur page ${page + 1} commandes:`, err.message)
          }
          return []
        })
      )
    }
    
    // Attendre que tout soit chargé (en parallèle pour aller vite)
    await Promise.all([...invoicesPromises, ...ordersPromises])
    
    console.log("✅ [App] Préchargement terminé! Les stats se chargeront instantanément.")
  } catch (err: any) {
    console.warn("⚠️ [App] Erreur lors du préchargement stats:", err.message)
  }
}

function MainTabs({ navigation }: any) {
  return (
    <>
      <GlobalLoadingBar />
      <DegradedModeBanner />
      <DemoModeBanner />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: "#004E89" },
          headerTintColor: "#fff",
          tabBarActiveTintColor: "#FF6B35",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#e0e0e0",
            height: 75,
            paddingBottom: 17, // Augmenté de 5px (était 12)
            paddingTop: 10,
            marginBottom: 5, // Ajout de 5px de marge en bas
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIcon: ({ focused, color }) => {
            // Utiliser directement des emojis pour garantir l'affichage
            const emojiMap: Record<string, string> = {
              "Accueil": "🏠",
              "Produits": "📦",
              "Commandes": "🛒",
              "Factures": "📄",
              "Statistiques": "📊",
            }
            
            const emoji = emojiMap[route.name] || "•"
            
            return (
              <View style={{ width: 24, height: 24, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
                  {emoji}
                </Text>
              </View>
            )
          },
        })}
      >
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Accueil",
        }}
      />
      <Tab.Screen
        name="Produits"
        component={ProductsScreen}
        options={{
          tabBarLabel: "Produits",
        }}
      />
      <Tab.Screen
        name="Commandes"
        component={OrdersScreen}
        options={{
          tabBarLabel: "Commandes",
        }}
      />
      <Tab.Screen
        name="Factures"
        component={InvoicesScreen}
        options={{
          tabBarLabel: "Factures",
        }}
      />
      <Tab.Screen
        name="Statistiques"
        component={StatsScreen}
        options={{
          tabBarLabel: "Stats",
        }}
      />
    </Tab.Navigator>
    </>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Vérifier d'abord si le mode démo est activé
      const demoMode = await AsyncStorage.getItem("demo_mode")
      if (demoMode === "true") {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      // Charger la config depuis AsyncStorage
      await dolibarrClient.loadConfig()
      const stored = await AsyncStorage.getItem("dolibarr_config")
      
      if (!stored) {
        // Pas de config stockée, afficher l'écran de login
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      let config
      try {
        config = JSON.parse(stored)
      } catch (parseError) {
        // Config invalide, réinitialiser
        console.warn("⚠️ Config invalide, réinitialisation")
        await AsyncStorage.removeItem("dolibarr_config")
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Vérifier que la config contient les champs requis
      if (!config || !config.apiUrl || !config.apiKey) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Tester la connexion avec timeout
      try {
        // Créer une promesse avec timeout
        const testConnection = Promise.race([
          dolibarrClient.get("/products", { limit: 1 }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: La connexion a pris trop de temps")), 10000)
          ),
        ])
        
        await testConnection
        setIsAuthenticated(true)
        
        // 🚀 Précharger les données stats en background après 3 secondes
        setTimeout(() => {
          preloadStatsData()
        }, 3000)
      } catch (connectionError: any) {
        // Erreur de connexion - ne pas bloquer l'app, permettre l'accès en mode dégradé
        console.warn("⚠️ Impossible de se connecter à l'API Dolibarr:", connectionError.message)
        // Permettre quand même l'accès si la config existe (mode dégradé)
        setIsAuthenticated(true)
      }
    } catch (error: any) {
      // Erreur générale - ne pas crasher l'app
      console.error("❌ Erreur lors de la vérification de l'authentification:", error?.message || error)
      // En cas d'erreur, permettre l'accès au login
      setIsAuthenticated(false)
    } finally {
      // Toujours arrêter le loading, même en cas d'erreur
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    // 🚀 Précharger les données stats en background après 3 secondes
    // (laisser l'app se charger d'abord)
    setTimeout(() => {
      preloadStatsData()
    }, 3000)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  // Composant interne pour charger les catégories après authentification
  function AuthenticatedApp() {
    const { loadCategories } = useCategories()
    
    useEffect(() => {
      if (isAuthenticated) {
        // Charger les catégories immédiatement après authentification
        loadCategories()
      }
    }, [isAuthenticated, loadCategories])
    
    return null
  }


  // Toujours rendre NavigationContainer pour éviter les crashes
  // Afficher un écran de chargement pendant l'initialisation
  if (isLoading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    )
  }

  return (
    <SafeAreaProvider>
      <DemoProvider>
        <LoadingProvider>
          <CategoriesProvider>
            <AuthContext.Provider value={{ login: handleLoginSuccess, logout: handleLogout }}>
              <StatusBar style="auto" />
              <AuthenticatedApp />
              <NavigationContainer>
        <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerBackTitleVisible: false,
          headerBackTitle: "",
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
              open: {
                animation: "timing",
                config: {
                  duration: 300,
                },
              },
              close: {
                animation: "timing",
                config: {
                  duration: 250,
                },
              },
            },
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen 
                name="MainTabs" 
                options={{
                  headerShown: false,
                }}
              >
                {(props) => <MainTabs {...props} />}
              </Stack.Screen>
              <Stack.Screen
                name="CreateOrder"
                component={CreateOrderScreen}
                options={{
                  headerShown: true,
                  title: "Nouvelle commande",
                  headerStyle: { backgroundColor: "#004E89" },
                  headerTintColor: "#fff",
                  headerBackTitleVisible: false,
                  headerBackTitle: "",
                }}
              />
            <Stack.Screen
              name="InvoiceDetails"
              component={InvoiceDetailsScreen}
              options={{
                headerShown: true,
                title: "Détails de la facture",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{
                headerShown: true,
                title: "Détails de la commande",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="Configuration"
              component={ConfigurationScreen}
              options={{
                headerShown: true,
                title: "Configuration",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
                headerBackTitleVisible: false,
                headerBackTitle: "",
              }}
            />
            <Stack.Screen
              name="SelectClient"
              component={SelectClientScreen}
              options={{
                headerShown: true,
                title: "Sélectionner un client",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="EditClient"
              component={EditClientScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route?.params?.mode === "create" ? "Nouveau client" : "Modifier client",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
              })}
            />
            <Stack.Screen
              name="Clients"
              component={ClientsScreen}
              options={{
                headerShown: true,
                title: "Clients",
                headerStyle: { backgroundColor: "#004E89" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="Account"
              component={AccountScreen}
              options={{
                headerShown: false,
              }}
            />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
        </CategoriesProvider>
      </LoadingProvider>
      </DemoProvider>
    </SafeAreaProvider>
  )
}
