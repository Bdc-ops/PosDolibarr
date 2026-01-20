module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependencies: {
    // Désactive le codegen pour react-native-screens qui a des problèmes de compatibilité
    'react-native-screens': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-screens/android',
          packageImportPath: 'import io.swmansion.rnscreens.RNSScreensPackage;',
        },
        ios: {
          podspecPath: '../node_modules/react-native-screens/RNScreens.podspec',
        },
      },
    },
  },
  assets: ['./assets/'],
};
