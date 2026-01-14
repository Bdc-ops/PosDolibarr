# 🍎 Configuration des credentials Apple pour l'App Store

## ❌ Erreur rencontrée

```
Invalid Apple App Store Connect App ID ("ascAppId") was specified.
Invalid Apple Team ID was specified.
```

## ✅ Solution : Configuration automatique

EAS peut configurer automatiquement vos credentials. Vous avez deux options :

### Option 1 : Laisser EAS configurer automatiquement (Recommandé)

Lorsque vous lancez la soumission, EAS vous guidera :

```bash
eas submit --platform ios --profile production
```

EAS vous demandera :
1. Votre Apple ID (email)
2. Votre mot de passe Apple
3. Il récupérera automatiquement l'App ID et Team ID

### Option 2 : Configuration manuelle dans eas.json

Si vous préférez configurer manuellement, voici comment obtenir les valeurs :

#### 1. Obtenir l'App Store Connect App ID (ascAppId)

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com)
2. Connectez-vous avec votre Apple ID
3. Allez dans "My Apps"
4. Sélectionnez votre app (ou créez-en une nouvelle)
5. L'App ID se trouve dans l'URL : `https://appstoreconnect.apple.com/apps/[APP_ID]/...`
   - Ou dans "App Information" → "Apple ID"
   - Format : uniquement des chiffres (ex: `1234567891`)

#### 2. Obtenir l'Apple Team ID

1. Allez sur [Apple Developer](https://developer.apple.com/account)
2. Connectez-vous
3. Allez dans "Membership"
4. Le Team ID se trouve dans "Team ID"
   - Format : 10 caractères majuscules/chiffres (ex: `AB32CZE81F`)

#### 3. Mettre à jour eas.json

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "votre@email.com",
        "ascAppId": "1234567891",
        "appleTeamId": "AB32CZE81F"
      }
    }
  }
}
```

## 🚀 Commande pour compiler et soumettre

Une fois configuré, utilisez :

```bash
eas build --platform ios --profile production --auto-submit
```

Ou séparément :

```bash
# 1. Compiler
eas build --platform ios --profile production

# 2. Soumettre (EAS configurera automatiquement si nécessaire)
eas submit --platform ios --profile production
```

## 📝 Notes importantes

- **Première fois** : EAS vous guidera pour configurer les credentials
- **App non créée** : Vous devrez d'abord créer l'app sur App Store Connect
- **Authentification** : EAS peut utiliser votre Apple ID ou une App-Specific Password

## 🔐 App-Specific Password (Recommandé)

Pour plus de sécurité, utilisez un App-Specific Password :

1. Allez sur [appleid.apple.com](https://appleid.apple.com)
2. Connectez-vous
3. "Sign-In and Security" → "App-Specific Passwords"
4. Créez un nouveau mot de passe pour "Expo EAS"
5. Utilisez ce mot de passe lors de la configuration EAS
