# ⚡ Mise à jour rapide de l'icône

## Option 1 : Depuis une image locale

1. **Placez votre nouvelle icône** dans le dossier `assets/` avec le nom `icon-source.png`
2. **Générez les tailles** :
   ```bash
   cd assets
   ./generate_icon_sizes.sh
   ```
3. **Redémarrez Expo** :
   ```bash
   npx expo start --clear
   ```

## Option 2 : Depuis une URL

```bash
cd assets
curl -o icon-source.png "URL_DE_VOTRE_ICONE"
./generate_icon_sizes.sh
```

## Option 3 : Utiliser Expo Asset Generator (recommandé)

```bash
npx expo-asset-generator assets/icon-source.png
```

## Option 4 : Remplacement manuel

Si vous avez déjà les fichiers aux bonnes tailles :

1. Remplacez `assets/icon.png` (1024x1024)
2. Remplacez `assets/adaptive-icon.png` (1024x1024)
3. Remplacez `assets/splash.png` (1284x2778) - avec fond #004E89

## 📐 Tailles requises

- **icon.png**: 1024x1024 px (carré)
- **adaptive-icon.png**: 1024x1024 px (carré, Android)
- **splash.png**: 1284x2778 px (portrait, avec fond)

## ✅ Vérification

Après remplacement, vérifiez que `app.json` pointe vers les bons fichiers :
- `icon`: `./assets/icon.png` ✅
- `adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png` ✅
- `splash.image`: `./assets/splash.png` ✅
