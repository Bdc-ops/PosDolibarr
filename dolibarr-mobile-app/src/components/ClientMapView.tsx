import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"
import type { ThirdParty } from "../types/dolibarr.types"

interface ClientMapViewProps {
  clients: ThirdParty[]
  onClientPress: (client: ThirdParty) => void
}

type MapRegion = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

const DEFAULT_REGION: MapRegion = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 60,
  longitudeDelta: 60,
}

export default function ClientMapView({ clients, onClientPress }: ClientMapViewProps) {
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapModule, setMapModule] = useState<any>(null)
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { latitude: number; longitude: number }>>({})

  useEffect(() => {
    const loadMapModule = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require("react-native-maps")
        setMapModule(module)
      } catch (error) {
        setMapModule(null)
      }
    }

    loadMapModule()
  }, [])

  useEffect(() => {
    const loadCachedLocation = async () => {
      try {
        const cached = await AsyncStorage.getItem("user_location")
        if (cached) {
          const parsed = JSON.parse(cached)
          if (
            typeof parsed?.latitude === "number" &&
            typeof parsed?.longitude === "number"
          ) {
            const coords = { latitude: parsed.latitude, longitude: parsed.longitude }
            setUserCoords(coords)
            setRegion({
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            })
          }
        }
      } catch (error) {
        // Ignorer
      }
    }

    loadCachedLocation()
  }, [])

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setLocationError("Permission GPS refusée")
          return
        }
        const lastKnown = await Location.getLastKnownPositionAsync({})
        const position =
          lastKnown || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setUserCoords(coords)
        await AsyncStorage.setItem(
          "user_location",
          JSON.stringify({
            ...coords,
            timestamp: Date.now(),
          }),
        )
        const nextRegion: MapRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
        setRegion(nextRegion)
      } catch (error) {
        setLocationError("Impossible de récupérer la position GPS")
      }
    }

    loadLocation()
  }, [])

  const getClientCoordinates = (client: ThirdParty) => {
    const cached = geocodedCoords[client.id]
    if (cached) {
      return cached
    }
    const latRaw =
      (client as any).latitude ??
      (client as any).lat ??
      (client as any).gps_lat ??
      (client as any).gps_latitude
    const lonRaw =
      (client as any).longitude ??
      (client as any).long ??
      (client as any).lon ??
      (client as any).gps_long ??
      (client as any).gps_longitude

    const latitude = Number(latRaw)
    const longitude = Number(lonRaw)
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude }
    }
    return null
  }

  const { clientsWithCoords, clientsWithoutCoords } = useMemo(() => {
    const withCoords: Array<{ client: ThirdParty; coords: { latitude: number; longitude: number } }> = []
    const withoutCoords: ThirdParty[] = []
    clients.forEach((client) => {
      const coords = getClientCoordinates(client)
      if (coords) {
        withCoords.push({ client, coords })
      } else {
        withoutCoords.push(client)
      }
    })
    return { clientsWithCoords: withCoords, clientsWithoutCoords: withoutCoords }
  }, [clients, geocodedCoords])

  const distanceKm = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const dLat = toRad(b.latitude - a.latitude)
    const dLon = toRad(b.longitude - a.longitude)
    const lat1 = toRad(a.latitude)
    const lat2 = toRad(b.latitude)
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
  }

  const clientsForMap = useMemo(() => {
    if (clientsWithCoords.length === 0) return []
    if (userCoords) {
      return [...clientsWithCoords]
        .sort(
          (a, b) =>
            distanceKm(userCoords, a.coords) - distanceKm(userCoords, b.coords),
        )
        .slice(0, 25)
    }
    return clientsWithCoords.slice(0, 25)
  }, [clientsWithCoords, userCoords])

  const handleClientFocus = (client: ThirdParty) => {
    const coords = getClientCoordinates(client)
    if (!coords) return
    setRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    })
  }

  useEffect(() => {
    const hydrateCache = async () => {
      try {
        const entries = await Promise.all(
          clients.map(async (client) => {
            const cached = await AsyncStorage.getItem(`client_geo_${client.id}`)
            if (!cached) return null
            const parsed = JSON.parse(cached)
            if (
              typeof parsed?.latitude === "number" &&
              typeof parsed?.longitude === "number"
            ) {
              return { id: client.id, coords: parsed }
            }
            return null
          }),
        )
        const next: Record<string, { latitude: number; longitude: number }> = {}
        entries.filter(Boolean).forEach((entry: any) => {
          next[entry.id] = entry.coords
        })
        if (Object.keys(next).length > 0) {
          setGeocodedCoords((prev) => ({ ...prev, ...next }))
        }
      } catch (error) {
        console.warn("⚠️ Impossible de charger le cache des coordonnées")
      }
    }

    hydrateCache()
  }, [clients])

  useEffect(() => {
    const geocodeMissing = async () => {
      const missing = clientsWithoutCoords.filter((client) => {
        const addressParts = [client.address, client.zip, client.town].filter(Boolean)
        return addressParts.length > 0
      })
      if (missing.length === 0) return

      for (const client of missing.slice(0, 10)) {
        try {
          const query = [client.address, client.zip, client.town].filter(Boolean).join(" ")
          const results = await Location.geocodeAsync(query)
          if (results && results.length > 0) {
            const coords = {
              latitude: results[0].latitude,
              longitude: results[0].longitude,
            }
            setGeocodedCoords((prev) => ({ ...prev, [client.id]: coords }))
            await AsyncStorage.setItem(`client_geo_${client.id}`, JSON.stringify(coords))
          }
        } catch (error) {
          // Ignorer les erreurs de géocodage individuelles
        }
      }
    }

    geocodeMissing()
  }, [clientsWithoutCoords])

  useEffect(() => {
    if (userCoords) {
      setRegion((prev) => ({
        ...prev,
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
      }))
      return
    }
    if (clientsWithCoords.length === 0) return
    if (region.latitudeDelta < 0.3 && region.longitudeDelta < 0.3) return
    const first = clientsWithCoords[0].coords
    setRegion({
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    })
  }, [clientsWithCoords, region.latitudeDelta, region.longitudeDelta, userCoords])

  if (!mapModule) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          La carte n'est pas disponible (merci de patienter)
        </Text>
      </View>
    )
  }

  const MapView = mapModule.default || mapModule.MapView
  const Marker = mapModule.Marker

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Carte des clients</Text>
        <Text style={styles.legendText}>
          {clientsWithCoords.length} client(s) géolocalisé(s)
        </Text>
        {locationError && (
          <Text style={styles.legendHint}>{locationError}</Text>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={region}
          region={region}
          showsUserLocation
          showsMyLocationButton
          onRegionChangeComplete={setRegion}
        >
          {clientsForMap.map(({ client, coords }, index) => (
            <Marker
              key={`marker-${client.id}-${index}`}
              coordinate={coords}
              title={client.name}
              description={[client.town, client.zip].filter(Boolean).join(" ")}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.fallbackList}>
        <Text style={styles.fallbackListTitle}>Liste des clients</Text>
        {clients.map((client, index) => {
          const coords = getClientCoordinates(client)
          return (
            <TouchableOpacity
              key={`client-list-${client.id}-${index}`}
              style={styles.clientItem}
              onPress={() => coords && handleClientFocus(client)}
              disabled={!coords}
            >
              <Text style={styles.clientItemName}>{client.name}</Text>
              <Text style={styles.clientItemAddress}>
                {client.town} {client.zip ? `(${client.zip})` : ""}
              </Text>
              {!coords && (
                <Text style={styles.clientMissing}>
                  Adresse non géolocalisable
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {clientsWithoutCoords.length > 0 && (
        <View style={styles.fallbackList}>
          <Text style={styles.fallbackListTitle}>
            Clients sans coordonnées GPS ({clientsWithoutCoords.length})
          </Text>
          {clientsWithoutCoords.map((client, index) => (
            <TouchableOpacity
              key={`client-no-coords-${client.id}-${index}`}
              style={styles.clientItem}
              disabled
            >
              <Text style={styles.clientItemName}>{client.name}</Text>
              <Text style={styles.clientItemAddress}>
                {client.town} {client.zip ? `(${client.zip})` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF0F8",
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#5C6B82",
  },
  legend: {
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
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0B5FFF",
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#5C6B82",
  },
  mapContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    minHeight: 320,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  map: {
    width: "100%",
    minHeight: 300,
    borderRadius: 12,
  },
  clientItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  clientItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  clientItemAddress: {
    fontSize: 12,
    color: "#5C6B82",
  },
  fallbackList: {
    marginTop: 20,
    width: "100%",
  },
  fallbackListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B5FFF",
    marginBottom: 12,
  },
  clientMissing: {
    fontSize: 11,
    color: "#8A98AD",
    marginTop: 4,
  },
  legendHint: {
    fontSize: 12,
    color: "#8A98AD",
    marginTop: 6,
  },
})
