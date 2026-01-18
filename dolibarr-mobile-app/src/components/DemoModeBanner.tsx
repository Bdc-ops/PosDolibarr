import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface DemoModeBannerProps {
  onDismiss?: () => void
}

export default function DemoModeBanner({ onDismiss }: DemoModeBannerProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    checkDemoMode()
    // Vérifier périodiquement (toutes les 2 secondes)
    const interval = setInterval(checkDemoMode, 2000)
    return () => clearInterval(interval)
  }, [])

  const checkDemoMode = async () => {
    const demoMode = await AsyncStorage.getItem("demo_mode")
    setIsActive(demoMode === "true")
  }

  if (!isActive) {
    return null
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎭</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode démonstration</Text>
          <Text style={styles.message}>
            Vous utilisez l'application avec des données de démonstration.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1A936F",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#158A6A",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
})
