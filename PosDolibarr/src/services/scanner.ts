/**
 * Service de scan code-barres / QR codes
 * Permet de scanner des codes-barres pour rechercher des produits
 * 
 * Installation des packages requis :
 * 
 * Pour Expo :
 * - expo-barcode-scanner (recommandé pour Expo)
 * 
 * Pour React Native CLI :
 * - react-native-vision-camera (plus performant mais plus complexe)
 * - react-native-camera (ancien, déprécié)
 * 
 * Package recommandé pour Expo :
 * - expo-barcode-scanner (simple, intégré Expo, support iOS + Android)
 */

import { DolibarrProduct } from '../types/product';

/**
 * Types de codes-barres supportés
 */
export type BarcodeType = 'EAN_13' | 'EAN_8' | 'UPC_A' | 'UPC_E' | 'CODE_128' | 'CODE_39' | 'ITF' | 'QR_CODE';

/**
 * Résultat d'un scan
 */
export interface BarcodeScanResult {
  type: BarcodeType;
  data: string;
  scannedAt: number;
}

/**
 * Scanne un code-barres (interface pour futur intégration)
 * 
 * Utilise expo-camera (expo-barcode-scanner est déprécié depuis SDK 52+)
 */
export async function scanBarcode(): Promise<BarcodeScanResult | null> {
  // TODO: Implémenter avec expo-camera
  // Exemple de code (nécessite installation du package):
  /*
  import { CameraView, useCameraPermissions } from 'expo-camera';
  
  // Demander la permission caméra
  const [permission, requestPermission] = useCameraPermissions();
  if (!permission) {
    await requestPermission();
  }
  
  // Dans un composant avec CameraView :
  // <CameraView
  //   onBarcodeScanned={handleBarCodeScanned}
  //   barcodeScannerSettings={{
  //     barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf', 'qr']
  //   }}
  // />
  */
  
  throw new Error('Scanner non configuré. Installez expo-camera.');
}

/**
 * Interface pour un scanner Bluetooth découvert
 */
export interface BluetoothScanner {
  id: string;
  name: string;
  address?: string;
  type?: 'bluetooth' | 'usb' | 'camera';
  connected?: boolean;
}

/**
 * Liste les scanners Bluetooth disponibles
 * Note: Pour expo-barcode-scanner, on utilise la caméra, pas de découverte Bluetooth nécessaire
 * Cette fonction est utile pour les scanners Bluetooth externes
 */
export async function discoverBluetoothScanners(): Promise<BluetoothScanner[]> {
  try {
    // Pour expo-camera, on utilise la caméra (pas de découverte Bluetooth)
    // Mais on peut vérifier si le scanner caméra est disponible
    const Camera = await import('expo-camera').catch(() => null);
    
    if (Camera && Camera.useCameraPermissions) {
      // Vérifier les permissions via le hook (pour composant) ou Camera.requestCameraPermissionsAsync() (pour fonction)
      try {
        const { requestCameraPermissionsAsync } = await import('expo-camera');
        const { status } = await requestCameraPermissionsAsync();
        if (status === 'granted') {
          return [{
            id: 'camera_scanner',
            name: 'Scanner caméra',
            type: 'camera',
            connected: true,
          }];
        }
      } catch (permError) {
        // Ignorer les erreurs de permissions
      }
    }
    
    // TODO: Ajouter support pour scanners Bluetooth externes si nécessaire
    // Pour l'instant, on retourne uniquement le scanner caméra s'il est disponible
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la découverte des scanners:', error);
    return [];
  }
}

/**
 * Recherche un produit par code-barres
 */
export async function findProductByBarcode(barcode: string): Promise<DolibarrProduct | null> {
  try {
    const { dolibarrApi } = await import('../api/dolibarr');
    
    const client = await dolibarrApi.getClient();
    const response = await client.get<DolibarrProduct[]>('/api/index.php/products', {
      params: {
        limit: 1,
        // Recherche par barcode - essayer différentes variations
      },
    });
    
    // Filtrer côté client car l'API Dolibarr peut ne pas supporter sqlfilters avec barcode
    const products = response.data || [];
    const matchingProduct = products.find((p) => 
      p.barcode === barcode || 
      p.barcode_label === barcode ||
      p.ref === barcode
    );
    
    return matchingProduct || null;
  } catch (error) {
    console.error('Erreur lors de la recherche par code-barres:', error);
    return null;
  }
}
