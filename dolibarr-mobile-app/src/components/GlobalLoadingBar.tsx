import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useLoading } from "../contexts/LoadingContext"

const { width } = Dimensions.get("window")

export default function GlobalLoadingBar() {
  const { isLoading, currentLabel, activeRequests } = useLoading()
  const insets = useSafeAreaInsets()
  const progress = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  
  // Hauteur du header (44 sur iOS, 56 sur Android, + safe area top)
  const headerHeight = Platform.OS === 'ios' ? 44 : 56
  const topPosition = insets.top + headerHeight

  useEffect(() => {
    if (isLoading) {
      // Faire apparaître la barre
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()

      // Animation de progression indéterminée
      progress.setValue(0)
      
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      )
      
      animationRef.current = animation
      animation.start()
    } else {
      // Arrêter l'animation et faire disparaître la barre
      if (animationRef.current) {
        animationRef.current.stop()
      }
      
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [isLoading, progress, opacity])

  // Ne pas afficher si pas de chargement et opacité à 0
  const [shouldRender, setShouldRender] = React.useState(true)
  
  React.useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShouldRender(false), 400)
      return () => clearTimeout(timer)
    } else {
      setShouldRender(true)
    }
  }, [isLoading])
  
  if (!shouldRender) return null

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.3, width],
  })

  // Afficher tous les endpoints en cours si plusieurs, sinon juste le label
  const displayText = activeRequests.length > 1
    ? `${activeRequests.length} chargements en cours...`
    : currentLabel || "Chargement..."

  return (
    <Animated.View style={[styles.container, { opacity, top: topPosition }]}>
      {/* Barre de progression */}
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      
      {/* Texte explicatif */}
      {currentLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText} numberOfLines={1}>
            {displayText}
          </Text>
          {activeRequests.length > 1 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeRequests.length}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  barContainer: {
    height: 3,
    overflow: "hidden",
    backgroundColor: "rgba(11, 95, 255, 0.1)",
  },
  bar: {
    width: width * 0.3,
    height: 3,
    backgroundColor: "#0B5FFF",
    shadowColor: "#0B5FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0B5FFF",
    textAlign: "center",
    flex: 1,
  },
  badge: {
    backgroundColor: "#0B5FFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
})

