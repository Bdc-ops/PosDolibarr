#!/bin/bash

# Script pour générer toutes les tailles d'icônes nécessaires depuis une source
# Usage: ./generate_icon_sizes.sh [fichier_source]

SOURCE_FILE="${1:-icon-source.png}"
OUTPUT_DIR="."

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé."
    echo "📦 Installation:"
    echo "   macOS: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    echo ""
    echo "💡 Alternative: Utilisez npx expo-asset-generator"
    exit 1
fi

# Vérifier si le fichier source existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Fichier source non trouvé: $SOURCE_FILE"
    echo "📝 Placez votre icône source dans ce dossier et nommez-la: $SOURCE_FILE"
    exit 1
fi

echo "🎨 Génération des icônes depuis: $SOURCE_FILE"
echo ""

# Générer icon.png (1024x1024)
echo "📱 Génération de icon.png (1024x1024)..."
convert "$SOURCE_FILE" -resize 1024x1024 -background none -gravity center -extent 1024x1024 "$OUTPUT_DIR/icon.png"

# Générer adaptive-icon.png (1024x1024)
echo "🤖 Génération de adaptive-icon.png (1024x1024)..."
convert "$SOURCE_FILE" -resize 1024x1024 -background none -gravity center -extent 1024x1024 "$OUTPUT_DIR/adaptive-icon.png"

# Générer splash.png (1284x2778) - avec fond
echo "🌊 Génération de splash.png (1284x2778)..."
convert "$SOURCE_FILE" -resize 1024x1024 -background "#004E89" -gravity center -extent 1284x2778 "$OUTPUT_DIR/splash.png"

echo ""
echo "✅ Génération terminée !"
echo ""
echo "📋 Fichiers générés:"
echo "   - icon.png (1024x1024)"
echo "   - adaptive-icon.png (1024x1024)"
echo "   - splash.png (1284x2778)"
echo ""
echo "🔄 Redémarrez Expo avec: npx expo start --clear"
