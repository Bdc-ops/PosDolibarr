// API Utilisateurs - Récupération du profil utilisateur
import { dolibarrClient } from "./dolibarr.client"
import type { ApiResponse } from "../types/dolibarr.types"

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

export const UsersAPI = {
  // Récupérer les informations de l'utilisateur connecté
  async getCurrentUser(): Promise<DolibarrUser> {
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
