import React from "react"
import { View, ActivityIndicator, Text, StyleSheet } from "react-native"

interface LoaderProps {
  message?: string
  size?: "small" | "large"
  color?: string
}

export default function Loader({
  message,
  size = "large",
  color = "#0B5FFF",
}: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#5C6B82",
    textAlign: "center",
  },
})
