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

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingConfig, setCheckingConfig] = useState(true)

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
      console.error("Erreur de connexion:", error)
      // Ne pas afficher d'erreur si c'est juste une vérification automatique
      if (!checkingConfig) {
        Alert.alert(
          "Erreur de connexion",
          "Impossible de se connecter à l'API Dolibarr. Vérifiez l'URL et la clé API.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    // Valider le format de l'URL
    let urlToTest = apiUrl.trim()
    try {
      new URL(urlToTest)
    } catch {
      Alert.alert("Erreur", "L'URL n'est pas valide")
      return
    }

    // Normaliser l'URL (ajouter /api/index.php si absent)
    // Note: La normalisation sera aussi faite dans setConfig, mais on la fait ici
    // pour afficher l'URL normalisée à l'utilisateur si nécessaire
    const normalizedUrl = normalizeApiUrl(urlToTest)
    
    await testConnection(normalizedUrl, apiKey.trim())
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
            <Text style={styles.title}>Configuration Ediconnect</Text>
            <Text style={styles.subtitle}>
              Entrez l'URL de votre API Dolibarr et votre clé API
            </Text>

            <View style={styles.form}>
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

              <Text style={styles.helpText}>
                Vous pouvez trouver votre clé API dans Dolibarr :{"\n"}
                Menu → Outils → WebServices → Clés API
              </Text>
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
})
