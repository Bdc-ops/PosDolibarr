# Instructions pour sauvegarder les images générées

Vous avez généré deux images avec Banana. Voici comment les sauvegarder :

## Étape 1 : Télécharger les images depuis Banana

1. Dans Banana, cliquez sur chaque image générée
2. Téléchargez-les (bouton de téléchargement)
3. Notez où elles sont sauvegardées (généralement dans Téléchargements)

## Étape 2 : Renommer et déplacer les images

### Pour l'ICÔNE :
- L'image avec le "D" stylé et le barcode → **icon.png**
- Taille attendue : 1024x1024 pixels

### Pour le SPLASH SCREEN :
- L'image avec le "D" en haut et "Dolibarr Caisse POS" → **splash.png**
- Taille attendue : 2048x2048 pixels

## Étape 3 : Placer dans le dossier assets

Déplacez ou copiez les images dans :
```
/Users/fahd/myApp/iKaissDolibarr/assets/
```

Avec les noms exacts :
- `assets/icon.png`
- `assets/splash.png`

## Vérification

Après avoir placé les fichiers, exécutez :
```bash
cd /Users/fahd/myApp/iKaissDolibarr/assets
ls -lh *.png
```

Vous devriez voir :
- icon.png (environ 50-200 KB)
- splash.png (environ 100-500 KB)

## Alternative : Utiliser le Finder

1. Ouvrez Finder
2. Naviguez vers `/Users/fahd/myApp/iKaissDolibarr/assets`
3. Glissez-déposez les images téléchargées
4. Renommez-les en `icon.png` et `splash.png`
