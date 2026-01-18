# 🔧 Solution définitive pour EMFILE

## Problème identifié

Metro utilise NodeWatcher au lieu de Watchman, même si Watchman est installé. Cela cause l'erreur "EMFILE: too many open files".

## ✅ Corrections appliquées

1. **Forcer l'utilisation de Watchman** - Variable `WATCHMAN_DISABLE_NODEWATCHER=1`
2. **Metro config optimisé** - Configuration pour utiliser watchman uniquement
3. **Watchman configuré** - `.watchmanconfig` avec ignore_dirs complet
4. **Variables d'environnement** - `.env` créé avec les bonnes variables
5. **Script amélioré** - `start-expo.sh` configure watchman avant de démarrer

## 🚀 Pour démarrer MAINTENANT

### Méthode 1 : Script (RECOMMANDÉ)

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
./start-expo.sh
```

### Méthode 2 : Commande directe

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
WATCHMAN_DISABLE_NODEWATCHER=1 EXPO_NO_METRO_LAZY=1 expo start --clear
```

### Méthode 3 : Avec npm

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm run start:clean
```

## 🔍 Vérifications avant démarrage

```bash
# Vérifier watchman
watchman --version

# Nettoyer watchman
watchman watch-del-all
watchman shutdown-server

# Vérifier la limite
ulimit -n
```

## ⚠️ Si le problème persiste encore

### Solution radicale : Réinstaller avec watchman

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# Arrêter tous les processus
pkill -9 -f "expo\|metro\|node"

# Nettoyer watchman
watchman watch-del-all
watchman shutdown-server

# Nettoyer les caches
rm -rf .expo node_modules/.cache .metro .expo-shared

# Réinstaller (optionnel)
# rm -rf node_modules
# npm install

# Démarrer
./start-expo.sh
```

### Alternative : Utiliser polling au lieu de watching

Si watchman ne fonctionne toujours pas, modifiez `metro.config.js` :

```javascript
config.watcher = {
  useWatchman: false,
  usePolling: true,
  interval: 1000,
};
```

## 📝 Notes importantes

- **WATCHMAN_DISABLE_NODEWATCHER=1** est CRUCIAL - force Metro à utiliser watchman
- Le script `start-expo.sh` configure watchman automatiquement
- Toujours utiliser `--clear` après des changements de config
- Watchman doit être installé : `brew install watchman`

## 🎯 La clé du problème

Metro utilise par défaut NodeWatcher qui surveille trop de fichiers. La variable `WATCHMAN_DISABLE_NODEWATCHER=1` force l'utilisation de Watchman qui est beaucoup plus efficace.
