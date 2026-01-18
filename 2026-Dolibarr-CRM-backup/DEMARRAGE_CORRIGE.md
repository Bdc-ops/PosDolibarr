# ✅ Solution CORRIGÉE pour EMFILE

## 🔍 Problème identifié

Metro utilise **NodeWatcher** au lieu de **Watchman**, même si Watchman est installé. NodeWatcher surveille trop de fichiers et cause l'erreur EMFILE.

## ✅ Corrections FINALES appliquées

1. ✅ **Metro config mis à jour** - Force l'utilisation de watchman
2. ✅ **Variables d'environnement** - `WATCHMAN_DISABLE_NODEWATCHER=1` dans package.json
3. ✅ **Script amélioré** - `start-expo.sh` configure watchman avant démarrage
4. ✅ **Watchman configuré** - `.watchmanconfig` ignore node_modules
5. ✅ **Watchman vérifié** - Installation confirmée

## 🚀 DÉMARRER MAINTENANT (3 méthodes)

### Méthode 1 : Script (RECOMMANDÉ - le plus sûr)

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
./start-expo.sh
```

### Méthode 2 : Commande npm (avec variables)

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm run start:clean
```

### Méthode 3 : Commande directe (si les autres ne marchent pas)

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# Nettoyer watchman d'abord
watchman watch-del-all
watchman shutdown-server

# Puis démarrer avec les variables
WATCHMAN_DISABLE_NODEWATCHER=1 EXPO_NO_METRO_LAZY=1 expo start --clear
```

## 🔧 Si ça ne marche TOUJOURS pas

### Solution de dernier recours : Polling au lieu de watching

Modifiez temporairement `metro.config.js` :

```javascript
config.watcher = {
  useWatchman: false,
  usePolling: true,
  interval: 2000,
};
```

Puis redémarrez.

### Ou réinstallez complètement

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM

# Arrêter tout
pkill -9 -f "expo\|metro\|node"

# Nettoyer watchman
watchman watch-del-all
watchman shutdown-server

# Nettoyer les caches
rm -rf .expo node_modules/.cache .metro .expo-shared

# Réinstaller (optionnel mais recommandé)
rm -rf node_modules
npm install

# Démarrer
./start-expo.sh
```

## 📝 Points clés

- **WATCHMAN_DISABLE_NODEWATCHER=1** est CRUCIAL - force Metro à utiliser watchman
- Le script `start-expo.sh` configure watchman automatiquement
- Watchman est installé et fonctionnel (vérifié)
- Toujours utiliser `--clear` après des changements

## ✅ Vérification

Avant de démarrer, vérifiez :

```bash
# Watchman installé ?
watchman --version

# Limite de fichiers OK ?
ulimit -n

# Watchman propre ?
watchman watch-del-all
```

**Le problème devrait maintenant être résolu !** 🎉
