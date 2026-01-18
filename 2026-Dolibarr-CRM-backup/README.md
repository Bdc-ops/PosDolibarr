# Dolibarr CRM - Application Mobile React Native

Application mobile React Native complète pour la gestion CRM avec Dolibarr, fonctionnant en mode offline avec synchronisation automatique.

## Fonctionnalités

### 🔐 Authentification
- Connexion sécurisée avec login/mot de passe
- Récupération automatique de la clé API Dolibarr
- Stockage sécurisé des credentials

### 📊 Tableau de bord
- Affichage du Chiffre d'Affaires (CA) : aujourd'hui, ce mois, cette année
- Dispatch par commerciaux avec statistiques détaillées
- Vue d'ensemble des performances commerciales

### 👥 Gestion des clients
- Liste complète des clients avec recherche et filtres
- Filtres par secteur et commercial
- Géolocalisation des clients par secteur
- Création et modification de fiches clients
- Vue détaillée avec toutes les informations
- Carte interactive pour visualiser la localisation

### 📄 Factures
- Liste des factures avec filtres par statut
- Recherche rapide
- Détails complets de chaque facture
- Affichage du CA par commercial

### 📦 Commandes
- Liste des commandes avec filtres
- Suivi des statuts (Brouillon, Validée, En cours, Livrée)
- Recherche et filtres avancés

### 💼 Devis
- Création de nouveaux devis
- Liste des devis avec filtres par statut
- Suivi des devis (Brouillon, Envoyé, Accepté, Refusé)

### ⚙️ Configuration
- Gestion de l'utilisateur connecté
- Synchronisation manuelle
- Visualisation des logs système
- Déconnexion sécurisée

### 🔄 Mode Offline
- Base de données locale SQLite
- Fonctionnement complet sans connexion internet
- Synchronisation automatique à la reconnexion
- File d'attente des modifications en attente

### 📍 Géolocalisation
- Géolocalisation des clients par secteur
- Carte interactive avec marqueurs
- Mise à jour de la localisation depuis l'application

## Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Un serveur Dolibarr avec API activée

### Installation des dépendances

```bash
npm install
```

ou

```bash
yarn install
```

### Configuration

1. Assurez-vous que l'API Dolibarr est activée sur votre serveur
2. Configurez les permissions API dans Dolibarr
3. Lancez l'application :

```bash
npm start
```

ou

```bash
expo start
```

### Build pour production

#### Android
```bash
expo build:android
```

#### iOS
```bash
expo build:ios
```

## Structure du projet

```
2026-Dolibarr-CRM/
├── src/
│   ├── database/          # Base de données SQLite
│   │   └── database.ts
│   ├── services/          # Services API et synchronisation
│   │   ├── api.ts         # Intégration API Dolibarr
│   │   ├── auth.ts        # Authentification
│   │   └── sync.ts        # Synchronisation offline/online
│   ├── screens/           # Écrans de l'application
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ClientsScreen.tsx
│   │   ├── InvoicesScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── QuotesScreen.tsx
│   │   ├── ConfigScreen.tsx
│   │   ├── ClientDetailScreen.tsx
│   │   └── ClientMapScreen.tsx
│   └── navigation/        # Navigation
│       └── AppNavigator.tsx
├── App.tsx                # Point d'entrée
├── package.json
├── app.json
└── tsconfig.json
```

## Utilisation

### Première connexion

1. Lancez l'application
2. Entrez l'URL de votre serveur Dolibarr (ex: https://votre-serveur.dolibarr.fr)
3. Entrez votre identifiant et mot de passe
4. L'application récupère automatiquement votre clé API

### Synchronisation

- La synchronisation se fait automatiquement au démarrage
- Vous pouvez forcer une synchronisation depuis l'écran Configuration
- Les modifications effectuées hors ligne sont synchronisées automatiquement à la reconnexion

### Mode offline

L'application fonctionne entièrement en mode offline :
- Toutes les données sont stockées localement
- Les modifications sont mises en file d'attente
- La synchronisation se fait automatiquement dès la reconnexion

## API Dolibarr

L'application utilise les endpoints suivants de l'API Dolibarr :

- `/api/index.php/login` - Authentification
- `/api/index.php/thirdparties` - Gestion des clients
- `/api/index.php/invoices` - Gestion des factures
- `/api/index.php/orders` - Gestion des commandes
- `/api/index.php/proposals` - Gestion des devis
- `/api/index.php/users` - Gestion des commerciaux

## Technologies utilisées

- **React Native** - Framework mobile
- **Expo** - Outils de développement et build
- **TypeScript** - Typage statique
- **SQLite** - Base de données locale
- **React Navigation** - Navigation
- **Axios** - Requêtes HTTP
- **React Native Maps** - Cartes et géolocalisation
- **Expo Location** - Géolocalisation
- **Expo Secure Store** - Stockage sécurisé

## Sécurité

- Les clés API sont stockées de manière sécurisée avec Expo Secure Store
- Les mots de passe ne sont jamais stockés localement
- Toutes les communications avec le serveur utilisent HTTPS

## Support

Pour toute question ou problème, consultez la documentation Dolibarr ou ouvrez une issue sur le dépôt du projet.

## Licence

Ce projet est sous licence MIT.
