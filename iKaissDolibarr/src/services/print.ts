/**
 * Service d'impression Bluetooth
 * Permet d'imprimer des tickets de caisse sur des imprimantes Bluetooth (thermal printers)
 * 
 * Installation des packages requis :
 * 
 * Pour React Native CLI (si vous n'utilisez pas Expo) :
 * - iOS: npm install react-native-esc-pos-printer
 * - Android: npm install react-native-thermal-receipt-printer
 * 
 * Pour Expo (utiliser des modules configurés avec expo-dev-client) :
 * - Installer via EAS Build avec plugins personnalisés
 * - Ou utiliser react-native-esc-pos-printer via un custom dev client
 * 
 * Packages recommandés :
 * - react-native-esc-pos-printer (support iOS + Android, ESC/POS)
 * - react-native-thermal-receipt-printer (Android seulement, mais très stable)
 */

import { CompletedSale } from '../types/pos';

/**
 * Format le ticket de caisse en texte pour impression
 */
export function formatReceiptText(sale: CompletedSale): string {
  const lines: string[] = [];
  
  // En-tête
  lines.push('================================');
  lines.push('       TICKET DE CAISSE         ');
  lines.push('================================');
  lines.push('');
  lines.push(`Ticket N°: ${sale.ticket_number || sale.id.slice(0, 8)}`);
  lines.push(`Date: ${new Date(sale.created_at).toLocaleString('fr-FR')}`);
  lines.push('');
  
  // Client (si présent)
  if (sale.client) {
    lines.push(`Client: ${sale.client.name}`);
    if (sale.client.email) lines.push(`Email: ${sale.client.email}`);
    if (sale.client.phone) lines.push(`Tel: ${sale.client.phone}`);
    lines.push('');
  }
  
  // Produits
  lines.push('Articles:');
  lines.push('--------------------------------');
  sale.products.forEach((product) => {
    const lineText = `${product.quantity}x ${product.label}`;
    const totalText = `${product.total_ttc.toFixed(2)}€`;
    // Format avec alignement droite pour le prix
    const padding = 32 - lineText.length - totalText.length;
    lines.push(lineText + ' '.repeat(Math.max(1, padding)) + totalText);
    if (product.ref) lines.push(`   Ref: ${product.ref}`);
  });
  lines.push('--------------------------------');
  lines.push('');
  
  // Totaux
  if (sale.subtotal > 0) {
    lines.push(`Sous-total HT:      ${sale.subtotal.toFixed(2)}€`);
    lines.push(`TVA:                ${sale.total_tax.toFixed(2)}€`);
  }
  if (sale.total_discount > 0) {
    lines.push(`Remise:            -${sale.total_discount.toFixed(2)}€`);
  }
  lines.push(`TOTAL TTC:          ${sale.total_ttc.toFixed(2)}€`);
  lines.push('');
  
  // Paiements
  if (sale.payments.length > 0) {
    lines.push('Paiements:');
    sale.payments.forEach((payment) => {
      const typeLabel = payment.type === 'LIQ' || payment.type === 'CASH' ? 'Espèces' : 
                       payment.type === 'CB' ? 'Carte' : 
                       payment.type === 'CHQ' ? 'Chèque' : payment.type;
      lines.push(`  ${typeLabel}: ${payment.amount.toFixed(2)}€`);
    });
    lines.push(`Total payé: ${sale.payment_total.toFixed(2)}€`);
    if (sale.remaining < 0) {
      lines.push(`Rendu monnaie: ${Math.abs(sale.remaining).toFixed(2)}€`);
    }
    lines.push('');
  }
  
  // Pied de page
  lines.push('================================');
  lines.push('     Merci de votre visite      ');
  lines.push('================================');
  lines.push('');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Imprime un ticket via Bluetooth (interface pour futur intégration)
 * 
 * À implémenter avec react-native-esc-pos-printer ou react-native-thermal-receipt-printer
 */
export async function printReceiptBluetooth(sale: CompletedSale): Promise<void> {
  // TODO: Implémenter avec react-native-esc-pos-printer
  // Exemple de code (nécessite installation du package):
  /*
  import EscPosPrinter from 'react-native-esc-pos-printer';
  
  const text = formatReceiptText(sale);
  
  // Se connecter à l'imprimante Bluetooth
  const printers = await EscPosPrinter.discover();
  if (printers.length === 0) {
    throw new Error('Aucune imprimante Bluetooth trouvée');
  }
  
  // Sélectionner la première imprimante (ou celle configurée)
  const printer = printers[0];
  await EscPosPrinter.init({
    target: printer.target,
    seriesName: printer.name,
    language: 'EPOS2_LANG_EN',
  });
  
  // Imprimer
  await EscPosPrinter.printText(text);
  */
  
  // Pour l'instant, on utilise console.log (développement)
  console.log('=== TICKET À IMPRIMER ===');
  console.log(formatReceiptText(sale));
  console.log('========================');
  
  throw new Error('Imprimante Bluetooth non configurée. Installez react-native-esc-pos-printer.');
}

/**
 * Interface pour une imprimante Bluetooth découverte
 */
export interface BluetoothPrinter {
  id: string;
  name: string;
  address?: string;
  target?: string;
  connected?: boolean;
}

/**
 * Liste les imprimantes Bluetooth disponibles
 */
export async function discoverBluetoothPrinters(): Promise<BluetoothPrinter[]> {
  try {
    // Tenter d'utiliser react-native-esc-pos-printer si disponible
    const EscPosPrinter = await import('react-native-esc-pos-printer').catch(() => null);
    
    if (EscPosPrinter && EscPosPrinter.default) {
      try {
        const printers = await EscPosPrinter.default.discover();
        return printers.map((p: any) => ({
          id: p.target || p.address || p.name,
          name: p.name || 'Imprimante inconnue',
          address: p.address,
          target: p.target,
          connected: false,
        }));
      } catch (error) {
        console.error('Erreur découverte imprimantes:', error);
        return [];
      }
    }
    
    // Fallback: retourner une liste vide si le module n'est pas disponible
    console.log('[discoverBluetoothPrinters] Module react-native-esc-pos-printer non disponible');
    return [];
  } catch (error) {
    console.error('Erreur lors de la découverte des imprimantes Bluetooth:', error);
    return [];
  }
}
