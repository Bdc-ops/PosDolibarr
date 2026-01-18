# Dolibarr POS - Application Mobile

Application de caisse (POS) connectée à Dolibarr pour iOS et Android.

## ⚠️ Important - Build de développement requise

Cette application utilise des modules natifs (`expo-sqlite`, `expo-secure-store`) qui nécessitent une **build de développement personnalisée** avec `expo-dev-client`.

**Expo Go standard ne fonctionnera pas** car ces modules ne sont pas inclus dans Expo Go SDK 54.

## 🚀 Installation et démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer une build de développement

#### Option A : Build locale (iOS avec Xcode)

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

#### Option B : Build avec EAS (recommandé pour la production)

```bash
# Installer EAS CLI si nécessaire
npm install -g eas-cli

# Se connecter à Expo
eas login

# Créer une build de développement
eas build --profile development --platform ios
# ou
eas build --profile development --platform android
```

### 3. Lancer en mode développement

```bash
npm start
# ou
npx expo start --dev-client
```

## 📝 Notes

- **Expo Go** : Ne fonctionne pas avec cette application (modules natifs requis)
- **expo-dev-client** : Nécessaire pour tester avec des modules natifs
- **Production** : Utiliser `eas build` pour créer une build de production

## 🔧 Dépannage

Si vous rencontrez l'erreur `PlatformConstants could not be found` :
1. Vérifiez que vous utilisez `expo-dev-client` et non Expo Go
2. Créez une nouvelle build avec `npx expo run:ios` ou `eas build`
3. Installez l'application buildée sur votre appareil/simulateur
