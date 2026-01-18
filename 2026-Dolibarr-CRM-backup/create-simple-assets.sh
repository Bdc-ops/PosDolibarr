#!/bin/bash
# Créer des images PNG simples avec ImageMagick ou Python

cd "$(dirname "$0")/assets"

echo "🎨 Création des assets par défaut..."

# Vérifier ImageMagick
if command -v convert &> /dev/null; then
    echo "✅ Utilisation d'ImageMagick..."
    
    # Icon 1024x1024
    convert -size 1024x1024 xc:'#2196F3' \
        -fill white -gravity center \
        -pointsize 300 -font Arial-Bold \
        -annotate +0+0 'D' \
        icon.png 2>/dev/null && echo "✅ icon.png créé"
    
    # Splash 1242x2436
    convert -size 1242x2436 xc:'#2196F3' \
        -fill white -gravity center \
        -pointsize 100 -font Arial \
        -annotate +0+0 'Dolibarr\nCRM' \
        splash.png 2>/dev/null && echo "✅ splash.png créé"
    
    # Adaptive icon (copie de icon)
    cp icon.png adaptive-icon.png 2>/dev/null && echo "✅ adaptive-icon.png créé"
    
    # Favicon 48x48
    convert icon.png -resize 48x48 favicon.png 2>/dev/null && echo "✅ favicon.png créé"
    
elif command -v python3 &> /dev/null; then
    echo "✅ Utilisation de Python/PIL..."
    python3 << 'PYTHON'
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir('assets')

# Icon 1024x1024
icon = Image.new('RGB', (1024, 1024), color='#2196F3')
draw = ImageDraw.Draw(icon)
# Dessiner un D
draw.ellipse([200, 200, 824, 824], fill='white', outline='white', width=20)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 400)
except:
    font = ImageFont.load_default()
draw.text((400, 300), 'D', fill='#2196F3', font=font)
icon.save('icon.png')
print('✅ icon.png créé')

# Splash 1242x2436
splash = Image.new('RGB', (1242, 2436), color='#2196F3')
draw = ImageDraw.Draw(splash)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 120)
except:
    font = ImageFont.load_default()
draw.text((621, 1200), 'Dolibarr CRM', fill='white', font=font, anchor='mm')
splash.save('splash.png')
print('✅ splash.png créé')

# Adaptive icon
icon.save('adaptive-icon.png')
print('✅ adaptive-icon.png créé')

# Favicon 48x48
favicon = icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save('favicon.png')
print('✅ favicon.png créé')
PYTHON

else
    echo "⚠️  ImageMagick et Python/PIL non disponibles"
    echo "   Création de fichiers placeholder..."
    
    # Créer des fichiers texte comme placeholder
    cat > icon.png.txt << 'EOF'
Placeholder pour icon.png
Dimensions: 1024x1024
Couleur: #2196F3
EOF
    
    cat > splash.png.txt << 'EOF'
Placeholder pour splash.png  
Dimensions: 1242x2436
Couleur: #2196F3
EOF
    
    cp icon.png.txt adaptive-icon.png.txt
    echo "48x48" > favicon.png.txt
    
    echo "✅ Fichiers placeholder créés (.txt)"
    echo "⚠️  Expo utilisera des icônes par défaut"
fi

echo ""
echo "✅ Terminé! Les assets sont prêts."
