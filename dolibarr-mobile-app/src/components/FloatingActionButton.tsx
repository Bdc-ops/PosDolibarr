import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native"
import { useNavigation } from "@react-navigation/native"

export default function FloatingActionButton() {
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

      {/* FAB Button */}
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
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIconText: {
    fontSize: 36,
    fontWeight: "300",
    color: "#fff",
    lineHeight: 64,
  },
})
