# 🎨 Guide pour mettre à jour l'icône de l'application

## 📋 Étapes

### 1. Sauvegarder votre nouvelle icône
- Téléchargez ou sauvegardez votre nouvelle icône (format PNG recommandé)
- Nommez-la `icon-source.png` et placez-la dans le dossier `assets/`

### 2. Générer toutes les tailles nécessaires
Exécutez le script de génération :

```bash
cd assets
./generate_icon_sizes.sh
```

Ou utilisez l'outil en ligne d'Expo :
```bash
npx expo-asset-generator icon-source.png
```

### 3. Tailles requises pour Expo

- **icon.png** : 1024x1024 px (icône principale)
- **adaptive-icon.png** : 1024x1024 px (Android adaptive icon)
- **splash.png** : 1284x2778 px (écran de démarrage)

### 4. Vérifier la configuration

L'icône est déjà configurée dans `app.json` :
- `icon`: `./assets/icon.png`
- `adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png`
- `splash.image`: `./assets/splash.png`

### 5. Tester

```bash
npx expo start --clear
```

## 🛠️ Alternative : Utiliser une image en ligne

Si votre icône est disponible en ligne, vous pouvez utiliser :

```bash
curl -o assets/icon-source.png "URL_DE_VOTRE_ICONE"
```
