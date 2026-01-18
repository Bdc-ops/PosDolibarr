import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native"
import { useNavigation } from "@react-navigation/native"

export default function WaveFAB() {
  const navigation = useNavigation()
  const [menuVisible, setMenuVisible] = useState(false)
  const [scaleAnim] = useState(new Animated.Value(0))

  const toggleMenu = () => {
    const toValue = menuVisible ? 0 : 1
    setMenuVisible(!menuVisible)

    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start()
  }

  const handleCreateOrder = () => {
    setMenuVisible(false)
    scaleAnim.setValue(0)
    navigation.navigate("CreateOrder")
  }

  const handleCreateClient = () => {
    setMenuVisible(false)
    scaleAnim.setValue(0)
    navigation.navigate("EditClient", {
      mode: "create",
    })
  }

  const rotateInterpolate = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  })

  return (
    <>
      {/* Menu overlay */}
      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            setMenuVisible(false)
            scaleAnim.setValue(0)
          }}
        />
      )}

      {/* Menu options */}
      {menuVisible && (
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCreateClient}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIcon}>
              <Text style={styles.menuItemIconText}>👥</Text>
            </View>
            <Text style={styles.menuItemText}>Nouveau client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCreateOrder}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIcon}>
              <Text style={styles.menuItemIconText}>🛒</Text>
            </View>
            <Text style={styles.menuItemText}>Nouvelle commande</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Wave container avec bouton intégré */}
      <View style={styles.waveContainer}>
        {/* Wave effect avec View et border radius */}
        <View style={styles.wave}>
          {/* Vague supérieure avec border radius */}
          <View style={styles.waveTop} />
        </View>

        {/* FAB Button intégré dans la vague */}
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.fabIcon,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <Text style={styles.fabIconText}>+</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 998,
  },
  menuContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 999,
    alignItems: "flex-end",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemIconText: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    flex: 1,
  },
  waveContainer: {
    position: "absolute",
    bottom: 75, // Au-dessus du footer de navigation (height: 75)
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1001, // Supérieur au FAB global (1000) pour le masquer sur cet écran
    justifyContent: "flex-end",
    alignItems: "center",
    pointerEvents: "box-none", // Permettre les interactions avec le contenu en dessous
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  waveTop: {
    position: "absolute",
    top: -20,
    left: "20%",
    right: "20%",
    height: 25,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  fab: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 1002, // Supérieur au container pour être visible
  },
  fabIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIconText: {
    fontSize: 30,
    fontWeight: "300",
    color: "#fff",
    lineHeight: 52,
  },
})
