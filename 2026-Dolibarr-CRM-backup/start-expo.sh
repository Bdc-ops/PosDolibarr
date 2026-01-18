#!/bin/bash
# Script pour démarrer Expo avec les bonnes configurations

echo "🔧 Configuration de l'environnement..."

# Augmenter la limite de fichiers
ulimit -n 4096

# Nettoyer les caches
echo "🧹 Nettoyage des caches..."
rm -rf .expo node_modules/.cache .metro .expo-shared 2>/dev/null

# Vérifier et configurer watchman
if command -v watchman &> /dev/null; then
    echo "✅ Watchman installé"
    echo "🧹 Nettoyage de watchman..."
    watchman watch-del-all 2>/dev/null || true
    watchman shutdown-server 2>/dev/null || true
    sleep 1
    echo "📁 Configuration du watch sur le projet..."
    watchman watch-project . > /dev/null 2>&1 || true
else
    echo "⚠️  Watchman non installé - installation recommandée:"
    echo "   brew install watchman"
    exit 1
fi

# Variables d'environnement pour forcer watchman
export EXPO_NO_METRO_LAZY=1
export WATCHMAN_DISABLE_NODEWATCHER=1
export CI=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Démarrer Expo avec les variables d'environnement optimisées
echo "🚀 Démarrage d'Expo..."
echo ""
echo "Limite de fichiers: $(ulimit -n)"
echo "Watchman: $(watchman --version 2>/dev/null || echo 'non disponible')"
echo ""

expo start --clear
