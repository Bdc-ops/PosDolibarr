import React, { useState, useEffect, useContext } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { dolibarrClient } from "../api/dolibarr.client"
import { UsersAPI, type DolibarrUser } from "../api/users"
import { AuthContext } from "../contexts/AuthContext"
import { useDemo } from "../contexts/DemoContext"

interface AccountScreenProps {
  navigation: any
}

export default function AccountScreen({ navigation }: AccountScreenProps) {
  const { logout } = useContext(AuthContext)
  const { isDemoMode, disableDemoMode } = useDemo()
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [user, setUser] = useState<DolibarrUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
    timestamp?: number
  } | null>(null)

  useEffect(() => {
    loadConfig()
    loadUser()
    loadUserLocation()
  }, [])

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem("dolibarr_config")
      if (stored) {
        const config = JSON.parse(stored)
        setApiUrl(config.apiUrl || "")
        setApiKey(config.apiKey || "")
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la config:", error)
    }
  }

  const loadUser = async () => {
    try {
      setLoadingUser(true)
      const userData = await UsersAPI.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Erreur lors du chargement du profil utilisateur:", error)
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  const loadUserLocation = async () => {
    try {
      const stored = await AsyncStorage.getItem("user_location")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (
          typeof parsed?.latitude === "number" &&
          typeof parsed?.longitude === "number"
        ) {
          setUserLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            timestamp: parsed.timestamp,
          })
        }
      }
    } catch (error) {
      // Ignorer
    }
  }

  const handleBack = () => {
    try {
      navigation.goBack()
    } catch (error) {
      console.error("Erreur navigation retour:", error)
      navigation.navigate("MainTabs")
    }
  }

  const handleViewLogs = () => {
    Alert.alert(
      "Logs de l'application",
      "Les logs sont stockés dans :\n/Users/fahd/myApp/dolibarr-mobile-app/.cursor/debug.log",
      [
        { text: "OK" },
        {
          text: "Copier le chemin",
          onPress: () => {
            Alert.alert("Chemin copié", "Le chemin a été copié dans le presse-papier")
          },
        },
      ],
    )
  }

  const handleContactSupport = () => {
    const email = "support@anexys.fr"
    const subject = "Support Application Mobile Dolibarr"
    const body = `Bonjour,\n\nJ'ai besoin d'aide concernant l'application mobile Dolibarr.\n\nInformations système:\n- URL API: ${apiUrl}\n- Version: 1.0.0\n- Plateforme: ${Platform.OS}\n\nDescription du problème:\n[Décrivez votre problème ici]\n\nCordialement`
    
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    Linking.canOpenURL(mailto).then((supported) => {
      if (supported) {
        Linking.openURL(mailto)
      } else {
        Alert.alert(
          "Email non disponible",
          `Veuillez contacter le support à l'adresse:\n${email}`,
          [
            { text: "OK" },
            {
              text: "Copier l'email",
              onPress: () => {
                Alert.alert("Email copié", `${email} a été copié`)
              },
            },
          ],
        )
      }
    })
  }

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ? Le cache sera également vidé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              // Vider le cache avant de se déconnecter
              await dolibarrClient.clearCache()
              // Supprimer aussi les autres données stockées
              await AsyncStorage.multiRemove([
                "dolibarr_config",
                "user_location",
                "degraded_mode",
                "demo_mode",
              ])
              // Nettoyer tous les clés de cache AsyncStorage (au cas où)
              const allKeys = await AsyncStorage.getAllKeys()
              const cacheKeys = allKeys.filter(key => 
                key.startsWith("cache_") || 
                key.startsWith("dolibarr_cache_")
              )
              if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys)
              }
              console.log("✅ Déconnexion réussie, cache vidé")
              logout()
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error)
              // Continuer quand même la déconnexion
              try {
                await AsyncStorage.removeItem("dolibarr_config")
              } catch (e) {
                console.error("Erreur lors de la suppression de la config:", e)
              }
              logout()
            }
          },
        },
      ],
    )
  }

  // Masquer partiellement la clé API pour la sécurité
  const maskedApiKey = apiKey
    ? `${apiKey.substring(0, 8)}${"•".repeat(Math.max(0, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}`
    : "Non configurée"

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mon compte</Text>
        </View>

        {/* Profil utilisateur Dolibarr */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Profil utilisateur</Text>
          </View>

          {loadingUser ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0B5FFF" />
              <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
          ) : user ? (
            <>
              {user.photo && (
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.firstname?.[0] || user.lastname?.[0] || user.login?.[0] || "U"}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user.login || "Non disponible"}
                </Text>
              </View>
              {(user.firstname || user.lastname) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nom complet</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {[user.firstname, user.lastname].filter(Boolean).join(" ") || "Non disponible"}
                  </Text>
                </View>
              )}
              {user.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              )}
              {user.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user.phone}
                  </Text>
                </View>
              )}
              {user.admin && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rôle</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user.admin === "1" ? "Administrateur" : "Utilisateur"}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Impossible de charger le profil utilisateur
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadUser}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Informations de connexion */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <Text style={styles.sectionTitle}>Informations de connexion</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>URL API</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {apiUrl || "Non configurée"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Clé API</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {maskedApiKey}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position GPS</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {userLocation
                ? `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`
                : "Non disponible"}
            </Text>
            {userLocation?.timestamp && (
              <Text style={styles.infoHint}>
                Mise à jour: {new Date(userLocation.timestamp).toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={styles.sectionTitle}>Actions</Text>
          </View>

          {isDemoMode && (
            <TouchableOpacity
              style={[styles.actionButton, styles.demoButton]}
              onPress={async () => {
                Alert.alert(
                  "Désactiver le mode démo",
                  "Voulez-vous désactiver le mode démonstration et revenir à l'écran de connexion ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Désactiver",
                      onPress: async () => {
                        await disableDemoMode()
                        logout()
                      },
                    },
                  ],
                )
              }}
            >
              <Text style={styles.actionIcon}>🎭</Text>
              <Text style={[styles.actionButtonText, styles.demoButtonText]}>
                Désactiver le mode démo
              </Text>
              <Text style={[styles.actionChevron, styles.demoButtonText]}>›</Text>
            </TouchableOpacity>
          )}

          {!isDemoMode && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Configuration")}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionButtonText}>Modifier la configuration</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Déconnexion et vider le cache
            </Text>
            <Text style={[styles.actionChevron, styles.logoutButtonText]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                "Changer de compte",
                "Voulez-vous vous déconnecter et charger un nouveau compte ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Changer",
                    onPress: handleLogout,
                  },
                ],
              )
            }}
          >
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionButtonText}>Changer de compte</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support et Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛠️</Text>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewLogs}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionButtonText}>Voir les logs</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionIcon}>✉️</Text>
            <Text style={styles.actionButtonText}>Contacter le support</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.supportInfo}>
            <Text style={styles.supportEmail}>support@anexys.fr</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF0F8",
  },
  backgroundGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(11, 95, 255, 0.15)",
  },
  backgroundGlowSecondary: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 122, 47, 0.12)",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60, // Ajouter du padding en haut pour descendre le menu
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: {
    fontSize: 24,
    color: "#0E1B2E",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0E1B2E",
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  infoLabel: {
    fontSize: 12,
    color: "#5C6B82",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  infoHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#8A98AD",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  actionChevron: {
    fontSize: 24,
    color: "#5C6B82",
    fontWeight: "300",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 122, 47, 0.12)",
    borderColor: "rgba(255, 122, 47, 0.2)",
  },
  logoutButtonText: {
    color: "#FF6B35",
  },
  demoButton: {
    backgroundColor: "rgba(26, 147, 111, 0.12)",
    borderColor: "rgba(26, 147, 111, 0.2)",
  },
  demoButtonText: {
    color: "#1A936F",
  },
  supportInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(11, 95, 255, 0.08)",
    borderRadius: 8,
    alignItems: "center",
  },
  supportEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B5FFF",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#5C6B82",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#FF7A2F",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
})
