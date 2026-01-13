#!/bin/bash

# Script pour configurer rapidement une nouvelle icône
# Usage: ./setup_new_icon.sh [fichier_source ou URL]

set -e

SOURCE="$1"
ASSETS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$ASSETS_DIR/.." && pwd)"

echo "🎨 Configuration de la nouvelle icône"
echo ""

# Si aucune source n'est fournie, demander
if [ -z "$SOURCE" ]; then
    echo "📋 Options disponibles:"
    echo "   1. Fichier local (ex: ~/Downloads/mon-icon.png)"
    echo "   2. URL (ex: https://example.com/icon.png)"
    echo ""
    read -p "Entrez le chemin du fichier ou l'URL: " SOURCE
fi

# Créer un fichier temporaire si c'est une URL
TEMP_FILE=""
if [[ "$SOURCE" =~ ^https?:// ]]; then
    echo "📥 Téléchargement depuis l'URL..."
    TEMP_FILE="$ASSETS_DIR/icon-temp-$(date +%s).png"
    curl -L -o "$TEMP_FILE" "$SOURCE" || {
        echo "❌ Erreur lors du téléchargement"
        exit 1
    }
    SOURCE_FILE="$TEMP_FILE"
else
    # Vérifier si le fichier existe
    if [ ! -f "$SOURCE" ]; then
        echo "❌ Fichier non trouvé: $SOURCE"
        exit 1
    fi
    SOURCE_FILE="$SOURCE"
fi

echo "✅ Fichier source trouvé: $SOURCE_FILE"
echo ""

# Vérifier si expo-asset-generator est disponible
if command -v npx &> /dev/null; then
    echo "🚀 Utilisation de expo-asset-generator..."
    cd "$PROJECT_ROOT"
    npx expo-asset-generator "$SOURCE_FILE" --output-dir assets || {
        echo "⚠️  expo-asset-generator non disponible, utilisation de ImageMagick..."
        cd "$ASSETS_DIR"
        if command -v convert &> /dev/null; then
            ./generate_icon_sizes.sh "$SOURCE_FILE"
        else
            echo "❌ Aucun outil de génération disponible"
            echo "📦 Installez ImageMagick: brew install imagemagick"
            exit 1
        fi
    }
else
    echo "⚠️  npx non disponible, utilisation de ImageMagick..."
    cd "$ASSETS_DIR"
    if command -v convert &> /dev/null; then
        ./generate_icon_sizes.sh "$SOURCE_FILE"
    else
        echo "❌ Aucun outil de génération disponible"
        echo "📦 Installez ImageMagick: brew install imagemagick"
        exit 1
    fi
fi

# Nettoyer le fichier temporaire
if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
fi

echo ""
echo "✅ Icône configurée avec succès !"
echo ""
echo "🔄 Pour voir les changements:"
echo "   cd $PROJECT_ROOT"
echo "   npx expo start --clear"
echo ""
echo "📱 Les fichiers suivants ont été mis à jour:"
echo "   - assets/icon.png"
echo "   - assets/adaptive-icon.png"
echo "   - assets/splash.png"
