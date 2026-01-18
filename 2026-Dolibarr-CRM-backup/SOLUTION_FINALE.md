# 🔧 Solution FINALE pour AppEntry

## Problème identifié

Metro ne trouve pas `node_modules/expo/AppEntry.js` malgré que le fichier existe.

## ✅ Solution définitive

### Option 1 : Utiliser expo/AppEntry.js (recommandé)

Le `package.json` doit avoir :
```json
{
  "main": "expo/AppEntry.js"
}
```

**IMPORTANT** : Expo résout automatiquement `expo/AppEntry.js` vers `node_modules/expo/AppEntry.js`

### Option 2 : Créer index.js (alternative)

Si Option 1 ne fonctionne pas, créer `index.js` à la racine :

```javascript
import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

Et dans `package.json` :
```json
{
  "main": "index.js"
}
```

## 🚀 Pour résoudre MAINTENANT

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

### Étape 2 : Vérifier la configuration

```bash
# Vérifier que AppEntry.js existe
ls -la node_modules/expo/AppEntry.js

# Vérifier package.json
cat package.json | grep '"main"'
```

### Étape 3 : Réinstaller si nécessaire

```bash
# Si AppEntry.js n'existe pas
rm -rf node_modules
npm install
```

### Étape 4 : Démarrer avec cache clear

```bash
npm run start:clean
```

## 🔍 Vérifications

1. **AppEntry.js existe** :
```bash
ls -la node_modules/expo/AppEntry.js
```

2. **Contenu correct** :
```bash
cat node_modules/expo/AppEntry.js
```

Doit contenir :
```javascript
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from '../../App';
registerRootComponent(App);
```

3. **package.json correct** :
```json
{
  "main": "expo/AppEntry.js"
}
```

## ⚠️ Si ça ne marche TOUJOURS pas

### Solution de dernier recours

1. **Créer index.js** :
```javascript
import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

2. **Modifier package.json** :
```json
{
  "main": "index.js"
}
```

3. **Redémarrer** :
```bash
rm -rf .expo node_modules/.cache .metro
npm run start:clean
```

## 📝 Notes importantes

- Expo résout `expo/AppEntry.js` automatiquement
- Ne jamais utiliser `node_modules/expo/AppEntry.js` directement
- Toujours nettoyer le cache après changement de `main`
- Watchman doit être installé et fonctionnel
