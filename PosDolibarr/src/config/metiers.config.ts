/**
 * Configuration par métier
 * Chaque métier active/désactive des options et définit des comportements spécifiques
 * Sans duplication de code, l'application s'adapte automatiquement
 */

import { POSOptions, DEFAULT_POS_OPTIONS } from './pos.options';

/**
 * Type de métier disponible
 */
export type MetierType = 'restauration' | 'snack' | 'comptoir' | 'automobile' | 'default';

/**
 * Configuration d'un métier
 */
export interface MetierConfig {
  /**
   * Identifiant du métier
   */
  id: MetierType;

  /**
   * Nom du métier
   */
  name: string;

  /**
   * Description
   */
  description: string;

  /**
   * Options POS activées/désactivées pour ce métier
   */
  options: POSOptions;

  /**
   * Paramètres spécifiques au métier
   */
  settings: {
    /**
     * Ticket sans prix par défaut
     */
    ticketSansPrix: boolean;

    /**
     * Affichage simplifié
     */
    interfaceSimplifiee: boolean;

    /**
     * Gestion de stocks
     */
    gestionStocks: boolean;

    /**
     * Client obligatoire
     */
    clientObligatoire: boolean;

    /**
     * Types de paiement disponibles
     */
    // Codes Dolibarr (c_paiement): LIQ/CB/CHQ/VIR/...
    // Kept as strings to allow future custom dictionaries.
    typesPaiement: Array<'LIQ' | 'CB' | 'CHQ' | 'VIR' | 'TIP' | 'TRA' | 'PRE' | 'CASH' | 'CHEQUE'>;

    /**
     * Mode de vente principal
     */
    modeVente: 'rapide' | 'standard' | 'detaille';
  };
}

/**
 * Configuration RESTAURATION
 */
const RESTAURATION_CONFIG: MetierConfig = {
  id: 'restauration',
  name: 'Restauration',
  description: 'Restaurants, cafés, bars',
  options: {
    ...DEFAULT_POS_OPTIONS,
    activerTables: true,
    activerTicketSansPrix: true,
    activerMiseEnAttente: true,
    activerRepriseTicket: true,
    activerVenteAnonyme: true,
    clientObligatoire: false,
    activerCartesCadeaux: false,
    activerRetours: false,
  },
  settings: {
    ticketSansPrix: true,
    interfaceSimplifiee: false,
    gestionStocks: true,
    clientObligatoire: false,
    typesPaiement: ['LIQ', 'CB'],
    modeVente: 'standard',
  },
};

/**
 * Configuration SNACK / FAST-FOOD
 */
const SNACK_CONFIG: MetierConfig = {
  id: 'snack',
  name: 'Snack / Fast-Food',
  description: 'Points de vente rapides',
  options: {
    ...DEFAULT_POS_OPTIONS,
    activerTables: false,
    activerTicketSansPrix: false,
    activerVenteAnonyme: true,
    clientObligatoire: false,
    activerRemises: false,
    activerCartesCadeaux: false,
    activerRetours: false,
    activerMiseEnAttente: false,
    activerRepriseTicket: false,
    activerEnvoiEmail: false,
  },
  settings: {
    ticketSansPrix: false,
    interfaceSimplifiee: true,
    gestionStocks: true,
    clientObligatoire: false,
    typesPaiement: ['LIQ', 'CB'],
    modeVente: 'rapide',
  },
};

/**
 * Configuration VENTE AU COMPTOIR
 */
const COMPTOIR_CONFIG: MetierConfig = {
  id: 'comptoir',
  name: 'Vente au Comptoir',
  description: 'Boutiques, magasins, points de vente',
  options: {
    ...DEFAULT_POS_OPTIONS,
    activerTables: false,
    activerTicketSansPrix: false,
    activerVenteAnonyme: true,
    clientObligatoire: false,
    activerCodeBarres: true,
    activerRetours: true,
    activerAvoirs: true,
  },
  settings: {
    ticketSansPrix: false,
    interfaceSimplifiee: false,
    gestionStocks: true,
    clientObligatoire: false,
    typesPaiement: ['LIQ', 'CB', 'CHQ', 'VIR'],
    modeVente: 'standard',
  },
};

/**
 * Configuration AUTOMOBILE
 */
const AUTOMOBILE_CONFIG: MetierConfig = {
  id: 'automobile',
  name: 'Automobile',
  description: 'Garages, concessionnaires, ateliers',
  options: {
    ...DEFAULT_POS_OPTIONS,
    activerTables: false,
    activerTicketSansPrix: false,
    activerVenteAnonyme: false,
    clientObligatoire: true,
    activerRemises: true,
    activerAutorisationRemise: true,
    activerRetours: true,
    activerAvoirs: true,
    activerPrixSpecifiques: true,
    activerCreationClient: true,
  },
  settings: {
    ticketSansPrix: false,
    interfaceSimplifiee: false,
    gestionStocks: true,
    clientObligatoire: true,
    typesPaiement: ['LIQ', 'CB', 'CHQ', 'VIR'],
    modeVente: 'detaille',
  },
};

/**
 * Configuration par défaut (générique)
 */
const DEFAULT_CONFIG: MetierConfig = {
  id: 'default',
  name: 'Générique',
  description: 'Configuration par défaut',
  options: DEFAULT_POS_OPTIONS,
  settings: {
    ticketSansPrix: false,
    interfaceSimplifiee: false,
    gestionStocks: true,
    clientObligatoire: false,
    typesPaiement: ['LIQ', 'CB', 'CHQ', 'VIR'],
    modeVente: 'standard',
  },
};

/**
 * Toutes les configurations métier disponibles
 */
export const METIERS_CONFIG: Record<MetierType, MetierConfig> = {
  restauration: RESTAURATION_CONFIG,
  snack: SNACK_CONFIG,
  comptoir: COMPTOIR_CONFIG,
  automobile: AUTOMOBILE_CONFIG,
  default: DEFAULT_CONFIG,
};

/**
 * Récupère la configuration d'un métier
 * @param metier - Type de métier
 * @returns Configuration du métier
 */
export function getMetierConfig(metier: MetierType = 'default'): MetierConfig {
  return METIERS_CONFIG[metier] || METIERS_CONFIG.default;
}

/**
 * Type pour le métier actuel (à stocker dans la config de l'app)
 */
export let currentMetier: MetierType = 'default';

/**
 * Définit le métier actuel
 * @param metier - Type de métier
 */
export function setCurrentMetier(metier: MetierType): void {
  currentMetier = metier;
}

/**
 * Récupère la configuration du métier actuel
 * @returns Configuration du métier actuel
 */
export function getCurrentMetierConfig(): MetierConfig {
  return getMetierConfig(currentMetier);
}
