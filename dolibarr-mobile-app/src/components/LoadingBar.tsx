import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

interface LoadingBarProps {
  isLoading: boolean
  color?: string
  height?: number
}

export default function LoadingBar({ 
  isLoading, 
  color = "#0B5FFF", 
  height = 3 
}: LoadingBarProps) {
  const progress = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (isLoading) {
      // Animation de progression indéterminée (aller-retour)
      progress.setValue(0)
      
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      )
      
      animationRef.current = animation
      animation.start()
    } else {
      // Arrêter l'animation et cacher la barre
      if (animationRef.current) {
        animationRef.current.stop()
      }
      Animated.timing(progress, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [isLoading, progress])

  if (!isLoading) return null

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  })

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: color,
            height,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 9999,
  },
  bar: {
    width: width * 0.4, // 40% de la largeur de l'écran
    borderRadius: 2,
    shadowColor: "#0B5FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
})

