import React, { createContext, useContext, useState, useCallback } from "react"

interface LoadingState {
  endpoint: string
  label: string
  timestamp: number
}

interface LoadingContextType {
  activeRequests: LoadingState[]
  startLoading: (endpoint: string, label: string) => void
  stopLoading: (endpoint: string) => void
  isLoading: boolean
  currentLabel: string | null
}

const LoadingContext = createContext<LoadingContextType>({
  activeRequests: [],
  startLoading: () => {},
  stopLoading: () => {},
  isLoading: false,
  currentLabel: null,
})

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeRequests, setActiveRequests] = useState<LoadingState[]>([])

  const startLoading = useCallback((endpoint: string, label: string) => {
    setActiveRequests((prev) => {
      // Éviter les doublons
      const exists = prev.some((req) => req.endpoint === endpoint)
      if (exists) return prev
      
      return [
        ...prev,
        {
          endpoint,
          label,
          timestamp: Date.now(),
        },
      ]
    })
  }, [])

  const stopLoading = useCallback((endpoint: string) => {
    setActiveRequests((prev) => prev.filter((req) => req.endpoint !== endpoint))
  }, [])

  const isLoading = activeRequests.length > 0
  const currentLabel = activeRequests.length > 0 ? activeRequests[0].label : null

  return (
    <LoadingContext.Provider
      value={{
        activeRequests,
        startLoading,
        stopLoading,
        isLoading,
        currentLabel,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

