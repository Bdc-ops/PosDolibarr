import React from "react"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0B5FFF" />
      <Text style={styles.text}>Chargement...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF0F8",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#5C6B82",
  },
})
