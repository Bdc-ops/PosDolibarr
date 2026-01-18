# 📱 Commandes Expo - Dolibarr CRM

## Commandes principales

### 1. Installer les dépendances (première fois uniquement)

```bash
npm install
```

### 2. Démarrer le serveur Expo

```bash
npm start
```

ou

```bash
npx expo start
```

### 3. Options de démarrage spécifiques

#### Démarrer et ouvrir directement sur Android
```bash
npm run android
```
ou
```bash
npx expo start --android
```

#### Démarrer et ouvrir directement sur iOS
```bash
npm run ios
```
ou
```bash
npx expo start --ios
```

#### Démarrer et ouvrir dans le navigateur web
```bash
npm run web
```
ou
```bash
npx expo start --web
```

#### Démarrer avec tunnel (pour tester à distance)
```bash
npx expo start --tunnel
```

#### Démarrer et effacer le cache
```bash
npx expo start --clear
```

## Commandes pendant que Expo tourne

Une fois que `expo start` est lancé, vous pouvez utiliser ces raccourcis clavier :

- **`a`** - Ouvrir sur Android
- **`i`** - Ouvrir sur iOS
- **`w`** - Ouvrir sur le web
- **`r`** - Recharger l'application (refresh)
- **`m`** - Basculer le menu de développement
- **`s`** - Envoyer le lien par email/SMS
- **`c`** - Effacer le cache
- **`q`** - Quitter le serveur

## Séquence complète de démarrage

### Première installation

```bash
# 1. Aller dans le dossier du projet
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# 2. Installer les dépendances
npm install

# 3. Démarrer Expo
npm start
```

### Démarrage quotidien

```bash
# Aller dans le dossier du projet
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# Démarrer Expo
npm start
```

## Commandes de dépannage

### Réinstaller les dépendances
```bash
rm -rf node_modules
npm install
```

### Effacer le cache Expo
```bash
npx expo start --clear
```

### Vérifier la version d'Expo
```bash
npx expo --version
```

### Tuer un processus sur le port 8081 (si le port est occupé)
```bash
# Sur Mac/Linux
lsof -ti:8081 | xargs kill -9

# Sur Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Vérifier les erreurs TypeScript
```bash
npx tsc --noEmit
```

## Commandes de build (pour la production)

### Installer EAS CLI
```bash
npm install -g eas-cli
```

### Se connecter à EAS
```bash
eas login
```

### Configurer le projet pour EAS
```bash
eas build:configure
```

### Build pour Android
```bash
eas build --platform android
```

### Build pour iOS
```bash
eas build --platform ios
```

## Résumé rapide

**Pour démarrer l'application maintenant :**

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm start
```

**Puis :**
1. Scannez le QR code avec Expo Go sur votre téléphone
2. Ou appuyez sur `i` pour iOS, `a` pour Android, `w` pour web
