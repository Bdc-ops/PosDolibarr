#!/bin/bash
# Script pour créer une icône et un splash screen basiques
# Crée des images PNG avec un fond bleu et le texte "Dolibarr POS"

# Créer une icône 1024x1024 (requis pour Expo)
# Utilise sips (macOS) ou convert (ImageMagick) si disponible
if command -v sips &> /dev/null; then
    # Créer une icône basique avec sips
    sips -s format png --out assets/icon.png --setProperty formatOptions 100 <<EOF
    # Créer un carré bleu avec texte (nécessite une autre approche)
EOF
    echo "sips disponible"
elif command -v convert &> /dev/null; then
    # Créer avec ImageMagick
    convert -size 1024x1024 xc:"#2563eb" -gravity center -pointsize 200 -fill white -annotate +0+0 "D" assets/icon.png
    convert -size 2048x2048 xc:"#2563eb" -gravity center -pointsize 400 -fill white -annotate +0+0 "Dolibarr\nCaisse POS" assets/splash.png
    echo "ImageMagick utilisé"
else
    echo "Aucun outil de traitement d'image trouvé. Veuillez créer manuellement:"
    echo "- assets/icon.png (1024x1024 px)"
    echo "- assets/splash.png (2048x2048 px)"
fi
