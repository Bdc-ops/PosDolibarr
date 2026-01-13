# 📱 Guide de Publication - iSales Dolibarr

Ce guide vous explique comment publier l'application sur Google Play Store et Apple App Store.

---

## 🚀 Prérequis

### Comptes Développeur
1. **Apple Developer Program** : 99$/an
   - 👉 [https://developer.apple.com/programs/](https://developer.apple.com/programs/)
   
2. **Google Play Console** : 25$ (paiement unique)
   - 👉 [https://play.google.com/console/signup](https://play.google.com/console/signup)

### Outils
```bash
# 1. Installer EAS CLI (Expo Application Services)
npm install -g eas-cli

# 2. Se connecter à votre compte Expo
eas login

# 3. Configurer le projet
cd /Users/fahd/myApp/dolibarr-mobile-app/dolibarr-mobile-app
eas init
```

---

## 📦 Étape 1 : Préparer les Assets

### 1.1 Icône de l'application (icon.png)
- **Taille** : 1024x1024 pixels
- **Format** : PNG avec transparence
- **Emplacement** : `./assets/icon.png`

### 1.2 Splash Screen (splash.png)
- **Taille** : 1284x2778 pixels (ou ratio 9:19.5)
- **Format** : PNG
- **Emplacement** : `./assets/splash.png`

### 1.3 Icône adaptative Android (adaptive-icon.png)
- **Taille** : 1024x1024 pixels
- **Format** : PNG avec transparence
- **Zone de sécurité** : Centrer le contenu dans un cercle de 66%
- **Emplacement** : `./assets/adaptive-icon.png`

**🎨 Générer automatiquement les assets :**
```bash
npx @expo/image-utils generate-icons ./assets/icon.png
```

---

## 🍎 Étape 2 : Publication iOS (Apple App Store)

### 2.1 Configuration Apple Developer

1. **Créer un App ID** dans [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
   - Identifiant : `com.isales.dolibarr`
   - Nom : iSales Dolibarr

2. **Configurer App Store Connect**
   - Aller sur [App Store Connect](https://appstoreconnect.apple.com)
   - Créer une nouvelle app
   - Bundle ID : `com.isales.dolibarr`
   - SKU : `isales-dolibarr-1`

3. **Mettre à jour app.json avec vos informations**
   ```json
   "ios": {
     "bundleIdentifier": "com.isales.dolibarr",
     "buildNumber": "1",
     "infoPlist": {
       "NSLocationWhenInUseUsageDescription": "Cette application utilise votre position GPS pour calculer les itinéraires vers les clients."
     }
   }
   ```

### 2.2 Build iOS

```bash
# Build pour production
eas build --platform ios --profile production

# Ou build pour test interne (TestFlight)
eas build --platform ios --profile preview
```

**⏱️ Temps estimé** : 10-20 minutes

### 2.3 Soumettre à l'App Store

**Option A : Automatique (recommandé)**
```bash
eas submit --platform ios --profile production
```

**Option B : Manuel**
1. Télécharger le fichier `.ipa` depuis Expo Dashboard
2. Uploader sur App Store Connect via Transporter
3. Soumettre pour review

### 2.4 Informations App Store

**Catégorie** : Productivité / Business  
**Mots-clés** : dolibarr, erp, crm, commercial, ventes, facturation  
**Description courte** (170 caractères max) :
```
Application mobile pour Dolibarr ERP/CRM. Gérez vos clients, produits, commandes et factures en déplacement.
```

**Description complète** :
```
iSales Dolibarr est l'application mobile professionnelle pour votre ERP/CRM Dolibarr.

FONCTIONNALITÉS :
• 📦 Gestion des produits et stocks
• 👥 Gestion des clients (prospects et clients)
• 📄 Création et suivi des commandes
• 💰 Gestion des factures
• 📊 Statistiques en temps réel
• 📍 Localisation GPS des clients
• 🔄 Synchronisation automatique
• 📴 Mode hors ligne

POUR QUI ?
• Commerciaux en déplacement
• Techniciens terrain
• Responsables commerciaux
• Équipes de vente

SÉCURITÉ :
• Connexion sécurisée par clé API
• Données chiffrées
• Compatible avec votre instance Dolibarr

Support : support@anexys.fr
```

**Screenshots** : Minimum 6 captures (iPhone 6.7" et iPad Pro 12.9")

---

## 🤖 Étape 3 : Publication Android (Google Play Store)

### 3.1 Configuration Google Play Console

1. **Créer une application** dans [Google Play Console](https://play.google.com/console)
   - Nom : iSales Dolibarr
   - Langue par défaut : Français (France)
   - Type : Application

2. **Configurer les détails de l'application**
   - Catégorie : Productivité
   - Package : `com.isales.dolibarr`

### 3.2 Créer une Clé de Signature

Google Play exige une clé de signature pour les builds AAB :

```bash
# Générer une clé de service
# (à faire depuis Google Play Console > API Access)
```

1. Aller dans **Google Play Console** > **Setup** > **API access**
2. Créer un compte de service
3. Télécharger le JSON : `google-service-account.json`
4. Placer le fichier à la racine du projet

### 3.3 Build Android

```bash
# Build AAB pour production
eas build --platform android --profile production

# Ou build APK pour test
eas build --platform android --profile preview
```

**⏱️ Temps estimé** : 10-15 minutes

### 3.4 Soumettre à Google Play

**Option A : Automatique (recommandé)**
```bash
eas submit --platform android --profile production
```

**Option B : Manuel**
1. Télécharger le fichier `.aab` depuis Expo Dashboard
2. Uploader dans Google Play Console > Production > Créer une version

### 3.5 Informations Google Play

**Titre** (30 caractères max) :
```
iSales Dolibarr
```

**Description courte** (80 caractères max) :
```
Application mobile pour Dolibarr ERP/CRM - Gestion commerciale terrain
```

**Description complète** (4000 caractères max) :
```
iSales Dolibarr est l'application mobile professionnelle pour votre ERP/CRM Dolibarr.

🚀 FONCTIONNALITÉS PRINCIPALES

📦 PRODUITS & STOCKS
• Consulter le catalogue complet
• Recherche avancée par catégorie et tag
• Visualisation du stock en temps réel
• Tri et filtres personnalisés

👥 GESTION CLIENTS
• Liste complète des clients et prospects
• Recherche instantanée
• Tri alphabétique ou par département
• Carte interactive avec géolocalisation
• Création et modification de fiches clients

📄 COMMANDES
• Création de commandes rapide
• Ajout de produits avec calcul automatique
• Choix du mode de paiement et livraison
• Notes publiques et privées
• Gestion des acomptes

💰 FACTURES
• Consultation des factures
• Filtres par statut (brouillon, validé, payé)
• Recherche par client ou référence
• Détails complets avec lignes

📊 STATISTIQUES
• Chiffre d'affaires mensuel
• Évolution des ventes sur 3 mois
• Meilleurs produits
• Meilleurs clients
• Graphiques interactifs

📍 FONCTIONNALITÉS TERRAIN
• Géolocalisation GPS
• Calcul d'itinéraires vers clients
• Mode hors ligne avec cache intelligent
• Synchronisation automatique

🔒 SÉCURITÉ & CONFIDENTIALITÉ
• Connexion sécurisée par clé API Dolibarr
• Données chiffrées en transit
• Compatible avec votre instance privée
• Aucune donnée stockée sur nos serveurs

✨ POURQUOI CHOISIR iSALES DOLIBARR ?

• Interface moderne et intuitive
• Compatible avec Dolibarr 13+ (LTS)
• Support technique réactif
• Mises à jour régulières
• Développé par des experts Dolibarr

👨‍💼 POUR QUI ?

• Commerciaux en déplacement
• Techniciens terrain
• Responsables commerciaux
• Équipes de vente B2B
• Agents de maintenance

📞 SUPPORT

Email : support@anexys.fr
Site web : https://anexys.fr

⚠️ PRÉREQUIS

• Instance Dolibarr accessible (version 13 ou supérieure)
• Clé API Dolibarr active
• Connexion internet (mode hors ligne disponible)

Développé avec ❤️ par Anexys
```

**Screenshots** : Minimum 2 captures (téléphone + tablette optionnel)

---

## 📸 Étape 4 : Préparer les Screenshots

### iOS Screenshots (6.7" - iPhone 14 Pro Max)
- **Résolution** : 1290 x 2796 pixels
- **Nombre minimum** : 3 (recommandé : 6-8)

### Android Screenshots (Téléphone)
- **Résolution** : 1080 x 1920 pixels minimum
- **Nombre minimum** : 2 (recommandé : 4-8)

**🎯 Screenshots recommandés :**
1. Dashboard / Accueil
2. Liste des produits
3. Fiche client
4. Création de commande
5. Liste des factures
6. Statistiques

**Outil recommandé** : [Figma](https://figma.com) ou [Canva](https://canva.com)

---

## 🔄 Étape 5 : Workflow de Mise à Jour

### Incrémenter la version

**Pour iOS** (dans `app.json`) :
```json
{
  "version": "1.0.1",
  "ios": {
    "buildNumber": "2"
  }
}
```

**Pour Android** (dans `app.json`) :
```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

### Build et publication automatique

```bash
# Build et soumission en une commande
eas build --platform all --profile production --auto-submit
```

---

## 📋 Checklist Avant Publication

### ✅ Technique
- [ ] `app.json` configuré avec les bons identifiants
- [ ] Assets générés (icon, splash, adaptive-icon)
- [ ] Tests effectués sur iOS et Android
- [ ] Clés API de test retirées
- [ ] Version et build number incrémentés
- [ ] Permissions expliquées dans les descriptions

### ✅ Contenu Store
- [ ] Description rédigée en français et anglais
- [ ] Screenshots de qualité (6-8 par plateforme)
- [ ] Mots-clés optimisés pour le SEO
- [ ] Coordonnées de support valides
- [ ] Politique de confidentialité publiée
- [ ] Vidéo de présentation (optionnel mais recommandé)

### ✅ Légal
- [ ] Politique de confidentialité
- [ ] Conditions d'utilisation
- [ ] Mentions légales
- [ ] RGPD (si applicable)

---

## 🛠️ Commandes Utiles

```bash
# Vérifier la configuration
eas config

# Voir les builds en cours
eas build:list

# Annuler un build
eas build:cancel

# Voir les soumissions
eas submit:list

# Mettre à jour les métadonnées
eas metadata:push

# Générer un build local (pour tests)
eas build --platform ios --local
eas build --platform android --local
```

---

## 🐛 Problèmes Courants

### iOS : "Missing compliance"
**Solution** : Dans App Store Connect, déclarer que l'app n'utilise pas de cryptographie autre que HTTPS.

### Android : "Google Play signing not configured"
**Solution** : Activer "Google Play App Signing" dans Play Console > Setup > App signing.

### Build échoue : "Invalid bundle identifier"
**Solution** : Vérifier que le `bundleIdentifier` dans `app.json` correspond à celui dans Apple Developer Portal.

### Soumission échouée : "Missing screenshots"
**Solution** : Uploader au moins le nombre minimum de screenshots requis.

---

## 📞 Support

- **Email** : support@anexys.fr
- **Documentation Expo** : [https://docs.expo.dev/](https://docs.expo.dev/)
- **EAS Build Docs** : [https://docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/)
- **EAS Submit Docs** : [https://docs.expo.dev/submit/introduction/](https://docs.expo.dev/submit/introduction/)

---

## 🎉 Félicitations !

Une fois l'application approuvée (délai : 1-3 jours pour Apple, quelques heures pour Google), elle sera disponible sur les stores !

**Partagez votre app** :
- iOS : `https://apps.apple.com/app/id[YOUR_APP_ID]`
- Android : `https://play.google.com/store/apps/details?id=com.isales.dolibarr`

