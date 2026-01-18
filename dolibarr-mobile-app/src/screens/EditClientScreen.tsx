import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"
import { ThirdPartiesAPI } from "../api/thirdparties"
import type { ThirdParty } from "../types/dolibarr.types"

interface EditClientScreenProps {
  navigation?: any
  route?: {
    params?: {
      mode: "create" | "edit"
      client?: ThirdParty
      onSave?: (client: ThirdParty) => void
    }
  }
}

export default function EditClientScreen({ navigation, route }: EditClientScreenProps = {}) {
  const { mode, client: initialClient, onSave } = route?.params || {}

  const [name, setName] = useState(initialClient?.name || "")
  const [nameAlias, setNameAlias] = useState(initialClient?.name_alias || "")
  const [email, setEmail] = useState(initialClient?.email || "")
  const [phone, setPhone] = useState(initialClient?.phone || "")
  const [clientType, setClientType] = useState<ThirdParty["client"]>(initialClient?.client || "1")
  const [isSupplier, setIsSupplier] = useState<ThirdParty["fournisseur"]>(initialClient?.fournisseur || "0")
  const [address, setAddress] = useState(initialClient?.address || "")
  const [zip, setZip] = useState(initialClient?.zip || "")
  const [town, setTown] = useState(initialClient?.town || "")
  const [codeClient, setCodeClient] = useState(initialClient?.code_client || "")
  const [tvaIntra, setTvaIntra] = useState(initialClient?.tva_intra || "")
  const [siret, setSiret] = useState((initialClient as any)?.siret || (initialClient as any)?.idprof1 || (initialClient as any)?.siren || "")
  const [saving, setSaving] = useState(false)
  const [mapModule, setMapModule] = useState<any>(null)
  const [clientCoords, setClientCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require("react-native-maps")
      setMapModule(module)
    } catch (error) {
      setMapModule(null)
    }
  }, [])

  useEffect(() => {
    const loadCoords = async () => {
      if (!initialClient?.id) return
      const latRaw =
        (initialClient as any).latitude ??
        (initialClient as any).lat ??
        (initialClient as any).gps_lat ??
        (initialClient as any).gps_latitude
      const lonRaw =
        (initialClient as any).longitude ??
        (initialClient as any).long ??
        (initialClient as any).lon ??
        (initialClient as any).gps_long ??
        (initialClient as any).gps_longitude
      const latitude = Number(latRaw)
      const longitude = Number(lonRaw)
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setClientCoords({ latitude, longitude })
        return
      }

      try {
        const cached = await AsyncStorage.getItem(`client_geo_${initialClient.id}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (
            typeof parsed?.latitude === "number" &&
            typeof parsed?.longitude === "number"
          ) {
            setClientCoords(parsed)
            return
          }
        }
      } catch (error) {
        // Ignorer
      }

      try {
        const query = [initialClient.address, initialClient.zip, initialClient.town]
          .filter(Boolean)
          .join(" ")
        if (!query) return
        const results = await Location.geocodeAsync(query)
        if (results && results.length > 0) {
          const coords = {
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          }
          setClientCoords(coords)
          await AsyncStorage.setItem(`client_geo_${initialClient.id}`, JSON.stringify(coords))
        }
      } catch (error) {
        // Ignorer
      }
    }

    loadCoords()
  }, [initialClient])

  const handleSave = async () => {
    if (!name.trim()) {
      console.warn("⚠️ Tentative de sauvegarde sans nom")
      return
    }
    if (!clientType) {
      console.warn("⚠️ Tentative de sauvegarde sans type de client")
      return
    }
    if (clientType === "0" && isSupplier === "0") {
      console.warn("⚠️ Tentative de sauvegarde sans type (client ou fournisseur)")
      return
    }

    setSaving(true)
    try {
      const normalizedCodeClient =
        codeClient.trim() || (clientType !== "0" ? "auto" : undefined)
      const clientData: Partial<ThirdParty> = {
        name: name.trim(),
        name_alias: nameAlias.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        zip: zip.trim() || undefined,
        town: town.trim() || undefined,
        code_client: normalizedCodeClient,
        tva_intra: tvaIntra.trim() || undefined,
        client: clientType,
        fournisseur: isSupplier,
        // Ajouter SIRET (Dolibarr utilise généralement idprof1 pour SIRET)
        idprof1: siret.trim() || undefined,
        siret: siret.trim() || undefined,
      } as any
      console.log("📤 [ThirdParty] create payload:", JSON.stringify(clientData))

      let result
      if (mode === "create") {
        result = await ThirdPartiesAPI.create(clientData)
        if (result.success && result.data?.id) {
          // Récupérer le client créé pour le retourner
          const newClient = await ThirdPartiesAPI.getById(result.data.id)
          // Appeler onSave si présent (mais ne pas le passer dans params)
          if (onSave) {
            try {
              onSave(newClient)
            } catch (e) {
              // Ignorer si onSave n'est pas disponible
            }
          }
          Alert.alert("Succès", "Client créé avec succès", [
            { text: "OK", onPress: () => navigation.goBack() },
          ])
        } else {
          console.warn("⚠️ Erreur lors de la création du client:", result.error || "Erreur inconnue")
        }
      } else {
        if (!initialClient?.id) {
          console.warn("⚠️ ID client manquant pour la modification")
          return
        }
        result = await ThirdPartiesAPI.update(initialClient.id, clientData)
        if (result.success) {
          // Appeler onSave si présent (mais ne pas le passer dans params)
          if (onSave) {
            try {
              // Récupérer le client mis à jour
              const updatedClient = await ThirdPartiesAPI.getById(initialClient.id)
              onSave(updatedClient)
            } catch (e) {
              // Ignorer si onSave n'est pas disponible
            }
          }
          Alert.alert("Succès", "Client modifié avec succès", [
            { text: "OK", onPress: () => navigation.goBack() },
          ])
        } else {
          console.warn("⚠️ Erreur lors de la modification du client:", result.error || "Erreur inconnue")
        }
      }
    } catch (error: any) {
      console.warn("⚠️ Erreur lors de la sauvegarde du client:", error.message || error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Section d'affichage des informations en mode consultation */}
      {mode === "edit" && initialClient && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du client</Text>
          
          <View style={styles.infoDisplayRow}>
            <Text style={styles.infoDisplayLabel}>Nom:</Text>
            <Text style={styles.infoDisplayValue}>{initialClient.name}</Text>
          </View>
          
          {initialClient.name_alias && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>Nom commercial:</Text>
              <Text style={styles.infoDisplayValue}>{initialClient.name_alias}</Text>
            </View>
          )}
          
          {initialClient.code_client && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>Code client:</Text>
              <Text style={styles.infoDisplayValue}>{initialClient.code_client}</Text>
            </View>
          )}
          
          {(initialClient as any)?.siret || (initialClient as any)?.idprof1 ? (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>SIRET:</Text>
              <Text style={styles.infoDisplayValue}>
                {(initialClient as any)?.siret || (initialClient as any)?.idprof1}
              </Text>
            </View>
          ) : null}
          
          {initialClient.tva_intra && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>TVA intracommunautaire:</Text>
              <Text style={styles.infoDisplayValue}>{initialClient.tva_intra}</Text>
            </View>
          )}
          
          {initialClient.email && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>Email:</Text>
              <Text style={styles.infoDisplayValue}>{initialClient.email}</Text>
            </View>
          )}
          
          {initialClient.phone && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>Téléphone:</Text>
              <Text style={styles.infoDisplayValue}>{initialClient.phone}</Text>
            </View>
          )}
          
          {(initialClient.address || initialClient.zip || initialClient.town) && (
            <View style={styles.infoDisplayRow}>
              <Text style={styles.infoDisplayLabel}>Adresse:</Text>
              <Text style={styles.infoDisplayValue}>
                {[initialClient.address, initialClient.zip, initialClient.town].filter(Boolean).join(" ")}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type de tiers</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionButton, clientType === "1" && styles.optionButtonActive]}
            onPress={() => setClientType("1")}
          >
            <Text style={[styles.optionText, clientType === "1" && styles.optionTextActive]}>
              Client
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, clientType === "2" && styles.optionButtonActive]}
            onPress={() => setClientType("2")}
          >
            <Text style={[styles.optionText, clientType === "2" && styles.optionTextActive]}>
              Prospect
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Fournisseur</Text>
          <View style={styles.optionInlineGroup}>
            <TouchableOpacity
              style={[styles.optionPill, isSupplier === "1" && styles.optionPillActive]}
              onPress={() => setIsSupplier("1")}
            >
              <Text style={[styles.optionPillText, isSupplier === "1" && styles.optionPillTextActive]}>
                Oui
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionPill, isSupplier === "0" && styles.optionPillActive]}
              onPress={() => setIsSupplier("0")}
            >
              <Text style={[styles.optionPillText, isSupplier === "0" && styles.optionPillTextActive]}>
                Non
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du client"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom commercial</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom commercial (optionnel)"
            value={nameAlias}
            onChangeText={setNameAlias}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Code client</Text>
          <TextInput
            style={styles.input}
            placeholder="Code client (optionnel)"
            value={codeClient}
            onChangeText={setCodeClient}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coordonnées</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+33 1 23 45 67 89"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adresse</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Rue, numéro"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Code postal</Text>
            <TextInput
              style={styles.input}
              placeholder="75001"
              value={zip}
              onChangeText={setZip}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              placeholder="Paris"
              value={town}
              onChangeText={setTown}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Localisation</Text>
        {clientCoords && mapModule ? (
          <View style={styles.mapPreview}>
            {(() => {
              const MapView = mapModule.default || mapModule.MapView
              const Marker = mapModule.Marker
              return (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: clientCoords.latitude,
                    longitude: clientCoords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  zoomEnabled={false}
                  scrollEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={clientCoords} />
                </MapView>
              )
            })()}
          </View>
        ) : (
          <Text style={styles.label}>
            Aucune coordonnée GPS disponible pour ce client.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations fiscales</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SIRET</Text>
          <TextInput
            style={styles.input}
            placeholder="12345678901234"
            value={siret}
            onChangeText={setSiret}
            keyboardType="numeric"
            maxLength={14}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TVA intracommunautaire</Text>
          <TextInput
            style={styles.input}
            placeholder="FR12345678901"
            value={tvaIntra}
            onChangeText={setTvaIntra}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>
              {mode === "create" ? "Créer le client" : "Enregistrer les modifications"}
            </Text>
          )}
        </TouchableOpacity>
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.12)",
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  optionTextActive: {
    color: "#fff",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  optionInlineGroup: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  optionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.12)",
  },
  optionPillActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  optionPillTextActive: {
    color: "#fff",
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
  mapPreview: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  row: {
    flexDirection: "row",
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: "#0B5FFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoDisplayRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  infoDisplayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C6B82",
    width: 140,
    flexShrink: 0,
  },
  infoDisplayValue: {
    fontSize: 14,
    color: "#0E1B2E",
    flex: 1,
  },
})
