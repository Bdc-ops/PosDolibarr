import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { isDegradedModeActive, getDegradedModeInfo, clearDegradedMode } from "../utils/degradedMode"

interface DegradedModeBannerProps {
  onDismiss?: () => void
}

export default function DegradedModeBanner({ onDismiss }: DegradedModeBannerProps) {
  const [isActive, setIsActive] = useState(false)
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    checkDegradedMode()
    // Vérifier périodiquement (toutes les 5 secondes)
    const interval = setInterval(checkDegradedMode, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkDegradedMode = async () => {
    const active = await isDegradedModeActive()
    setIsActive(active)
    if (active) {
      const modeInfo = await getDegradedModeInfo()
      setInfo(modeInfo)
    }
  }

  const handleDismiss = async () => {
    await clearDegradedMode()
    setIsActive(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (!isActive) {
    return null
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode dégradé activé</Text>
          <Text style={styles.message}>
            Les données proviennent du cache local. Certaines fonctionnalités peuvent être limitées.
          </Text>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F57C00",
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
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})

