/**
 * Paramètres de configuration POS (basés sur les constantes PHP TakePOS)
 * Correspond aux options configurées dans l'interface admin TakePOS de Dolibarr
 */

/**
 * Configuration complète POS
 */
export interface POSSettings {
  // === Terminal ===
  terminalName: string;
  numTerminals: number;
  rootCategoryId?: number;
  sortProductField: 'id' | 'ref' | 'label' | 'price';
  mergeSameProducts: boolean;
  numpadType: 'numbers' | 'full';
  
  // === Comptes bancaires ===
  defaultThirdPartyId?: number;
  bankAccountCash?: number;
  bankAccountCheque?: number;
  bankAccountCard?: number;
  bankAccountTransfer?: number;
  bankAccountDirectDebit?: number;
  
  // === Stock ===
  disableStockDecrease: boolean;
  warehouseId?: number;
  
  // === Apparence ===
  colorTheme: 'default' | 'black' | 'pastels' | 'futuristes';
  hideCategories: boolean;
  hideCategoryImages: boolean;
  hideProductImages: boolean;
  showProductReference: 'label' | 'ref+label' | 'ref';
  linesToShow: number;
  hideStockOnLine: boolean;
  showOnlyProductsInStock: boolean;
  showCategoryDescription: boolean;
  
  // === Receipt / Ticket ===
  receiptName: string;
  headerText?: string;
  footerText?: string;
  groupVatByRate: boolean;
  showCustomer: boolean;
  printPaymentMethod: boolean;
  showHTReceipt: boolean;
  printWithoutDetails: boolean;
  printWithoutDetailsLabel?: string;
  autoPrintTickets: boolean;
  
  // === Bar / Restaurant ===
  barRestaurant: boolean;
  orderPrinters: boolean;
  orderNotes: boolean;
  supplements: boolean;
  supplementsCategoryId?: number;
  qrMenu: boolean;
  autoOrder: boolean;
  phoneBasicLayout: boolean;
  
  // === Autres ===
  emailTemplateInvoice?: string;
  barcodeRuleToInsertProduct?: string;
  addDirectCashPaymentButton: boolean;
  addGiftReceiptButton: boolean;
  allowDelayedPayment: boolean;
  controlCashBoxPopup: boolean;
  sellingServices: boolean;
  
  // === Client par défaut ===
  defaultClientId?: number;
  
  // === Langue ===
  language: 'fr' | 'en' | 'es';
  
  // === Imprimante Bluetooth ===
  selectedPrinterId?: string;
  selectedPrinterName?: string;
  
  // === Scanner Bluetooth ===
  selectedScannerId?: string;
  selectedScannerName?: string;
}

/**
 * Paramètres par défaut
 */
export const DEFAULT_POS_SETTINGS: POSSettings = {
  // Terminal
  terminalName: 'Terminal 1',
  numTerminals: 1,
  sortProductField: 'id',
  mergeSameProducts: true,
  numpadType: 'numbers',
  
  // Comptes bancaires
  // (non défini par défaut, doit être configuré)
  
  // Stock
  disableStockDecrease: false,
  
  // Apparence
  colorTheme: 'default',
  hideCategories: false,
  hideCategoryImages: false,
  hideProductImages: false,
  showProductReference: 'ref',
  linesToShow: 2,
  hideStockOnLine: false,
  showOnlyProductsInStock: false,
  showCategoryDescription: false,
  
  // Receipt
  receiptName: '',
  groupVatByRate: false,
  showCustomer: false,
  printPaymentMethod: false,
  showHTReceipt: false,
  printWithoutDetails: false,
  autoPrintTickets: false,
  
  // Bar / Restaurant
  barRestaurant: false,
  orderPrinters: false,
  orderNotes: false,
  supplements: false,
  qrMenu: false,
  autoOrder: false,
  phoneBasicLayout: false,
  
  // Autres
  addDirectCashPaymentButton: false,
  addGiftReceiptButton: false,
  allowDelayedPayment: false,
  controlCashBoxPopup: false,
  sellingServices: false,
  
  // Client par défaut
  // defaultClientId non défini par défaut
  
  // Langue
  language: 'fr',
};

/**
 * Stockage en local (expo-secure-store ou AsyncStorage)
 */
const STORAGE_KEY = 'pos_settings';

/**
 * Charge les paramètres depuis le stockage local
 */
export async function loadPOSSettings(): Promise<POSSettings> {
  try {
    const { getSecureItem } = await import('../storage/secureStorage');
    const stored = await getSecureItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_POS_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres POS:', error);
  }
  return DEFAULT_POS_SETTINGS;
}

/**
 * Sauvegarde les paramètres dans le stockage local
 */
export async function savePOSSettings(settings: Partial<POSSettings>): Promise<void> {
  try {
    const current = await loadPOSSettings();
    const updated = { ...current, ...settings };
    const { setSecureItem } = await import('../storage/secureStorage');
    await setSecureItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres POS:', error);
    throw error;
  }
}
