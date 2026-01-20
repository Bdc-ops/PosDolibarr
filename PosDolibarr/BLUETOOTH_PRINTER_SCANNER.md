# Configuration Impression Bluetooth et Scanner

Ce document explique comment configurer l'impression Bluetooth et le scanner de code-barres pour l'application POS Dolibarr.

## 📦 Packages requis

### Impression Bluetooth

Pour **Expo (SDK 54)** avec `expo-dev-client` :

1. Installer le package :
```bash
npm install react-native-esc-pos-printer
```

2. Ajouter la configuration dans `app.json` :
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-esc-pos-printer",
        {
          "bluetoothPermission": "App needs Bluetooth access to connect to printers"
        }
      ]
    ]
  }
}
```

3. Rebuild le projet avec `expo-dev-client` :
```bash
npx expo prebuild
npx expo run:ios
# ou
npx expo run:android
```

**Alternative pour Android uniquement** (plus stable) :
```bash
npm install react-native-thermal-receipt-printer
```

### Scanner Code-barres

Pour **Expo (SDK 54)** :

1. Installer le package :
```bash
npx expo install expo-barcode-scanner
```

2. Rebuild le projet :
```bash
npx expo run:ios
# ou
npx expo run:android
```

## 📱 Permissions

### iOS (Info.plist)

Ajouter dans `ios/DolibarrPOS/Info.plist` :

```xml
<key>NSCameraUsageDescription</key>
<string>L'application a besoin de la caméra pour scanner les codes-barres</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>L'application a besoin du Bluetooth pour se connecter aux imprimantes</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>L'application a besoin du Bluetooth pour se connecter aux imprimantes</string>
```

### Android (AndroidManifest.xml)

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

Pour Android 12+, ajouter aussi :
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

## 🔧 Implémentation

Les services sont déjà créés dans :
- `src/services/print.ts` - Service d'impression
- `src/services/scanner.ts` - Service de scanner

**Étapes suivantes :**

1. Installer les packages (voir ci-dessus)
2. Décommenter et adapter le code dans `src/services/print.ts` et `src/services/scanner.ts`
3. Créer les composants UI pour :
   - Sélection d'imprimante Bluetooth
   - Interface de scan code-barres
4. Intégrer dans les écrans POS (payment, receipt, products)

## 🖨️ Imprimantes compatibles

- **ESC/POS** : Epson, Star, Zebra, Bixolon, etc.
- **Thermal printers** : Toutes les imprimantes thermiques Bluetooth compatibles ESC/POS

## 📷 Scanner

- **Code-barres** : EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF
- **QR codes** : Support complet

## ⚠️ Notes

- Les imprimantes Bluetooth doivent être appairées avec le dispositif iOS/Android avant utilisation
- Le scanner nécessite une caméra fonctionnelle
- Certaines fonctionnalités nécessitent un rebuild natif (`expo run:ios` ou `expo run:android`)

## 📚 Documentation

- **react-native-esc-pos-printer** : https://github.com/tr3v3r/react-native-esc-pos-printer
- **expo-barcode-scanner** : https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/
- **react-native-thermal-receipt-printer** : https://github.com/HeligPfleigh/react-native-thermal-receipt-printer
