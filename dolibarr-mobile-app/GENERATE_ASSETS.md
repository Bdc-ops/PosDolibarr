# 🎨 Générer les Assets Manquants

## Problème
L'application nécessite 3 fichiers d'assets qui sont actuellement manquants :
- `./assets/icon.png` (1024x1024)
- `./assets/splash.png` (1284x2778)
- `./assets/adaptive-icon.png` (1024x1024)

## 🚀 Solution Rapide (5 minutes)

### Option A : Utiliser un générateur en ligne (Recommandé)

1. **Allez sur** : https://www.appicon.co/

2. **Uploadez une image** :
   - Logo de votre entreprise
   - Ou créez un logo simple avec Canva : https://canva.com

3. **Téléchargez le pack** et extrayez :
   - `icon.png` → Copiez dans `./assets/icon.png`
   - `adaptive-icon.png` → Copiez dans `./assets/adaptive-icon.png`

4. **Pour le splash screen** :
   - Allez sur : https://hotpot.ai/splash-screen-generator
   - Ou créez manuellement (1284x2778 px, fond bleu #004E89, logo centré)

### Option B : Créer manuellement avec Figma/Canva

#### Icon.png (1024x1024)
```
- Taille : 1024 x 1024 pixels
- Format : PNG avec transparence
- Contenu : Logo "iSales" + texte "Dolibarr"
- Couleurs : Bleu #004E89 + Blanc
- Padding : 10% sur les bords
```

#### Splash.png (1284x2778)
```
- Taille : 1284 x 2778 pixels
- Format : PNG
- Fond : Couleur unie #004E89 (bleu)
- Logo : Centré, taille ~400x400px
- Texte : "iSales Dolibarr" en dessous
```

#### Adaptive-icon.png (1024x1024)
```
- Taille : 1024 x 1024 pixels
- Format : PNG avec transparence
- Zone de sécurité : Cercle de 66% (le reste peut être coupé sur Android)
- Contenu : Logo centré dans le cercle
```

### Option C : Assets temporaires pour développement

**Créez des placeholders rapidement avec ImageMagick** :

```bash
# Installer ImageMagick (si pas déjà installé)
brew install imagemagick  # macOS
# ou
sudo apt install imagemagick  # Linux

# Créer les assets temporaires
cd /Users/fahd/myApp/dolibarr-mobile-app/dolibarr-mobile-app/assets

# Icon.png (1024x1024, fond bleu avec texte)
convert -size 1024x1024 xc:'#004E89' \
  -gravity center \
  -pointsize 100 -fill white -annotate +0+0 'iSales\nDolibarr' \
  icon.png

# Splash.png (1284x2778, fond bleu avec texte)
convert -size 1284x2778 xc:'#004E89' \
  -gravity center \
  -pointsize 120 -fill white -annotate +0+0 'iSales\nDolibarr' \
  splash.png

# Adaptive-icon.png (copie de icon.png pour le dev)
cp icon.png adaptive-icon.png
```

### Option D : Télécharger un template

**Téléchargez ce template Figma gratuit** :
https://www.figma.com/community/file/1234567890/app-icon-template

Ou utilisez ce template Canva :
https://www.canva.com/templates/EAEniJF2kZQ-app-icon/

## 🔧 Création Rapide avec Python (si vous avez Pillow)

Créez ce fichier `generate_assets.py` :

```python
from PIL import Image, ImageDraw, ImageFont

def create_icon(size=(1024, 1024), output="icon.png"):
    img = Image.new('RGB', size, color='#004E89')
    draw = ImageDraw.Draw(img)
    
    # Texte "iS" (iSales)
    try:
        font = ImageFont.truetype("Arial.ttf", 300)
    except:
        font = ImageFont.load_default()
    
    text = "iS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    draw.text(position, text, fill='white', font=font)
    
    img.save(output)
    print(f"✅ Créé: {output}")

def create_splash(size=(1284, 2778), output="splash.png"):
    img = Image.new('RGB', size, color='#004E89')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("Arial.ttf", 200)
    except:
        font = ImageFont.load_default()
    
    text = "iSales\nDolibarr"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    draw.multiline_text(position, text, fill='white', font=font, align='center')
    
    img.save(output)
    print(f"✅ Créé: {output}")

if __name__ == "__main__":
    import os
    os.chdir("./assets")
    
    create_icon(output="icon.png")
    create_splash(output="splash.png")
    create_icon(output="adaptive-icon.png")  # Même que icon pour le dev
    
    print("\n🎉 Assets créés avec succès !")
    print("📁 Emplacement: ./assets/")
```

**Exécutez** :
```bash
pip install Pillow
python generate_assets.py
```

## ✅ Vérification

Après avoir créé les assets, vérifiez qu'ils existent :

```bash
ls -lh assets/
# Vous devriez voir :
# icon.png (1024x1024)
# splash.png (1284x2778)
# adaptive-icon.png (1024x1024)
```

## 🔄 Relancer l'application

```bash
# Clear cache et relancer
npx expo start --clear
```

## 🎨 Recommandations Design

Pour une app professionnelle, créez des assets de qualité avec :
- **Logo vectoriel** (SVG) converti en PNG
- **Couleurs de marque** cohérentes
- **Design minimaliste** et moderne
- **Contraste élevé** pour la lisibilité

---

**Note** : Les assets créés automatiquement sont des placeholders. Pour la publication sur les stores, utilisez des assets professionnels créés par un designer.

