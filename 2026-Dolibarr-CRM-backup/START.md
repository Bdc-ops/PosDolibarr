# 🚀 Lancer l'application avec Expo

## Installation et démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Installer Expo CLI globalement (si ce n'est pas déjà fait)

```bash
npm install -g expo-cli
```

ou utilisez npx (recommandé) :

```bash
npx expo start
```

### 3. Lancer l'application

#### Option A : Démarrer avec Expo Go (recommandé pour le développement)

```bash
npm start
```

ou

```bash
npx expo start
```

Cela va :
- Démarrer le serveur de développement
- Afficher un QR code dans le terminal
- Ouvrir Expo DevTools dans votre navigateur

#### Option B : Lancer sur un simulateur/émulateur

**Pour iOS (nécessite Xcode sur Mac) :**
```bash
npm run ios
```

**Pour Android (nécessite Android Studio) :**
```bash
npm run android
```

**Pour le web :**
```bash
npm run web
```

### 4. Tester sur votre téléphone

1. **Installer Expo Go** :
   - iOS : [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android : [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scanner le QR code** :
   - iOS : Ouvrez l'appareil photo et scannez le QR code
   - Android : Ouvrez Expo Go et scannez le QR code

3. **Ou utiliser le tunnel** :
   - Appuyez sur `s` dans le terminal pour ouvrir les options
   - Choisissez "Send link via email" ou "Share"

### Commandes utiles dans le terminal Expo

Une fois que `expo start` est lancé, vous pouvez utiliser :

- `a` - Ouvrir sur Android
- `i` - Ouvrir sur iOS  
- `w` - Ouvrir sur le web
- `r` - Recharger l'application
- `m` - Basculer le menu de développement
- `s` - Envoyer le lien par email/SMS
- `c` - Effacer le cache
- `q` - Quitter

### Résolution de problèmes

#### Erreur : "Cannot find module 'expo'"

```bash
npm install
```

#### Erreur : "Assets not found"

Créez des fichiers placeholder dans le dossier `assets/` :
- `icon.png` (1024x1024px)
- `splash.png` (1242x2436px)
- `adaptive-icon.png` (1024x1024px)
- `favicon.png` (48x48px)

Pour l'instant, vous pouvez utiliser des images temporaires ou laisser les fichiers vides (l'app fonctionnera mais sans icônes personnalisées).

#### L'application ne se connecte pas au serveur

- Vérifiez que vous êtes sur le même réseau WiFi que votre ordinateur
- Ou utilisez le mode tunnel : appuyez sur `s` puis choisissez "Tunnel"

#### Erreur de port déjà utilisé

```bash
# Tuer le processus sur le port 8081
lsof -ti:8081 | xargs kill -9

# Relancer
npm start
```

### Mode développement vs production

**Développement** (actuel) :
- Hot reload activé
- Erreurs visibles dans l'app
- Connexion au serveur de développement

**Production** :
- Voir `DEPLOYMENT.md` pour créer un build de production

### Prochaines étapes

1. ✅ Installer les dépendances : `npm install`
2. ✅ Lancer l'app : `npm start`
3. ✅ Scanner le QR code avec Expo Go
4. ✅ Se connecter avec vos identifiants Dolibarr
5. ✅ Tester les fonctionnalités

Bon développement ! 🎉
