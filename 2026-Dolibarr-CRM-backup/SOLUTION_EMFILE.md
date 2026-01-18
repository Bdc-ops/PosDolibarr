# 🔧 Solution définitive pour EMFILE

## ✅ Corrections appliquées

1. **Watchman installé** - Essentiel pour Expo/Metro
2. **Metro config optimisé** - Réduction des fichiers surveillés
3. **Variables d'environnement** - EXPO_NO_METRO_LAZY activé
4. **Script de démarrage** - `start-expo.sh` créé
5. **Cache nettoyé** - Tous les caches supprimés

## 🚀 Pour démarrer maintenant

### Méthode 1 : Utiliser le script (RECOMMANDÉ)

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
./start-expo.sh
```

### Méthode 2 : Commande manuelle

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
ulimit -n 4096
EXPO_NO_METRO_LAZY=1 expo start --clear
```

### Méthode 3 : Avec npm

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm run start:clean
```

## 📦 Installation de Watchman (si pas encore fait)

```bash
brew install watchman
```

Puis redémarrer Expo.

## 🔍 Vérifications

### Vérifier watchman
```bash
watchman --version
```

### Vérifier la limite de fichiers
```bash
ulimit -n
```

### Nettoyer watchman si nécessaire
```bash
watchman watch-del-all
```

## ⚠️ Si le problème persiste

### Solution radicale : Réinstaller node_modules

```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
rm -rf node_modules
npm install
./start-expo.sh
```

### Vérifier les processus qui consomment des fichiers

```bash
lsof | grep -i "node\|expo" | wc -l
```

Si le nombre est très élevé (>1000), fermez d'autres applications Node.js.

## 📝 Notes importantes

- **Watchman est OBLIGATOIRE** pour Expo sur macOS
- La variable `EXPO_NO_METRO_LAZY=1` réduit la charge
- Le script `start-expo.sh` configure tout automatiquement
- Toujours utiliser `--clear` après des changements de config
