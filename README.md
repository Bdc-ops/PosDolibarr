# MediLink - Application Mobile de Pharmacie en Ligne

Application React Native pour iOS et Android permettant de commander des médicaments en ligne via le scan d'ordonnances, avec intégration à l'API Dolibarr.

## Fonctionnalités

- 🔐 **Authentification** : Connexion et inscription
- 📋 **Commandes** : Visualisation des commandes de médicaments
- 🚚 **Livraisons** : Suivi des livraisons en cours
- 👤 **Profil** : Gestion du profil utilisateur (date de naissance, sécurité sociale, adresse, etc.)
- 📷 **Scanner d'ordonnances** : Scan d'ordonnances pour créer des commandes
- 🎨 **Design professionnel** : Interface adaptée au milieu médical

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Expo CLI
- Compte Expo (pour tester sur appareils)
- Serveur Dolibarr avec API activée

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer l'API Dolibarr :
   - Ouvrir `src/services/dolibarrApi.js`
   - Modifier `API_BASE_URL` avec l'URL de votre serveur Dolibarr

3. Démarrer l'application :
```bash
npm start
```

## Configuration

### API Dolibarr

L'application utilise l'API REST de Dolibarr. Assurez-vous que :
- L'API REST est activée sur votre serveur Dolibarr
- Les endpoints suivants sont disponibles :
  - `POST /api/index.php/login` - Authentification
  - `POST /api/index.php/users` - Inscription
  - `GET /api/index.php/orders` - Liste des commandes
  - `GET /api/index.php/deliveries` - Liste des livraisons
  - `GET /api/index.php/users/me` - Profil utilisateur
  - `POST /api/index.php/prescriptions/upload` - Upload d'ordonnance

### Permissions

L'application nécessite les permissions suivantes :
- **Caméra** : Pour scanner les ordonnances
- **Galerie** : Pour sélectionner des images d'ordonnances

## Structure du projet

```
medilink/
├── App.js                 # Point d'entrée de l'application
├── src/
│   ├── context/          # Contextes React (AuthContext)
│   ├── navigation/       # Configuration de navigation
│   ├── screens/          # Écrans de l'application
│   │   ├── auth/         # Écrans d'authentification
│   │   └── main/         # Écrans principaux
│   ├── services/         # Services API (Dolibarr)
│   └── theme/            # Thème et styles
└── assets/               # Images et ressources
```

## Technologies utilisées

- **React Native** : Framework mobile
- **Expo** : Outils de développement
- **React Navigation** : Navigation
- **React Native Paper** : Composants UI
- **Axios** : Client HTTP
- **Expo Camera** : Scanner d'ordonnances
- **AsyncStorage** : Stockage local

## Développement

### Lancer sur iOS
```bash
npm run ios
```

### Lancer sur Android
```bash
npm run android
```

### Lancer sur Web
```bash
npm run web
```

## Notes importantes

- L'application est configurée pour fonctionner avec l'API Dolibarr standard
- Vous devrez peut-être adapter les endpoints selon votre configuration Dolibarr
- Le scanner d'ordonnances nécessite une caméra fonctionnelle
- Les données sont stockées localement avec AsyncStorage pour la persistance de session

## Support

Pour toute question ou problème, veuillez consulter la documentation de Dolibarr ou contacter le support technique.
