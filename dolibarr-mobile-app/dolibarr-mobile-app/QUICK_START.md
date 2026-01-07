# 🚀 Guide de démarrage rapide

## Installation

```bash
cd dolibarr-mobile-app
npm install
```

## Lancer le projet avec Expo

### Option 1 : Démarrer le serveur de développement
```bash
npm start
```
Puis appuyez sur :
- `i` pour iOS
- `a` pour Android
- `w` pour Web

### Option 2 : Lancer directement sur un simulateur/émulateur

**iOS (nécessite un Mac avec Xcode) :**
```bash
npm run ios
```

**Android (nécessite Android Studio et un émulateur) :**
```bash
npm run android
```

**Web (mode développement) :**
```bash
npm run web
```

### Option 3 : Utiliser Expo Go sur votre téléphone

1. Installez **Expo Go** depuis l'App Store (iOS) ou Google Play (Android)
2. Lancez `npm start`
3. Scannez le QR code avec :
   - **iOS** : L'appareil photo natif
   - **Android** : L'app Expo Go

## Tests

```bash
npm test
```

Pour les tests en mode watch :
```bash
npm run test:watch
```

## Configuration

Lors du premier lancement, vous devrez configurer :
- **URL de l'API Dolibarr** : `https://votre-dolibarr.com/api/index.php`
- **Clé API** : Votre clé API Dolibarr

Vous pouvez trouver votre clé API dans Dolibarr :
Menu → Outils → WebServices → Clés API

## Fonctionnalités

✅ **Écran de connexion** : Configuration de l'URL et de la clé API
✅ **Liste des produits** : Avec recherche en temps réel
✅ **Création de commandes** : Sélection de produits et clients
✅ **Liste des commandes** : Affichage de toutes les commandes
✅ **Liste des factures** : Affichage de toutes les factures
✅ **Détails de facture** : Affichage détaillé d'une facture
✅ **Mode offline** : Cache automatique pour consultation hors ligne
✅ **Tests unitaires** : Tests pour les APIs et utilitaires

## Structure du projet

```
dolibarr-mobile-app/
├── src/
│   ├── api/              # Services API Dolibarr
│   ├── screens/          # Écrans de l'application
│   ├── hooks/            # Custom hooks React
│   ├── types/            # Types TypeScript
│   ├── utils/            # Utilitaires (offline, etc.)
│   └── __tests__/        # Tests unitaires
├── App.tsx               # Point d'entrée de l'application
├── app.json              # Configuration Expo
└── package.json          # Dépendances
```

## Dépannage

### Erreur "Module not found"
```bash
npm install
```

### Erreur de connexion à l'API
- Vérifiez que l'URL de l'API est correcte
- Vérifiez que la clé API est valide
- Vérifiez votre connexion internet

### Le simulateur ne démarre pas
- **iOS** : Vérifiez que Xcode est installé et que les outils de ligne de commande sont configurés
- **Android** : Vérifiez qu'un émulateur Android est lancé ou qu'un appareil est connecté

