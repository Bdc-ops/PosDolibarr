# Guide de déploiement - Dolibarr CRM Mobile

## Préparation pour la production

### 1. Configuration de l'application

#### Mise à jour de app.json

Assurez-vous que les informations suivantes sont correctes dans `app.json` :

```json
{
  "expo": {
    "name": "Dolibarr CRM",
    "slug": "dolibarr-crm",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.votresociete.dolibarrcrm"
    },
    "android": {
      "package": "com.votresociete.dolibarrcrm"
    }
  }
}
```

### 2. Configuration des assets

#### Icônes et splash screens

1. Créez les icônes suivantes dans le dossier `assets/` :
   - `icon.png` (1024x1024px)
   - `adaptive-icon.png` (1024x1024px pour Android)
   - `splash.png` (1242x2436px)
   - `favicon.png` (48x48px pour web)

2. Utilisez un outil comme [App Icon Generator](https://www.appicon.co/) pour générer toutes les tailles nécessaires.

### 3. Variables d'environnement

Créez un fichier `.env` pour les variables d'environnement (optionnel) :

```
DOLIBARR_API_URL=https://votre-serveur.dolibarr.fr
```

### 4. Build pour Android

#### Prérequis
- Compte Google Play Developer
- Clé de signature Android

#### Étapes

1. **Créer un compte EAS (Expo Application Services)** :
```bash
npm install -g eas-cli
eas login
```

2. **Configurer le projet** :
```bash
eas build:configure
```

3. **Créer le build Android** :
```bash
eas build --platform android
```

4. **Télécharger et signer l'APK** :
   - Téléchargez le fichier APK depuis le dashboard Expo
   - Signez l'APK avec votre clé de signature
   - Uploadez sur Google Play Console

### 5. Build pour iOS

#### Prérequis
- Compte Apple Developer (99$/an)
- Certificat de développement iOS
- Provisioning profile

#### Étapes

1. **Configurer le projet iOS** :
```bash
eas build:configure
```

2. **Créer le build iOS** :
```bash
eas build --platform ios
```

3. **Soumission à l'App Store** :
   - Téléchargez le fichier IPA depuis le dashboard Expo
   - Utilisez Transporter ou Xcode pour soumettre à l'App Store

### 6. Configuration du serveur Dolibarr

#### Activer l'API REST

1. Dans Dolibarr, allez dans **Configuration > Modules** et activez le module **REST API**
2. Configurez les permissions API dans **Configuration > Sécurité > API**
3. Créez des utilisateurs API avec les permissions appropriées

#### Configuration HTTPS

Assurez-vous que votre serveur Dolibarr utilise HTTPS pour la sécurité des communications.

#### CORS (si nécessaire)

Si vous rencontrez des problèmes CORS, configurez les en-têtes appropriés sur votre serveur.

### 7. Tests avant déploiement

#### Checklist de tests

- [ ] Authentification fonctionne correctement
- [ ] Synchronisation des données fonctionne
- [ ] Mode offline fonctionne
- [ ] Géolocalisation fonctionne
- [ ] Création/modification de clients fonctionne
- [ ] Création de devis fonctionne
- [ ] Filtres et recherche fonctionnent
- [ ] Navigation fonctionne correctement
- [ ] Les logs sont enregistrés correctement
- [ ] La déconnexion fonctionne

### 8. Déploiement progressif

#### Phase 1 : Beta testing

1. Distribuez l'application à un groupe restreint d'utilisateurs
2. Collectez les retours et corrigez les bugs
3. Testez la synchronisation avec de vraies données

#### Phase 2 : Rollout progressif

1. Déployez progressivement à plus d'utilisateurs
2. Surveillez les logs et les erreurs
3. Ajustez selon les retours

#### Phase 3 : Déploiement complet

1. Mettez l'application à disposition de tous les utilisateurs
2. Continuez le monitoring et le support

### 9. Maintenance

#### Mises à jour

Pour publier une mise à jour :

```bash
# Mettre à jour la version dans app.json
eas build --platform android --auto-submit
eas build --platform ios --auto-submit
```

#### Monitoring

- Surveillez les logs dans l'application
- Surveillez les erreurs sur le serveur Dolibarr
- Collectez les retours utilisateurs

### 10. Sécurité

#### Bonnes pratiques

- Utilisez toujours HTTPS pour les communications
- Stockez les clés API de manière sécurisée
- Validez toutes les entrées utilisateur
- Mettez à jour régulièrement les dépendances
- Utilisez des certificats SSL valides

### Support

Pour toute question sur le déploiement, consultez :
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation EAS Build](https://docs.expo.dev/build/introduction/)
- [Documentation Dolibarr API](https://wiki.dolibarr.org/index.php/Module_API_REST)
