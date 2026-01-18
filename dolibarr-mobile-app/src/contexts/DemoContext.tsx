import React, { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface DemoContextType {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  enableDemoMode: () => {},
  disableDemoMode: () => {},
})

export const useDemo = () => useContext(DemoContext)

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Vérifier si le mode démo était activé
    AsyncStorage.getItem("demo_mode").then((value) => {
      if (value === "true") {
        setIsDemoMode(true)
      }
    })
  }, [])

  const enableDemoMode = async () => {
    setIsDemoMode(true)
    await AsyncStorage.setItem("demo_mode", "true")
  }

  const disableDemoMode = async () => {
    setIsDemoMode(false)
    await AsyncStorage.removeItem("demo_mode")
  }

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoContext.Provider>
  )
}
