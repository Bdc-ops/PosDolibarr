import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface DashboardTileProps {
  icon: string
  title: string
  subtitle?: string
  onPress: () => void
  color?: string
  backgroundColor?: string
}

export default function DashboardTile({
  icon,
  title,
  subtitle,
  onPress,
  color = "#0B5FFF",
  backgroundColor = "rgba(255, 255, 255, 0.78)",
}: DashboardTileProps) {
  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle && (
        <Text 
          style={styles.subtitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    margin: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    minHeight: 100,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "#5C6B82",
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
    marginTop: 2,
  },
})
