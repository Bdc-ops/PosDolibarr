#!/usr/bin/env node
/**
 * Script pour générer des icônes et splash screens professionnels
 * Style: Caisse TPV/POS moderne
 */

const fs = require('fs');
const path = require('path');

// Vérifier si canvas est disponible
let canvas, createCanvas, loadImage, registerFont;
try {
  const canvasModule = require('canvas');
  createCanvas = canvasModule.createCanvas;
  loadImage = canvasModule.loadImage;
  registerFont = canvasModule.registerFont;
} catch (e) {
  console.log('⚠️  Le module canvas n\'est pas installé. Installation...');
  console.log('Exécutez: npm install canvas --save-dev');
  process.exit(1);
}

// Configuration des couleurs - Style TPV/POS professionnel
const colors = {
  primary: '#2563eb',      // Bleu principal
  secondary: '#1e40af',    // Bleu foncé
  accent: '#60a5fa',       // Bleu clair
  text: '#ffffff',         // Texte blanc
  background: '#f8fafc',   // Fond clair
  shadow: '#1e3a8a'        // Ombre
};

// Fonction helper pour créer des rectangles arrondis
function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// Fonction pour créer une icône avec design TPV/POS
async function createIcon(size = 1024) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond avec gradient circulaire
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Ombre portée pour profondeur
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = size * 0.02;

  // Design de caisse enregistreuse moderne
  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.6;
  const margin = size * 0.2;

  // Base de la caisse (forme arrondie)
  ctx.fillStyle = colors.accent;
  roundRect(
    ctx,
    centerX - iconSize * 0.4,
    centerY - iconSize * 0.25,
    iconSize * 0.8,
    iconSize * 0.5,
    size * 0.05
  );
  ctx.fill();

  // Écran de la caisse
  ctx.fillStyle = colors.background;
  roundRect(
    ctx,
    centerX - iconSize * 0.35,
    centerY - iconSize * 0.2,
    iconSize * 0.7,
    iconSize * 0.35,
    size * 0.03
  );
  ctx.fill();

  // Lignes d'affichage (simule un écran LCD)
  ctx.fillStyle = colors.primary;
  ctx.font = `bold ${size * 0.12}px Arial`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  // Écran affichant "€"
  ctx.fillText('€', centerX + iconSize * 0.25, centerY - iconSize * 0.05);
  
  // Petites lignes pour simuler un affichage numérique
  const lineY = centerY + iconSize * 0.05;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(
      centerX - iconSize * 0.3 + (i * iconSize * 0.1),
      lineY,
      iconSize * 0.08,
      size * 0.01
    );
  }

  // Symboles de terminal/TPV autour
  ctx.fillStyle = colors.text;
  ctx.globalAlpha = 0.3;
  
  // Coin supérieur gauche - icône scanner
  ctx.beginPath();
  ctx.arc(centerX - iconSize * 0.5, centerY - iconSize * 0.5, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  
  // Coin supérieur droit - icône carte bancaire
  ctx.fillRect(centerX + iconSize * 0.35, centerY - iconSize * 0.5, size * 0.15, size * 0.1);
  
  // Coin inférieur - icône ticket
  roundRect(
    ctx,
    centerX - iconSize * 0.2,
    centerY + iconSize * 0.4,
    iconSize * 0.4,
    size * 0.06,
    size * 0.01
  );
  ctx.fill();

  ctx.globalAlpha = 1.0;

  return canvas;
}

// Fonction pour créer un splash screen pour iPad (2732x2732 optimisé)
async function createSplashScreen(width = 2732, height = 2732) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond avec gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(0.5, colors.secondary);
  gradient.addColorStop(1, colors.primary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Logo central (grande icône)
  const centerX = width / 2;
  const centerY = height / 2;
  const logoSize = width * 0.25;

  // Icône de caisse au centre (version simplifiée)
  ctx.fillStyle = colors.accent;
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = width * 0.02;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = width * 0.01;

  // Base de la caisse
  roundRect(
    ctx,
    centerX - logoSize * 0.4,
    centerY - logoSize * 0.3,
    logoSize * 0.8,
    logoSize * 0.6,
    width * 0.02
  );
  ctx.fill();

  // Écran
  ctx.fillStyle = colors.background;
  roundRect(
    ctx,
    centerX - logoSize * 0.35,
    centerY - logoSize * 0.25,
    logoSize * 0.7,
    logoSize * 0.4,
    width * 0.015
  );
  ctx.fill();

  ctx.shadowBlur = 0;

  // Texte "PosDolibarr" sous l'icône
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${width * 0.08}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Ombre pour le texte
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = width * 0.01;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = width * 0.005;
  
  ctx.fillText('PosDolibarr', centerX, centerY + logoSize * 0.6);
  
  // Sous-titre
  ctx.font = `${width * 0.035}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 0.9;
  ctx.fillText('Terminal de Point de Vente', centerX, centerY + logoSize * 0.8);
  
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;

  // Éléments décoratifs aux coins (discrets)
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = width * 0.003;
  ctx.globalAlpha = 0.2;

  // Coin supérieur gauche
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.1);
  ctx.lineTo(width * 0.2, height * 0.1);
  ctx.moveTo(width * 0.1, height * 0.1);
  ctx.lineTo(width * 0.1, height * 0.2);
  ctx.stroke();

  // Coin supérieur droit
  ctx.beginPath();
  ctx.moveTo(width * 0.9, height * 0.1);
  ctx.lineTo(width * 0.8, height * 0.1);
  ctx.moveTo(width * 0.9, height * 0.1);
  ctx.lineTo(width * 0.9, height * 0.2);
  ctx.stroke();

  // Coin inférieur gauche
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.9);
  ctx.lineTo(width * 0.2, height * 0.9);
  ctx.moveTo(width * 0.1, height * 0.9);
  ctx.lineTo(width * 0.1, height * 0.8);
  ctx.stroke();

  // Coin inférieur droit
  ctx.beginPath();
  ctx.moveTo(width * 0.9, height * 0.9);
  ctx.lineTo(width * 0.8, height * 0.9);
  ctx.moveTo(width * 0.9, height * 0.9);
  ctx.lineTo(width * 0.9, height * 0.8);
  ctx.stroke();

  ctx.globalAlpha = 1.0;

  return canvas;
}

// Fonction principale
async function main() {
  console.log('🎨 Génération des assets TPV/POS...\n');

  const assetsDir = path.join(__dirname);

  try {
    // Générer l'icône 1024x1024
    console.log('📱 Génération de l\'icône (1024x1024)...');
    const iconCanvas = await createIcon(1024);
    const iconBuffer = iconCanvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
    console.log('✅ Icône créée: assets/icon.png\n');

    // Générer le splash screen pour iPad (2732x2732)
    console.log('📱 Génération du splash screen iPad (2732x2732)...');
    const splashCanvas = await createSplashScreen(2732, 2732);
    const splashBuffer = splashCanvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashBuffer);
    console.log('✅ Splash screen créé: assets/splash.png\n');

    console.log('✨ Tous les assets ont été générés avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Les fichiers ont été sauvegardés dans assets/');
    console.log('2. Expo utilisera automatiquement ces fichiers');
    console.log('3. Pour iOS/Android, utilisez: npx expo prebuild');
    console.log('4. Pour générer toutes les tailles: npx expo-asset-generator\n');

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    process.exit(1);
  }
}

// Exécuter
if (require.main === module) {
  main();
}

module.exports = { createIcon, createSplashScreen };
