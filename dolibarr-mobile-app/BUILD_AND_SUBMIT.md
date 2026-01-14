# 🍎 Guide de compilation et soumission sur l'App Store

## 📦 Compilation iOS

```bash
eas build --platform ios --profile production
```

**Durée estimée :** 10-20 minutes

**Suivi :** Les logs sont disponibles sur https://expo.dev

## 📤 Soumission à l'App Store

### Option 1 : Soumission manuelle (après compilation)

```bash
eas submit --platform ios --profile production
```

### Option 2 : Compilation + soumission automatique (recommandé)

```bash
eas build --platform ios --profile production --auto-submit
```

Cette commande compile ET soumet automatiquement une fois la compilation terminée.

## 📊 Vérifier l'état

```bash
# Liste des dernières compilations
eas build:list --platform ios --limit 5

# Détails d'une compilation spécifique
eas build:view [BUILD_ID]
```

## ⚙️ Configuration requise

Assurez-vous que `eas.json` contient vos credentials Apple :

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "votre@email.com",
        "ascAppId": "VOTRE_APP_ID",
        "appleTeamId": "VOTRE_TEAM_ID"
      }
    }
  }
}
```

## 🔐 Authentification Apple

Si c'est la première fois, vous devrez peut-être vous authentifier :

```bash
eas submit --platform ios
```

EAS vous guidera pour configurer vos credentials.

## ✅ Après la soumission

1. Vérifiez sur [App Store Connect](https://appstoreconnect.apple.com)
2. L'application sera en "Waiting for Review"
3. Le processus de review prend généralement 24-48h
