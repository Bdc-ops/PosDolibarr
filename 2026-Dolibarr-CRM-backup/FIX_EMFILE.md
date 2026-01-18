# 🔧 Correction de l'erreur "EMFILE: too many open files"

## ✅ Corrections appliquées

### 1. Configuration Metro optimisée
- Fichier `metro.config.js` créé pour réduire les fichiers surveillés
- Configuration Watchman ajoutée (`.watchmanconfig`)

### 2. Limite de fichiers augmentée
- Script `fix-limits.sh` créé et exécuté
- Configuration ajoutée à `~/.zshrc`

### 3. Cache nettoyé
- Cache Expo et Metro supprimé

## 🚀 Pour redémarrer maintenant

### Option 1 : Redémarrer le terminal (recommandé)

1. **Fermez votre terminal actuel**
2. **Ouvrez un nouveau terminal**
3. **Lancez Expo** :
```bash
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm start
```

### Option 2 : Appliquer les changements sans redémarrer

```bash
source ~/.zshrc
cd /Users/fahd/myApp/2026-Dolibarr-CRM
npm start
```

## 📦 Installation de Watchman (recommandé)

Watchman améliore les performances de Metro bundler :

```bash
# Avec Homebrew
brew install watchman

# Puis redémarrer Expo
npm start
```

## 🔄 Si le problème persiste

### Solution permanente (macOS)

```bash
# Augmenter les limites système (nécessite sudo)
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

# Créer un fichier de configuration permanent
echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
echo "kern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf
```

### Alternative : Utiliser watchman

Si watchman n'est pas installé, installez-le :
```bash
brew install watchman
```

Puis redémarrez Expo.

## ✅ Vérification

Vérifiez que la limite est bien augmentée :
```bash
ulimit -n
```

Vous devriez voir `4096` ou plus.

## 📝 Notes

- La configuration a été ajoutée à `~/.zshrc` pour être permanente
- Le cache Expo a été nettoyé
- Metro config optimisé pour surveiller moins de fichiers
