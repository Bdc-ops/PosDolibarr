// Script Node.js pour créer les assets par défaut
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Créer le dossier assets s'il n'existe pas
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Fonction pour créer une image PNG simple (SVG converti en base64 puis PNG minimal)
function createPNG(width, height, color, text = '') {
  // Créer un PNG minimal avec un rectangle coloré
  // Format PNG minimal : header + IHDR + IDAT + IEND
  const createSimplePNG = (w, h, r, g, b) => {
    // PNG signature
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // Pour simplifier, on va créer un fichier SVG qui sera ignoré par Expo
    // mais on va plutôt créer un fichier texte qui indique qu'il faut créer les vraies images
    return null;
  };
  
  return createSimplePNG(width, height, ...hexToRgb(color));
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [33, 150, 243]; // #2196F3 par défaut
}

// Créer des fichiers placeholder avec des instructions
const createPlaceholder = (filename, width, height, description) => {
  const filePath = path.join(assetsDir, filename);
  if (!fs.existsSync(filePath)) {
    // Créer un fichier SVG simple qui fonctionnera comme placeholder
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#2196F3"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${Math.min(width, height) / 4}" fill="white" text-anchor="middle" dominant-baseline="middle">${description}</text>
</svg>`;
    
    // Pour Expo, on a besoin de PNG, donc créons un fichier README à la place
    const readmeContent = `# ${filename}

Dimensions requises: ${width}x${height}
Couleur de fond: #2196F3

Ce fichier est un placeholder. 
Pour créer la vraie image, utilisez un outil comme:
- Figma, Sketch, ou Photoshop
- Ou générez-la en ligne: https://www.appicon.co/

Pour l'instant, Expo utilisera une icône par défaut.
`;
    
    fs.writeFileSync(filePath.replace('.png', '.txt'), readmeContent);
    console.log(`✅ Placeholder créé: ${filename}.txt`);
  }
};

console.log('📦 Création des placeholders pour les assets...\n');

createPlaceholder('icon.png', 1024, 1024, 'Icon');
createPlaceholder('splash.png', 1242, 2436, 'Splash');
createPlaceholder('adaptive-icon.png', 1024, 1024, 'Adaptive Icon');
createPlaceholder('favicon.png', 48, 48, 'Favicon');

console.log('\n✅ Placeholders créés!');
console.log('\n⚠️  Note: Expo utilisera des icônes par défaut jusqu\'à ce que vous créiez les vraies images.');
console.log('   Les fichiers .txt contiennent les instructions pour créer les vraies images.\n');
