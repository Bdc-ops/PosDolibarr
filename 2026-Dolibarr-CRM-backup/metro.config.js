const { getDefaultConfig } = require('expo/metro-config');

// Forcer l'utilisation de watchman AVANT de charger la config
process.env.WATCHMAN_DISABLE_NODEWATCHER = '1';
process.env.CI = 'false';

const config = getDefaultConfig(__dirname);

// Réduire drastiquement le nombre de fichiers surveillés
config.watchFolders = [__dirname];
config.resolver.sourceExts.push('cjs');

// Configuration optimisée pour FORCER watchman et éviter EMFILE
config.watcher = {
  useWatchman: true,
  usePolling: false,
  healthCheck: {
    enabled: true,
    interval: 2000,
    timeout: 4000,
  },
  watchman: {
    deferStates: ['hg.update'],
  },
};

// Ignorer complètement node_modules dans le watching
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /\.git\/.*/,
  /\.expo\/.*/,
  /\.expo-shared\/.*/,
];

// Réduire les extensions surveillées
config.resolver.sourceExts = config.resolver.sourceExts || [];
config.resolver.assetExts = config.resolver.assetExts || [];

module.exports = config;
