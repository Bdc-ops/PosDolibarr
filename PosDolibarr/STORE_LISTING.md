# Fiche App Store / Google Play – Dolibarr Caisse POS

Ce fichier rassemble tous les champs prêts à copier-coller pour les stores. Adapter les URLs (support, politique de confidentialité) et vérifier la limite de caractères indiquée pour chaque champ.

---

## Identité de l’app
- Nom de l’app : **Dolibarr Caisse POS**
- Catégorie suggérée : **Productivité** / **Entreprise**
- Âge / Contenu : **4+ (iOS)** / **PEGI 3 (Android)** — à ajuster selon la modération.
- Icône & splash : utiliser `assets/icon.png` et `assets/splash.png` générés selon les instructions du projet.

---

## Champs App Store (Apple)
- **Sous-titre (max 30 car.)** : « Caisse mobile pour Dolibarr »
- **Mots-clés** : `dolibarr,caisse,pos,erp,crm,vente,stock,facture,tpe,mobile`
- **Description marketing (aucune limite forte, privilégier 400–600 mots) :**
  ```
  Dolibarr Caisse POS est l’application mobile officielle pour connecter votre point de vente à votre instance Dolibarr. Encaissez, gérez vos produits et suivez vos ventes en direct depuis un iPhone ou iPad.

  Fonctionnalités principales
  • Connexion à votre Dolibarr pour retrouver articles, prix, clients et taxes
  • Ticket de caisse rapide : ajout d’articles, remises, quantités et totaux instantanés
  • Gestion multi-taux de TVA et remise panier
  • Mode catalogue avec recherche par nom ou référence
  • Consultation des ventes du jour et de l’historique récent
  • Sauvegarde locale sécurisée (expo-secure-store) et base SQLite embarquée pour la vitesse
  • Compatible iPhone et iPad, interface adaptée au comptoir

  Pour qui ?
  • Commerçants, boutiques, restaurants légers, pop-up stores
  • Associations ou TPE déjà équipées de Dolibarr ERP/CRM

  Prérequis
  • Une instance Dolibarr accessible (hébergée ou on-premise)
  • API REST activée côté Dolibarr et droits suffisants pour l’utilisateur POS

  Support & aide
  • Support : <URL_support>
  • Politique de confidentialité : <URL_confidentialite>
  • Site web : https://www.dolibarr.org
  ```
- **Nouveautés (note de version)** : « Améliorations de stabilité et compatibilité POS Dolibarr. »
- **URL support** : `<URL_support>`
- **URL marketing** : `https://www.dolibarr.org` (ou votre page produit)
- **URL confidentialité** : `<URL_confidentialite>`

---

## Champs Google Play
- **Titre (max 30 car.)** : « Dolibarr Caisse POS »
- **Description courte (max 80 car.)** : « Caisse mobile reliée à votre Dolibarr : encaissement rapide et sûr. »
- **Description longue :**
  ```
  Dolibarr Caisse POS connecte votre point de vente à votre instance Dolibarr pour encaisser partout, même en mobilité. Retrouver vos articles, prix, clients et taxes devient instantané.

  Points clés
  • Encaissement rapide avec calcul des taxes et remises
  • Catalogue produits connecté à Dolibarr (articles, prix, références)
  • Historique des ventes du jour et récapitulatifs clés
  • Sauvegarde locale sécurisée et performances via SQLite embarqué
  • Interface simple pour comptoir, tablette ou smartphone

  Pré-requis
  • Instance Dolibarr accessible (hébergée ou locale)
  • API REST activée et droits POS pour l’utilisateur

  Besoin d’aide ?
  • Support : <URL_support>
  • Politique de confidentialité : <URL_confidentialite>
  ```
- **Catégorie** : Entreprise / Productivité
- **Limite d’âge** : PEGI 3 (à confirmer selon la modération)
- **Politique de confidentialité** : `<URL_confidentialite>`
- **Site web/Support** : `<URL_support>` ou `https://www.dolibarr.org`

---

## Média & assets requis
- Icône : `assets/icon.png` (1024×1024, sans coins arrondis).
- Splash / écran de démarrage : `assets/splash.png` (2048×2048).
- Captures d’écran suggérées :
  - Liste des produits / catalogue.
  - Écran d’encaissement avec panier et taxes.
  - Résumé des ventes du jour / historique.
  - Paramétrage de la connexion Dolibarr.
  - Vue tablette (si disponible) pour montrer la responsivité.

---

## Permissions & confidentialité (proposition)
- Permissions typiques : accès réseau pour l’API Dolibarr, stockage local (SQLite), stockage sécurisé des tokens (SecureStore).
- Données traitées : articles, clients, tickets, réglages POS synchronisés avec votre Dolibarr.
- Données stockées sur l’appareil : cache produit, paramètres de connexion, tickets récents si besoin.
- Aucune donnée partagée avec des tiers hors Dolibarr ; chiffrement TLS recommandé côté serveur.

---

## À personnaliser avant soumission
- Remplacer `<URL_support>` et `<URL_confidentialite>` par vos URLs.
- Vérifier les limites de caractères (titre, sous-titre, description courte).
- Relire la politique de confidentialité selon les flux de données réels.
- Adapter les captures d’écran finales aux résolutions exigées par Apple/Google.
