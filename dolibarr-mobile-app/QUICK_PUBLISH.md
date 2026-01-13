# 🚀 Publication Rapide - iSales Dolibarr

## ⚡ Démarrage Rapide (5 minutes)

### Étape 1 : Installer EAS CLI
```bash
npm install -g eas-cli
```

### Étape 2 : Se connecter
```bash
eas login
# Créez un compte sur https://expo.dev si vous n'en avez pas
```

### Étape 3 : Initialiser le projet
```bash
cd /Users/fahd/myApp/dolibarr-mobile-app/dolibarr-mobile-app
eas init
```

### Étape 4 : Premier Build
```bash
# iOS
npm run build:ios

# Android
npm run build:android

# Les deux en même temps
npm run build:all
```

---

## 📱 Commandes Rapides

```bash
# Builds
npm run build:ios          # Build iOS
npm run build:android      # Build Android
npm run build:all          # Build iOS + Android

# Soumissions
npm run submit:ios         # Soumettre à App Store
npm run submit:android     # Soumettre à Google Play
npm run submit:all         # Soumettre aux deux stores
```

---

## ✅ Checklist Avant Première Publication

### 1. Assets (Obligatoire)
- [ ] `./assets/icon.png` (1024x1024)
- [ ] `./assets/splash.png` (1284x2778)
- [ ] `./assets/adaptive-icon.png` (1024x1024)

**Vous pouvez utiliser des outils en ligne comme** :
- https://www.appicon.co/
- https://hotpot.ai/icon-resizer

### 2. Configurations
- [ ] Modifier `app.json` : Remplacer `YOUR_PROJECT_ID_HERE` par votre ID Expo
- [ ] Modifier `eas.json` : Remplacer les placeholders Apple/Google

### 3. Comptes Développeur
- [ ] Compte Apple Developer (99$/an)
- [ ] Compte Google Play Console (25$ unique)

### 4. Informations Store
- [ ] Préparer 6-8 screenshots
- [ ] Rédiger description (voir PUBLICATION_GUIDE.md)
- [ ] Politique de confidentialité (PRIVACY_POLICY.md déjà créée)

---

## 🎯 Workflow Recommandé

### Pour la première fois
1. Build de test (preview) pour vérifier
```bash
eas build --platform all --profile preview
```

2. Tester l'APK/IPA générée

3. Build de production
```bash
npm run build:all
```

4. Soumettre aux stores
```bash
npm run submit:all
```

---

## 📦 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `eas.json` | Configuration des builds EAS |
| `PUBLICATION_GUIDE.md` | Guide complet étape par étape |
| `PRIVACY_POLICY.md` | Politique de confidentialité RGPD |
| `QUICK_PUBLISH.md` | Ce fichier (démarrage rapide) |

---

## 🔗 Liens Utiles

- **Expo Dashboard** : https://expo.dev/accounts/[username]/projects/isales-dolibarr
- **Apple Developer** : https://developer.apple.com/account
- **Google Play Console** : https://play.google.com/console
- **App Store Connect** : https://appstoreconnect.apple.com

---

## 💡 Conseils

1. **Commencez par Android** : Plus rapide à valider (~2-4h)
2. **TestFlight** : Utilisez-le pour iOS avant la soumission finale
3. **Versionnement** : Incrémentez toujours la version avant un nouveau build
4. **Screenshots** : Prenez-les sur un vrai device pour plus de réalisme

---

## 🆘 Besoin d'aide ?

1. Lisez le guide complet : `PUBLICATION_GUIDE.md`
2. Documentation Expo : https://docs.expo.dev/build/introduction/
3. Support : support@anexys.fr

---

**Bonne publication ! 🎉**

