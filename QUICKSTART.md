# Guide de démarrage rapide - MediLink

## Installation rapide

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer l'API Dolibarr**
   
   Ouvrez `src/services/dolibarrApi.js` et modifiez la ligne :
   ```javascript
   const API_BASE_URL = 'https://votre-serveur-dolibarr.com/api/index.php';
   ```
   
   Remplacez par l'URL de votre serveur Dolibarr.

3. **Démarrer l'application**
   ```bash
   npm start
   ```
   
   Puis appuyez sur :
   - `i` pour iOS (nécessite Xcode)
   - `a` pour Android (nécessite Android Studio)
   - `w` pour le web

## Configuration Dolibarr

### Activer l'API REST

1. Dans Dolibarr, allez dans **Configuration > Modules**
2. Activez le module **API REST**
3. Créez une clé API dans **Configuration > Outils > Clés API**
4. Notez votre clé API

### Endpoints nécessaires

L'application utilise les endpoints suivants de l'API Dolibarr :

- `POST /api/index.php/login` - Authentification
- `POST /api/index.php/users` - Création de compte
- `GET /api/index.php/orders` - Liste des commandes
- `GET /api/index.php/orders/{id}` - Détails d'une commande
- `GET /api/index.php/deliveries` - Liste des livraisons
- `GET /api/index.php/deliveries/{id}` - Détails d'une livraison
- `GET /api/index.php/users/me` - Profil utilisateur
- `PUT /api/index.php/users/me` - Mise à jour du profil
- `POST /api/index.php/prescriptions/upload` - Upload d'ordonnance
- `POST /api/index.php/prescriptions/{id}/process` - Traitement d'ordonnance

**Note** : Certains endpoints peuvent nécessiter des modules ou des personnalisations spécifiques dans Dolibarr.

## Structure des données

### Format de réponse attendu pour les commandes

```json
{
  "id": 1,
  "ref": "CMD-001",
  "date_creation": "2024-01-15T10:30:00Z",
  "statut": "En attente",
  "total_ttc": 45.50,
  "nb_products": 3,
  "lines": [
    {
      "id": 1,
      "label": "Paracétamol 500mg",
      "qty": 2,
      "price": 5.50,
      "total_ttc": 11.00
    }
  ]
}
```

### Format de réponse attendu pour les livraisons

```json
{
  "id": 1,
  "tracking_number": "TRACK123456",
  "date_shipping": "2024-01-16T08:00:00Z",
  "estimated_delivery": "2024-01-20T12:00:00Z",
  "statut": "En transit",
  "destination": "123 Rue Example, 75001 Paris",
  "carrier": "La Poste"
}
```

## Test sur appareil physique

### iOS

1. Installez l'application Expo Go depuis l'App Store
2. Scannez le QR code affiché dans le terminal
3. L'application se chargera sur votre iPhone

### Android

1. Installez l'application Expo Go depuis le Play Store
2. Scannez le QR code affiché dans le terminal
3. L'application se chargera sur votre Android

## Dépannage

### Erreur de connexion API

- Vérifiez que l'URL de l'API est correcte
- Vérifiez que l'API REST est activée dans Dolibarr
- Vérifiez que votre clé API est valide
- Vérifiez les permissions CORS si nécessaire

### Erreur de caméra

- Sur iOS : Vérifiez les permissions dans Réglages > Confidentialité > Caméra
- Sur Android : Vérifiez les permissions dans Paramètres > Applications > MediLink > Autorisations

### Erreur de build

- Supprimez `node_modules` et `package-lock.json`
- Réinstallez avec `npm install`
- Nettoyez le cache Expo : `expo start -c`

## Prochaines étapes

1. Personnalisez le thème dans `src/theme/theme.js`
2. Adaptez les endpoints API selon votre configuration Dolibarr
3. Ajoutez vos propres images dans le dossier `assets/`
4. Configurez les notifications push si nécessaire
5. Testez sur différents appareils
