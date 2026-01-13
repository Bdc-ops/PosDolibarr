import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native"
import { dolibarrClient } from "../api/dolibarr.client"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { isDegradedModeActive, clearDegradedMode } from "../utils/degradedMode"

export default function ConfigurationScreen({ navigation }: any) {
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [offlineMode, setOfflineMode] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConfig()
    checkDegradedMode()
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

  const checkDegradedMode = async () => {
    const active = await isDegradedModeActive()
    setOfflineMode(active)
  }

  const handleSave = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      await dolibarrClient.setConfig(apiUrl.trim(), apiKey.trim())
      Alert.alert("Succès", "Configuration enregistrée avec succès")
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de sauvegarder la configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      await dolibarrClient.setConfig(apiUrl.trim(), apiKey.trim())
      await dolibarrClient.get("/products", { limit: 1 })
      Alert.alert("Succès", "Connexion réussie à l'API Dolibarr")
    } catch (error: any) {
      Alert.alert(
        "Erreur de connexion",
        error.message || "Impossible de se connecter à l'API Dolibarr",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    Alert.alert(
      "Nettoyer le cache",
      "Êtes-vous sûr de vouloir supprimer toutes les données en cache ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await dolibarrClient.clearCache()
              Alert.alert("Succès", "Cache nettoyé avec succès")
            } catch (error) {
              Alert.alert("Erreur", "Impossible de nettoyer le cache")
            }
          },
        },
      ],
    )
  }

  const handleClearDegradedMode = async () => {
    await clearDegradedMode()
    setOfflineMode(false)
    Alert.alert("Succès", "Mode dégradé désactivé")
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Section API */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration API</Text>

        <View style={styles.inputGroup}>
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
          <Text style={styles.helpText}>
            L'application ajoutera automatiquement /api/index.php
          </Text>
        </View>

        <View style={styles.inputGroup}>
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
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleTestConnection}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Tester la connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonPrimaryText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Section Cache */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache et données</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Mode dégradé</Text>
            <Text style={styles.settingDescription}>
              {offlineMode
                ? "Actif - Les données proviennent du cache"
                : "Inactif - Connexion normale"}
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={(value) => {
              if (!value) {
                handleClearDegradedMode()
              }
            }}
            disabled={!offlineMode}
          />
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Text style={styles.actionButtonText}>🗑️ Nettoyer le cache</Text>
        </TouchableOpacity>
      </View>

        {/* Section Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Version: 1.0.0{"\n"}
              Application mobile Dolibarr
            </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 8,
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
  helpText: {
    fontSize: 12,
    color: "#5C6B82",
    marginTop: 4,
    fontStyle: "italic",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#0B5FFF",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.12)",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondaryText: {
    color: "#0E1B2E",
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#5C6B82",
  },
  actionButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "rgba(255, 122, 47, 0.12)",
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#FF7A2F",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  infoText: {
    fontSize: 14,
    color: "#5C6B82",
    lineHeight: 20,
  },
})
