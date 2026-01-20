#!/usr/bin/env node
/**
 * Script pour mettre à jour les assets iOS avec les nouvelles icônes et splash
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = '/Users/fahd/myApp/PosDolibarr/.cursor/debug.log';

function logEntry(action, data, hypothesisId) {
  const entry = {
    timestamp: Date.now(),
    location: 'update-ios-assets.js',
    message: action,
    data: data,
    sessionId: 'debug-session',
    runId: 'fix',
    hypothesisId: hypothesisId
  };
  
  // Log to file
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  
  // Also log to console
  console.log(`[${action}] ${JSON.stringify(data)}`);
}

// Hypothèses
// H1: Les assets ne sont pas copiés dans le bundle iOS
// H2: Le cache iOS contient les anciennes images
// H3: Les assets iOS natifs (Images.xcassets) ne sont pas à jour

const assetsDir = path.join(__dirname, '../assets');
// Le nom du dossier peut varier selon le slug du projet
const iosDir = path.join(__dirname, '../ios');
const iosAppDir = fs.existsSync(path.join(iosDir, 'PosDolibarr'))
  ? path.join(iosDir, 'PosDolibarr')
  : path.join(iosDir, 'DolibarrPOS');
const iosAssetsDir = path.join(iosAppDir, 'Images.xcassets/AppIcon.appiconset');

// Vérifier que les fichiers source existent
const iconPath = path.join(assetsDir, 'icon.png');
const splashPath = path.join(assetsDir, 'splash.png');

logEntry('check_source_files', {
  icon_exists: fs.existsSync(iconPath),
  splash_exists: fs.existsSync(splashPath)
}, 'H1');

if (!fs.existsSync(iconPath) || !fs.existsSync(splashPath)) {
  console.error('❌ Les fichiers source icon.png ou splash.png n\'existent pas');
  process.exit(1);
}

// Copier l'icône dans le bundle iOS
const iosIconPath = path.join(iosAssetsDir, 'App-Icon-1024x1024@1x.png');
try {
  logEntry('copy_icon', { from: iconPath, to: iosIconPath }, 'H1');
  fs.copyFileSync(iconPath, iosIconPath);
  logEntry('copy_icon_success', { file: iosIconPath }, 'H1');
  console.log('✅ Icône copiée dans le bundle iOS');
} catch (error) {
  logEntry('copy_icon_error', { error: error.message }, 'H1');
  console.error('❌ Erreur lors de la copie de l\'icône:', error.message);
  process.exit(1);
}

// Vérifier le fichier copié
const stats = fs.statSync(iosIconPath);
logEntry('verify_icon', {
  size: stats.size,
  mtime: stats.mtime.toISOString()
}, 'H1');

// Vérifier les permissions
const permissions = fs.statSync(iosIconPath).mode.toString(8);
logEntry('check_permissions', { permissions }, 'H3');

console.log('✅ Assets iOS mis à jour avec succès');
console.log('\n📋 Prochaines étapes:');
console.log('1. Nettoyer le build iOS: rm -rf ios/build');
console.log('2. Relancer le build: npx expo run:ios');
console.log('3. Ou relancer prebuild: npx expo prebuild --clean');
