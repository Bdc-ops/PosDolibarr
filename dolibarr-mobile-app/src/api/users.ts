// API Utilisateurs - Récupération du profil utilisateur
import { dolibarrClient } from "./dolibarr.client"
import type { ApiResponse } from "../types/dolibarr.types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { normalizeApiUrl } from "../utils/normalizeApiUrl"

export interface DolibarrUser {
  id: string
  login?: string
  lastname?: string
  firstname?: string
  email?: string
  phone?: string
  photo?: string
  admin?: string
  employee?: string
  statut?: string
  [key: string]: any // Pour les autres champs possibles
}

async function isDemoMode(): Promise<boolean> {
  const demoMode = await AsyncStorage.getItem("demo_mode")
  return demoMode === "true"
}

export const UsersAPI = {
  // Authentifier avec login/password et obtenir un token API
  // ATTENTION: Cette méthode expose le mot de passe. Il est recommandé d'utiliser une clé API (DOLAPIKEY)
  // générée dans l'interface Dolibarr (Menu → Outils → WebServices → Clés API)
  // Endpoint: GET /login?login=username&password=password
  async login(username: string, password: string, apiUrl: string): Promise<{ token: string }> {
    try {
      // Normaliser l'URL avec la même fonction que le reste de l'app
      const normalizedUrl = normalizeApiUrl(apiUrl)
      
      // Appeler l'endpoint GET /login avec les paramètres login et password
      // Format: /login?login=username&password=password
      const response = await axios.get(
        `${normalizedUrl}/login`,
        {
          params: {
            login: username,
            password: password,
          },
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // Timeout de 10 secondes
        }
      )
      
      // Dolibarr retourne le token dans la réponse
      // Le format peut varier selon les versions
      const token = 
        response.data?.success?.token ||
        response.data?.token ||
        response.data?.api_key ||
        response.data?.success?.api_key ||
        response.data?.DOLAPIKEY
      
      if (!token) {
        // Si pas de token dans la réponse, vérifier si la réponse indique un succès
        if (response.data?.success) {
          // Certaines versions retournent juste { success: true } sans token explicite
          // Dans ce cas, utiliser Basic Auth encodé comme fallback
          const base64Encode = (str: string): string => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
            let output = ""
            let i = 0
            while (i < str.length) {
              const a = str.charCodeAt(i++)
              const b = i < str.length ? str.charCodeAt(i++) : 0
              const c = i < str.length ? str.charCodeAt(i++) : 0
              const bitmap = (a << 16) | (b << 8) | c
              output += chars.charAt((bitmap >> 18) & 63)
              output += chars.charAt((bitmap >> 12) & 63)
              output += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "="
              output += i - 1 < str.length ? chars.charAt(bitmap & 63) : "="
            }
            return output
          }
          const credentials = `${username}:${password}`
          return { token: base64Encode(credentials) }
        }
        throw new Error("Token non reçu de l'API")
      }
      
      return { token }
    } catch (error: any) {
      // Gestion des erreurs spécifiques
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        throw new Error("Identifiants incorrects")
      }
      
      const errorMessage = 
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Erreur de connexion"
      
      throw new Error(errorMessage)
    }
  },

  // Récupérer les informations de l'utilisateur connecté
  async getCurrentUser(): Promise<DolibarrUser> {
    if (await isDemoMode()) {
      return {
        id: "demo-user",
        login: "demo",
        firstname: "Démonstration",
        lastname: "Utilisateur",
        email: "demo@example.com",
        admin: "1",
        employee: "1",
        statut: "1",
      }
    }
    try {
      // Endpoint le plus robuste pour récupérer l'utilisateur courant (selon versions Dolibarr)
      return await dolibarrClient.get<DolibarrUser>("/users/info")
    } catch (error: any) {
      console.warn("⚠️ Impossible de récupérer les infos utilisateur, utilisation des valeurs par défaut")
      return {
        id: "unknown",
        login: "Utilisateur",
      }
    }
  },
}
