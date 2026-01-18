# 🔧 Correction de l'erreur AppEntry

## Problème

Erreur : `Unable to resolve module ./node_modules/expo/AppEntry`

## ✅ Solutions appliquées

1. ✅ **Réinstallation complète** des node_modules
2. ✅ **Cache Metro nettoyé** - Tous les caches supprimés
3. ✅ **Watchman nettoyé** - Watchman reset
4. ✅ **Vérification AppEntry.js** - Le fichier existe bien

## 🚀 Pour résoudre définitivement

### Étape 1 : Nettoyer complètement

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# Arrêter tous les processus
pkill -9 -f "expo\|metro\|node"

# Nettoyer les caches
rm -rf .expo node_modules/.cache .metro .expo-shared .expo

# Nettoyer watchman
watchman watch-del-all
watchman shutdown-server
```

### Étape 2 : Réinstaller (si nécessaire)

```bash
# Si le problème persiste, réinstaller
rm -rf node_modules
npm install
```

### Étape 3 : Redémarrer avec cache clear

```bash
# Démarrer avec nettoyage du cache
npm run start:clean

# Ou avec le script
./start-expo.sh
```

## 🔍 Vérifications

Le fichier `AppEntry.js` doit exister :
```bash
ls -la node_modules/expo/AppEntry.js
```

Il doit contenir :
```javascript
import { registerRootComponent } from 'expo';
import App from '../../App';
registerRootComponent(App);
```

## ⚠️ Si le problème persiste

### Solution alternative : Créer un index.js

Si Expo ne trouve toujours pas AppEntry, créez un fichier `index.js` à la racine :

```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

Puis modifiez `package.json` :
```json
{
  "main": "index.js"
}
```

## 📝 Notes

- Le fichier `AppEntry.js` existe bien dans `node_modules/expo/`
- Le problème vient souvent du cache Metro
- Toujours utiliser `--clear` après des changements de dépendances
