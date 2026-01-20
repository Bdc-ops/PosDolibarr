/**
 * Options de fonctionnalités POS (Feature Flags)
 * Permet d'activer/désactiver des fonctionnalités selon le métier
 * Sans duplication de code, toute la logique s'adapte automatiquement
 */

export interface POSOptions {
  /**
   * Activer la gestion des clients
   */
  activerClients: boolean;

  /**
   * Activer les remises (lignes et globale)
   */
  activerRemises: boolean;

  /**
   * Activer les cartes cadeaux
   */
  activerCartesCadeaux: boolean;

  /**
   * Activer les retours et avoirs
   */
  activerRetours: boolean;

  /**
   * Permettre les tickets sans prix (pour restauration)
   */
  activerTicketSansPrix: boolean;

  /**
   * Activer le multi-paiement (plusieurs modes de paiement)
   */
  activerMultiPaiement: boolean;

  /**
   * Activer la gestion des tables (restauration)
   */
  activerTables: boolean;

  /**
   * Exiger autorisation pour les remises
   */
  activerAutorisationRemise: boolean;

  /**
   * Activer la gestion des avoirs
   */
  activerAvoirs: boolean;

  /**
   * Permettre la vente anonyme (sans client)
   */
  activerVenteAnonyme: boolean;

  /**
   * Activer la recherche par code-barres
   */
  activerCodeBarres: boolean;

  /**
   * Activer la mise en attente de tickets
   */
  activerMiseEnAttente: boolean;

  /**
   * Activer la reprise de ticket en attente
   */
  activerRepriseTicket: boolean;

  /**
   * Activer l'impression de tickets
   */
  activerImpression: boolean;

  /**
   * Activer l'envoi de tickets par email
   */
  activerEnvoiEmail: boolean;

  /**
   * Client obligatoire (pas de vente anonyme)
   */
  clientObligatoire: boolean;

  /**
   * Activer les prix spécifiques par client
   */
  activerPrixSpecifiques: boolean;

  /**
   * Activer la création rapide de client
   */
  activerCreationClient: boolean;

  /**
   * Cumuler les produits identiques dans le panier (même produit => même ligne)
   * - true  => comportement TakePOS classique (cumule par produit)
   * - false => chaque ajout crée une ligne distincte (utile pour variantes / personnalisation rapide)
   */
  activerCumulProduitsIdentiques: boolean;
}

/**
 * Options par défaut (toutes activées)
 */
export const DEFAULT_POS_OPTIONS: POSOptions = {
  activerClients: true,
  activerRemises: true,
  activerCartesCadeaux: true,
  activerRetours: true,
  activerTicketSansPrix: false,
  activerMultiPaiement: true,
  activerTables: false,
  activerAutorisationRemise: false,
  activerAvoirs: true,
  activerVenteAnonyme: true,
  activerCodeBarres: true,
  activerMiseEnAttente: true,
  activerRepriseTicket: true,
  activerImpression: true,
  activerEnvoiEmail: false,
  clientObligatoire: false,
  activerPrixSpecifiques: false,
  activerCreationClient: true,
  activerCumulProduitsIdentiques: true,
} as const;
