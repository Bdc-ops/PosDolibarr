# Guide de démarrage rapide

## Installation en 5 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer l'application

```bash
npm start
```

ou

```bash
expo start
```

### 3. Tester sur votre appareil

- **iOS** : Installez l'app Expo Go depuis l'App Store, puis scannez le QR code
- **Android** : Installez l'app Expo Go depuis Google Play, puis scannez le QR code
- **Emulateur** : Appuyez sur `i` pour iOS ou `a` pour Android

### 4. Première connexion

1. Entrez l'URL de votre serveur Dolibarr (ex: `https://votre-serveur.dolibarr.fr`)
2. Entrez votre identifiant et mot de passe Dolibarr
3. L'application récupère automatiquement votre clé API

### 5. Utilisation

- **Accueil** : Consultez le CA et le dispatch par commerciaux
- **Clients** : Gérez vos clients avec géolocalisation
- **Factures** : Consultez et filtrez vos factures
- **Commandes** : Suivez vos commandes
- **Devis** : Créez et gérez vos devis
- **Config** : Synchronisez et consultez les logs

## Configuration du serveur Dolibarr

### Activer l'API REST

1. Connectez-vous à votre administration Dolibarr
2. Allez dans **Configuration > Modules**
3. Activez le module **REST API**
4. Allez dans **Configuration > Sécurité > API**
5. Créez un utilisateur API ou utilisez votre compte existant

### Permissions recommandées

Pour un utilisateur commercial, activez les permissions suivantes :
- Lecture des tiers (clients)
- Écriture des tiers (clients)
- Lecture des factures
- Lecture des commandes
- Lecture/Écriture des devis

## Dépannage

### L'application ne se connecte pas

- Vérifiez que l'URL du serveur est correcte (avec https://)
- Vérifiez que l'API REST est activée sur Dolibarr
- Vérifiez vos identifiants

### La synchronisation ne fonctionne pas

- Vérifiez votre connexion internet
- Allez dans Config > Synchroniser pour forcer une sync
- Consultez les logs dans Config pour voir les erreurs

### La géolocalisation ne fonctionne pas

- Autorisez l'application à accéder à votre localisation
- Vérifiez les permissions dans les paramètres de votre appareil

## Commandes utiles

```bash
# Démarrer en mode développement
npm start

# Démarrer sur Android
npm run android

# Démarrer sur iOS
npm run ios

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Formater le code
npx prettier --write .
```

## Support

Pour plus d'informations, consultez :
- [README.md](./README.md) - Documentation complète
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
