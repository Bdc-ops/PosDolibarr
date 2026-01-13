# 📱 iSales Dolibarr - Application Mobile

Application mobile iOS & Android pour gérer Dolibarr : produits, stocks, ventes, commandes, factures et clients.

## 🚀 Technologies

- **React Native** (iOS + Android)
- **TypeScript**
- **Expo** (pour le développement rapide)
- **API REST Dolibarr**
- **AsyncStorage** (cache local)
- **React Navigation** (navigation)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web (dev)
npm run web
```

## 🔑 Configuration

Créer un fichier `.env` :

```env
DOLIBARR_API_URL=https://votre-dolibarr.com/api/index.php
DOLIBARR_API_KEY=votre_api_key
```

## 📁 Structure

```
dolibarr-mobile-app/
├── src/
│   ├── api/              # Services API Dolibarr
│   ├── components/       # Composants réutilisables
│   ├── screens/          # Écrans de l'app
│   ├── navigation/       # Configuration navigation
│   ├── types/            # Types TypeScript
│   ├── utils/            # Utilitaires
│   └── hooks/            # Custom hooks
├── App.tsx
└── package.json
```

## 🎯 Fonctionnalités

✅ Catalogue produits avec filtres et recherche
✅ Gestion des stocks en temps réel
✅ Création de commandes
✅ Génération de devis et factures
✅ Fiches clients/tiers (CRUD complet)
✅ Synchronisation offline
✅ Mode sombre

## 🔧 Utilisation avec Cursor

Utilisez ces prompts dans Cursor :

### Prompt 1 : Ajouter une fonctionnalité
```
"Ajoute une fonction pour filtrer les produits par catégorie dans src/api/products.ts"
```

### Prompt 2 : Créer un nouvel écran
```
"Crée un écran de statistiques des ventes dans src/screens/StatsScreen.tsx"
```

### Prompt 3 : Debugger
```
"@Codebase Pourquoi la création de commande ne fonctionne pas ?"
