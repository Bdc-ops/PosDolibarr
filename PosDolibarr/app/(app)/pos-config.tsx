/**
 * Page de configuration complète POS
 * Reprend toutes les options du module TakePOS de Dolibarr
 * Sections: Parameters, Appearance, Printers/Receipt, Bar Restaurant, Terminal, About
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  SectionList,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { POSSettings, DEFAULT_POS_SETTINGS, loadPOSSettings, savePOSSettings } from '../../src/config/pos.settings';
import { ThemeName } from '../../src/theme/themes';
import { searchClients, getClientById } from '../../src/api/clients';
import { DolibarrClient } from '../../src/types/client';
import { discoverBluetoothPrinters, BluetoothPrinter } from '../../src/services/print';
import { discoverBluetoothScanners, BluetoothScanner } from '../../src/services/scanner';
import { APP_CONFIG } from '../../src/config/app.config';
import { getLogs, clearLogs, sendLogsByEmail, contactSupport, clearCache, formatLogsForDisplay } from '../../src/utils/logs';
import { ActivityIndicator } from 'react-native';
type Section = {
  title: string;
  data: Array<{
    key: keyof POSSettings;
    label: string;
    type: 'switch' | 'text' | 'number' | 'select' | 'client_select' | 'printer_select' | 'scanner_select';
    options?: string[];
    value: any;
  }>;
};
export default function POSConfigScreen() {
  const { themeColors, setThemeName } = useTheme();
  const [settings, setSettings] = useState<POSSettings>(DEFAULT_POS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('parameters');
  const [defaultClientSearch, setDefaultClientSearch] = useState('');
  const [defaultClientResults, setDefaultClientResults] = useState<DolibarrClient[]>([]);
  const [defaultClientLoading, setDefaultClientLoading] = useState(false);
  const [selectedDefaultClient, setSelectedDefaultClient] = useState<DolibarrClient | null>(null);
  const [discoveringPrinters, setDiscoveringPrinters] = useState(false);
  const [discoveringScanners, setDiscoveringScanners] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<BluetoothPrinter[]>([]);
  const [availableScanners, setAvailableScanners] = useState<BluetoothScanner[]>([]);
  useEffect(() => {
    loadSettings();
  }, []);
  useEffect(() => {
    // Charger le client par défaut s'il existe
    if (settings.defaultClientId) {
      getClientById(settings.defaultClientId)
        .then(setSelectedDefaultClient)
        .catch(() => setSelectedDefaultClient(null));
    } else {
      setSelectedDefaultClient(null);
    }
  }, [settings.defaultClientId]);
  useEffect(() => {
    // Rechercher les clients pour le sélecteur
    if (defaultClientSearch.length >= 2) {
      setDefaultClientLoading(true);
      searchClients(defaultClientSearch)
        .then((results) => {
          setDefaultClientResults(results || []);
          setDefaultClientLoading(false);
        })
        .catch((error) => {
          console.error('Erreur recherche client pour config:', error);
          setDefaultClientResults([]);
          setDefaultClientLoading(false);
        });
    } else {
      setDefaultClientResults([]);
    }
  }, [defaultClientSearch]);
  const loadSettings = async () => {
    try {
      setLoading(true);
      const loaded = await loadPOSSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    try {
      await savePOSSettings(settings);
      Alert.alert('Succès', 'Configuration sauvegardée');
      router.back();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    }
  };
  const handleChange = (key: keyof POSSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Si c'est le thème, appliquer immédiatement
    if (key === 'colorTheme') {
      setThemeName(value as ThemeName);
    }
  };
  const handleDiscoverPrinters = async () => {
    try {
      setDiscoveringPrinters(true);
      const printers = await discoverBluetoothPrinters();
      setAvailablePrinters(printers);
      if (printers.length === 0) {
        Alert.alert('Information', 'Aucune imprimante Bluetooth trouvée. Assurez-vous que Bluetooth est activé et que l\'imprimante est à portée.');
      }
    } catch (error: any) {
      console.error('Erreur découverte imprimantes:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de découvrir les imprimantes');
    } finally {
      setDiscoveringPrinters(false);
    }
  };
  const handleDiscoverScanners = async () => {
    try {
      setDiscoveringScanners(true);
      const scanners = await discoverBluetoothScanners();
      setAvailableScanners(scanners);
      if (scanners.length === 0) {
        Alert.alert('Information', 'Aucun scanner trouvé. Pour le scanner caméra, assurez-vous que les permissions sont accordées.');
      }
    } catch (error: any) {
      console.error('Erreur découverte scanners:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de découvrir les scanners');
    } finally {
      setDiscoveringScanners(false);
    }
  };
  const sections: Record<string, Section> = {
    parameters: {
      title: 'Parameters',
      data: [
        { key: 'terminalName', label: 'Terminal name', type: 'text', value: settings.terminalName },
        { key: 'numTerminals', label: 'Number of Terminals', type: 'number', value: settings.numTerminals },
        { key: 'sortProductField', label: 'Field for sorting products', type: 'select', options: ['id', 'ref', 'label', 'price'], value: settings.sortProductField },
        { key: 'mergeSameProducts', label: 'Merge lines of the same products', type: 'switch', value: settings.mergeSameProducts },
        { key: 'numpadType', label: 'Type of Pad to enter payment', type: 'select', options: ['numbers', 'full'], value: settings.numpadType },
        { key: 'addDirectCashPaymentButton', label: 'Add a "Direct cash payment" button', type: 'switch', value: settings.addDirectCashPaymentButton },
        { key: 'addGiftReceiptButton', label: 'Add a "Gift receipt" button', type: 'switch', value: settings.addGiftReceiptButton },
        { key: 'allowDelayedPayment', label: 'Allow delayed payment', type: 'switch', value: settings.allowDelayedPayment },
        { key: 'controlCashBoxPopup', label: 'Open the "Control cash box" popup when opening the POS', type: 'switch', value: settings.controlCashBoxPopup },
        { key: 'sellingServices', label: 'Selling services', type: 'switch', value: settings.sellingServices },
        { key: 'language', label: 'Language', type: 'select', options: ['fr', 'en', 'es'], value: settings.language },
        { key: 'defaultClientId', label: 'Default client for sales', type: 'client_select', value: settings.defaultClientId },
      ],
    },
    appearance: {
      title: 'Appearance',
      data: [
        { key: 'colorTheme', label: 'Color theme', type: 'select', options: ['default', 'black', 'pastels', 'futuristes'], value: settings.colorTheme },
        { key: 'hideCategories', label: 'Hide the whole section of categories selection', type: 'switch', value: settings.hideCategories },
        { key: 'hideCategoryImages', label: 'Hide Category Images', type: 'switch', value: settings.hideCategoryImages },
        { key: 'hideProductImages', label: 'Hide Product Images', type: 'switch', value: settings.hideProductImages },
        { key: 'showProductReference', label: 'Show reference or label of products', type: 'select', options: ['label', 'ref+label', 'ref'], value: settings.showProductReference },
        { key: 'linesToShow', label: 'Maximum number of lines of text to show on thumb images', type: 'number', value: settings.linesToShow },
        { key: 'hideStockOnLine', label: 'Hide stock on line', type: 'switch', value: settings.hideStockOnLine },
        { key: 'showOnlyProductsInStock', label: 'Show only the products in stock', type: 'switch', value: settings.showOnlyProductsInStock },
        { key: 'showCategoryDescription', label: 'Show categories description', type: 'switch', value: settings.showCategoryDescription },
      ],
    },
    receipt: {
      title: 'Printers / Receipt',
      data: [
        { key: 'receiptName', label: 'Receipt Name', type: 'text', value: settings.receiptName },
        { key: 'groupVatByRate', label: 'Group VAT by rate in tickets|receipts', type: 'switch', value: settings.groupVatByRate },
        { key: 'showCustomer', label: 'Print customer on tickets|receipts', type: 'switch', value: settings.showCustomer },
        { key: 'printPaymentMethod', label: 'Print payment method on tickets|receipts', type: 'switch', value: settings.printPaymentMethod },
        { key: 'showHTReceipt', label: 'Display the column with the price excluding tax (on the receipt)', type: 'switch', value: settings.showHTReceipt },
        { key: 'printWithoutDetails', label: 'Add "Print without details" button', type: 'switch', value: settings.printWithoutDetails },
        { key: 'autoPrintTickets', label: 'Automatically print tickets|receipts', type: 'switch', value: settings.autoPrintTickets },
      ],
    },
    bar: {
      title: 'Bar Restaurant',
      data: [
        { key: 'barRestaurant', label: 'Enable features for Bar or Restaurant', type: 'switch', value: settings.barRestaurant },
        { key: 'orderPrinters', label: 'Add a button to send the order to some given printers, without payment', type: 'switch', value: settings.orderPrinters },
        { key: 'orderNotes', label: 'Manage supplements of products', type: 'switch', value: settings.orderNotes },
        { key: 'supplements', label: 'Manage supplements of products', type: 'switch', value: settings.supplements },
        { key: 'qrMenu', label: 'QR - Customer menu', type: 'switch', value: settings.qrMenu },
        { key: 'autoOrder', label: 'QR - Order by the customer himself', type: 'switch', value: settings.autoOrder },
        { key: 'phoneBasicLayout', label: 'On phones, replace the POS with a minimal layout (Record orders only)', type: 'switch', value: settings.phoneBasicLayout },
      ],
    },
    terminal: {
      title: 'Terminal',
      data: [
        { key: 'disableStockDecrease', label: 'Disable stock decrease when a sale is done from Point of Sale', type: 'switch', value: settings.disableStockDecrease },
      ],
    },
    printers: {
      title: 'Printers & Scanner',
      data: [
        { key: 'selectedScannerId', label: 'Selected Scanner', type: 'scanner_select', value: settings.selectedScannerId },
    ],
    about: {
      title: 'About',
      data: [],
    },
    },
  };
  const renderSectionTab = (sectionKey: string, section: Section) => (
    <TouchableOpacity
      key={sectionKey}
      style={[
        styles.sectionTabBubble,
        activeSection === sectionKey && {
          backgroundColor: themeColors.primary,
          borderColor: themeColors.primary,
        },
        !(activeSection === sectionKey) && {
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        },
        ]}
      onPress={() => setActiveSection(sectionKey)}
    >
      <Text
        style={[
          styles.sectionTabBubbleText,
          activeSection === sectionKey && { color: themeColors.textInverse },
          !(activeSection === sectionKey) && { color: themeColors.text },
        ]}
      >
        {section.title}
      </Text>
    </TouchableOpacity>
  );
  const renderSetting = (item: Section['data'][0]) => {
    if (item.type === 'switch') {
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Switch
            value={item.value as boolean}
            onValueChange={(val) => handleChange(item.key, val)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={item.value ? theme.colors.primary : theme.colors.borderDark}
          />
        </View>
      );
    }
    if (item.type === 'text') {
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <TextInput
            style={styles.settingInput}
            value={String(item.value || '')}
            onChangeText={(text) => handleChange(item.key, text)}
            placeholder={item.label}
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
        </View>
      );
    }
    if (item.type === 'number') {
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <TextInput
            style={styles.settingInput}
            value={String(item.value || '')}
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              if (!isNaN(num)) handleChange(item.key, num);
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
        </View>
      );
    }
    if (item.type === 'select') {
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <View style={styles.selectContainer}>
            {item.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.selectOption,
                  item.value === opt && styles.selectOptionActive,
                ]}
                onPress={() => handleChange(item.key, opt)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    item.value === opt && styles.selectOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (item.type === 'client_select') {
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {selectedDefaultClient && (
            <View style={styles.clientSelectedContainer}>
              <Text style={styles.clientSelectedText}>
                {selectedDefaultClient.name}
                {selectedDefaultClient.email ? ` - ${selectedDefaultClient.email}` : ''}
              </Text>
              <TouchableOpacity
                style={styles.removeClientButton}
                onPress={() => {
                  handleChange(item.key, undefined);
                  setSelectedDefaultClient(null);
                  setDefaultClientSearch('');
                }}
              >
                <Text style={styles.removeClientButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            style={styles.settingInput}
            value={defaultClientSearch}
            onChangeText={setDefaultClientSearch}
            placeholder="Rechercher un client..."
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
          {defaultClientLoading && (
            <Text style={styles.loadingText}>Recherche...</Text>
          )}
          {!defaultClientLoading && defaultClientResults.length > 0 && (
            <View style={styles.clientResultsContainer}>
              {defaultClientResults.slice(0, 5).map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientResultItem}
                  onPress={() => {
                    handleChange(item.key, client.id);
                    setSelectedDefaultClient(client);
                    setDefaultClientSearch('');
                    setDefaultClientResults([]);
                  }}
                >
                  <Text style={styles.clientResultText}>{client.name}</Text>
                  {client.email && (
                    <Text style={styles.clientResultEmail}>{client.email}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }
    if (item.type === 'printer_select') {
      const selectedPrinter = availablePrinters.find((p) => p.id === item.value) || 
        (settings.selectedPrinterId ? { id: settings.selectedPrinterId, name: settings.selectedPrinterName || 'Imprimante sélectionnée' } : null);
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {selectedPrinter && (
            <View style={styles.deviceSelectedContainer}>
              <Text style={styles.deviceSelectedText}>
                {selectedPrinter.name}
                {selectedPrinter.address ? ` (${selectedPrinter.address})` : ''}
              </Text>
              <TouchableOpacity
                style={styles.removeDeviceButton}
                onPress={() => {
                  handleChange('selectedPrinterId', undefined);
                  handleChange('selectedPrinterName', undefined);
                }}
              >
                <Text style={styles.removeDeviceButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.discoverButton, { backgroundColor: themeColors.primary }]}
            onPress={handleDiscoverPrinters}
            disabled={discoveringPrinters}
          >
            {discoveringPrinters ? (
              <ActivityIndicator color={themeColors.textInverse} />
            ) : (
              <Text style={[styles.discoverButtonText, { color: themeColors.textInverse }]}>
                🔍 Découvrir les imprimantes
              </Text>
            )}
          </TouchableOpacity>
          {availablePrinters.length > 0 && (
            <View style={styles.deviceResultsContainer}>
              {availablePrinters.map((printer) => (
                <TouchableOpacity
                  key={printer.id}
                  style={[
                    styles.deviceResultItem,
                    item.value === printer.id && { backgroundColor: themeColors.primary + '20' },
                  ]}
                  onPress={() => {
                    handleChange('selectedPrinterId', printer.id);
                    handleChange('selectedPrinterName', printer.name);
                  }}
                >
                  <Text style={[
                    styles.deviceResultText,
                    item.value === printer.id && { color: themeColors.primary, fontWeight: 'bold' },
                  ]}>
                    {printer.name}
                  </Text>
                  {printer.address && (
                    <Text style={styles.deviceResultAddress}>{printer.address}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }
    if (item.type === 'scanner_select') {
      const selectedScanner = availableScanners.find((s) => s.id === item.value) ||
        (settings.selectedScannerId ? { id: settings.selectedScannerId, name: settings.selectedScannerName || 'Scanner sélectionné' } : null);
      return (
        <View key={item.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {selectedScanner && (
            <View style={styles.deviceSelectedContainer}>
              <Text style={styles.deviceSelectedText}>
                {selectedScanner.name}
                {selectedScanner.type ? ` (${selectedScanner.type})` : ''}
              </Text>
              <TouchableOpacity
                style={styles.removeDeviceButton}
                onPress={() => {
                  handleChange('selectedScannerId', undefined);
                  handleChange('selectedScannerName', undefined);
                }}
              >
                <Text style={styles.removeDeviceButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.discoverButton, { backgroundColor: themeColors.primary }]}
            onPress={handleDiscoverScanners}
            disabled={discoveringScanners}
          >
            {discoveringScanners ? (
              <ActivityIndicator color={themeColors.textInverse} />
            ) : (
              <Text style={[styles.discoverButtonText, { color: themeColors.textInverse }]}>
                🔍 Découvrir les scanners
              </Text>
            )}
          </TouchableOpacity>
          {availableScanners.length > 0 && (
            <View style={styles.deviceResultsContainer}>
              {availableScanners.map((scanner) => (
                <TouchableOpacity
                  key={scanner.id}
                  style={[
                    styles.deviceResultItem,
                    item.value === scanner.id && { backgroundColor: themeColors.primary + '20' },
                  ]}
                  onPress={() => {
                    handleChange('selectedScannerId', scanner.id);
                    handleChange('selectedScannerName', scanner.name);
                  }}
                >
                  <Text style={[
                    styles.deviceResultText,
                    item.value === scanner.id && { color: themeColors.primary, fontWeight: 'bold' },
                  ]}>
                    {scanner.name}
                  </Text>
                  {scanner.type && (
                    <Text style={styles.deviceResultAddress}>{scanner.type}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }
    return null;
  };
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }
  const currentSection = sections[activeSection];
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: themeColors.textInverse }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.textInverse }]}>Configuration POS</Text>
        <View style={{ width: 60 }} />
      </View>
      {/* Tabs de navigation - Bulles élégantes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: themeColors.backgroundSecondary, borderBottomColor: themeColors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {Object.entries(sections).map(([key, section]) => renderSectionTab(key, section))}
      </ScrollView>
      {/* Contenu de la section active */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={[styles.section, { backgroundColor: themeColors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{currentSection.title}</Text>
          {activeSection === 'about' ? (
            <View>
              <Text style={[styles.aboutVersion, { color: themeColors.text }]}>{APP_CONFIG.APP_INFO.VERSION}</Text>
              <Text style={[styles.aboutCopyright, { color: themeColors.textSecondary }]}>{APP_CONFIG.APP_INFO.COPYRIGHT}</Text>
              <Text style={[styles.aboutWebsite, { color: themeColors.primary }]}>{APP_CONFIG.APP_INFO.WEBSITE}</Text>
              <Text style={[styles.aboutSupport, { color: themeColors.textSecondary }]}>Support: {APP_CONFIG.APP_INFO.SUPPORT_EMAIL}</Text>
              <View style={styles.aboutActions}>
                <TouchableOpacity style={[styles.aboutButton, { backgroundColor: themeColors.primary }]} onPress={async () => {
                  try {
                    await clearCache();
                    Alert.alert('Succès', 'Cache vidé avec succès');
                  } catch (error) {
                    Alert.alert('Erreur', 'Impossible de vider le cache');
                  }
                }}>
                  <Text style={styles.aboutButtonText}>🗑️ Vider le cache</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.aboutButton, { backgroundColor: themeColors.info }]} onPress={async () => {
                  try {
                    const logs = await getLogs();
                    const logsText = formatLogsForDisplay(logs);
                    Alert.alert('Logs', logsText.length > 500 ? logsText.substring(0, 500) + '...' : logsText, [
                      { text: 'Fermer', style: 'cancel' },
                      { text: 'Envoyer par email', onPress: sendLogsByEmail },
                    ], { scrollable: true });
                  } catch (error) {
                    Alert.alert('Erreur', 'Impossible de charger les logs');
                  }
                }}>
                  <Text style={styles.aboutButtonText}>📋 Voir les logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.aboutButton, { backgroundColor: themeColors.warning }]} onPress={sendLogsByEmail}>
                  <Text style={styles.aboutButtonText}>📧 Envoyer les logs par email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.aboutButton, { backgroundColor: themeColors.success }]} onPress={contactSupport}>
                  <Text style={styles.aboutButtonText}>✉️ Contacter le support</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>{currentSection.data.map((item) => renderSetting(item))}</View>
          )}
        </View>
      </ScrollView>
      {/* Bouton sauvegarder */}
      <View style={[styles.footer, { backgroundColor: themeColors.backgroundSecondary, borderTopColor: themeColors.border }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.success }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: themeColors.textInverse }]}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  backButton: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  tabsContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  sectionTabBubble: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    width: 200,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  sectionTabBubbleText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  settingRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  settingLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  settingInput: {
    minHeight: 56,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  selectOption: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  selectOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectOptionText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectOptionTextActive: {
    color: theme.colors.textInverse,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  clientSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  clientSelectedText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  removeClientButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error,
  },
  removeClientButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientResultsContainer: {
    marginTop: theme.spacing.sm,
    maxHeight: 200,
  },
  clientResultItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clientResultText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  clientResultEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  deviceSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  deviceSelectedText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  removeDeviceButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error,
  },
  removeDeviceButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  discoverButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  discoverButtonText: {
    ...theme.typography.button,
    textAlign: 'center',
  },
  deviceResultsContainer: {
    marginTop: theme.spacing.sm,
    maxHeight: 200,
  },
  deviceResultItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deviceResultText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  deviceResultAddress: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
  ;
