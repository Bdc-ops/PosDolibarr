import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { dolibarrClient } from "../api/dolibarr.client"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { normalizeApiUrl } from "../utils/normalizeApiUrl"
import { useDemo } from "../contexts/DemoContext"
import { UsersAPI } from "../api/users"

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<"apiKey" | "login">("apiKey")
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingConfig, setCheckingConfig] = useState(true)
  const { enableDemoMode, isDemoMode } = useDemo()

  useEffect(() => {
    // Vérifier si une configuration existe déjà
    checkExistingConfig()
  }, [])

  const checkExistingConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem("dolibarr_config")
      if (stored) {
        const config = JSON.parse(stored)
        setApiUrl(config.apiUrl || "")
        setApiKey(config.apiKey || "")
        // Tester la connexion automatiquement
        await testConnection(config.apiUrl, config.apiKey)
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la config:", error)
    } finally {
      setCheckingConfig(false)
    }
  }

  const testConnection = async (url: string, key: string) => {
    try {
      setLoading(true)
      await dolibarrClient.setConfig(url, key)
      // Tester avec une requête simple (par exemple, récupérer les produits)
      await dolibarrClient.get("/products", { limit: 1 })
      onLoginSuccess()
    } catch (error: any) {
      console.warn("⚠️ Erreur de connexion:", error.message || error)
      // Ne pas afficher d'erreur à l'utilisateur, seulement dans les logs
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!apiUrl.trim()) {
      console.warn("⚠️ URL manquante")
      return
    }

    // Valider le format de l'URL
    let urlToTest = apiUrl.trim()
    try {
      new URL(urlToTest)
    } catch {
      console.warn("⚠️ URL invalide:", urlToTest)
      return
    }

    const normalizedUrl = normalizeApiUrl(urlToTest)

    if (authMethod === "login") {
      // Authentification par login/password
      if (!username.trim() || !password.trim()) {
        console.warn("⚠️ Login et mot de passe requis")
        return
      }

      try {
        setLoading(true)
        // Obtenir le token via l'API users avec timeout réduit
        const { token } = await UsersAPI.login(username.trim(), password.trim(), normalizedUrl)
        // Utiliser le token comme clé API
        await testConnection(normalizedUrl, token)
      } catch (error: any) {
        console.warn("⚠️ Erreur d'authentification:", error.message || error)
        setLoading(false) // S'assurer que le loading s'arrête en cas d'erreur
      }
    } else {
      // Authentification par clé API
      if (!apiKey.trim()) {
        console.warn("⚠️ Clé API manquante")
        return
      }
      await testConnection(normalizedUrl, apiKey.trim())
    }
  }

  if (checkingConfig) {
    return (
      <View style={styles.screen}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSecondary} />
        <View style={styles.container}>
        <ActivityIndicator size="large" color="#0B5FFF" />
        <Text style={styles.loadingText}>Chargement de la configuration...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>ISales Dolibarr</Text>
            <Text style={styles.subtitle}>
              Entrez l'URL de votre API Dolibarr et connectez-vous
            </Text>

            <View style={styles.form}>
              {/* Choix de la méthode d'authentification */}
              <View style={styles.authMethodContainer}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setAuthMethod("apiKey")}
                >
                  <View style={styles.radioCircle}>
                    {authMethod === "apiKey" && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Clé API</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setAuthMethod("login")}
                >
                  <View style={styles.radioCircle}>
                    {authMethod === "login" && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Login / Mot de passe</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>URL de l'API</Text>
              <TextInput
                style={styles.input}
                placeholder="https://votre-dolibarr.com"
                placeholderTextColor="#8A98AD"
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.helpTextUrl}>
                L'application ajoutera automatiquement /api/index.php si nécessaire
              </Text>

              {authMethod === "apiKey" ? (
                <>
                  <Text style={styles.label}>Clé API</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre clé API"
                    placeholderTextColor="#8A98AD"
                    value={apiKey}
                    onChangeText={setApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </>
              ) : (
                <>
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ Cette méthode expose votre mot de passe. Il est recommandé d'utiliser une clé API.
                    </Text>
                  </View>
                  <Text style={styles.label}>Nom d'utilisateur</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom d'utilisateur"
                    placeholderTextColor="#8A98AD"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.label}>Mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#8A98AD"
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OU</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.demoButton}
                onPress={async () => {
                  await enableDemoMode()
                  onLoginSuccess()
                }}
                disabled={loading || isDemoMode}
              >
                <Text style={styles.demoButtonText}>
                  {isDemoMode ? "Mode démo activé" : "Essayer en mode démo"}
                </Text>
              </TouchableOpacity>

              {authMethod === "apiKey" && (
                <Text style={styles.helpText}>
                  Vous pouvez trouver votre clé API dans Dolibarr :{"\n"}
                  Menu → Outils → WebServices → Clés API
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B5FFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#5C6B82",
    marginBottom: 30,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
  },
  button: {
    backgroundColor: "#0B5FFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 12,
    color: "#8A98AD",
    marginTop: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  helpTextUrl: {
    fontSize: 11,
    color: "#5C6B82",
    marginTop: 4,
    fontStyle: "italic",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5C6B82",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: "#8A98AD",
    fontWeight: "600",
  },
  demoButton: {
    backgroundColor: "#1A936F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderWidth: 2,
    borderColor: "#1A936F",
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  authMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0B5FFF",
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
  },
})
