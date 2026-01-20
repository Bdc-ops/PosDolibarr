# Dolibarr Mobile – Base React Native (Expo)

## 🎯 Objectif
Socle standard pour toutes les applications mobiles Dolibarr (iOS / Android).

Fonctionnalités incluses :
- Connexion Dolibarr via API REST
- URL du serveur configurable
- Authentification login / mot de passe
- Gestion du token API
- Stockage sécurisé
- UI professionnelle et prête production

---

## 🧱 Stack technique
- Expo (React Native)
- TypeScript
- expo-router
- expo-secure-store
- Axios

---

## 🔐 API Dolibarr – Configuration

### Endpoint de login
POST `/api/index.php/login`

Réponse attendue :
```json
{
  "success": {
    "token": "xxxxxxxxxxxxxxxx"
  }
}