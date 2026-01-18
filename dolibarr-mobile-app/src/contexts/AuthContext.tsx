import React from "react"

export interface AuthContextType {
  login: () => void
  logout: () => void
}

export const AuthContext = React.createContext<AuthContextType>({
  login: () => {},
  logout: () => {},
})
