# Debug et Corrections - Calendrier et Modes de Règlement

## 🐛 Problèmes identifiés

### 1. Calendrier ne disparaît pas après sélection
**Symptôme** : Le DatePicker reste affiché même après avoir sélectionné une date.

**Hypothèses** :
- **A** : Le comportement iOS/Android diffère (iOS garde le picker ouvert, Android le ferme)
- **B** : Le callback `onChange` ne ferme pas le picker correctement
- **C** : L'événement `type` n'est pas vérifié (peut être "set", "dismissed", etc.)

**Corrections appliquées** :
```typescript
// Fermeture immédiate sur Android
if (Platform.OS === "android") {
  setShowDatePicker(false)
}

// Sur iOS, vérifier l'événement avant de fermer
if (selectedDate && event.type === "set") {
  setDeliveryDate(selectedDate)
  if (Platform.OS === "ios") {
    setShowDatePicker(false)
  }
}
```

**Instrumentation ajoutée** :
- Log à l'entrée du `onChange` avec platform, eventType, hasDate
- Log après sélection de la date avec l'ISO string

---

### 2. Modes de règlement non mis à jour dans l'API
**Symptôme** : Les modes de paiement et livraison ne sont pas enregistrés dans Dolibarr.

**Hypothèses** :
- **D** : Les noms de champs ne correspondent pas à ceux attendus par l'API Dolibarr
- **E** : La conversion en nombre ne fonctionne pas correctement
- **F** : Dolibarr attend plusieurs variations de noms de champs selon les versions

**Noms de champs testés** :

#### Mode de paiement
```typescript
order.mode_reglement_id = paymentId      // Nom standard
order.cond_reglement_id = paymentId      // Conditions de règlement
order.mode_reglement = paymentId         // Variante courte
```

#### Mode de livraison
```typescript
order.shipping_method_id = shippingId    // Nom standard
order.shipping_method = shippingId       // Variante courte
```

**Instrumentation ajoutée** :
- Log de la valeur originale (string)
- Log de la valeur convertie (number)
- Log des noms de champs utilisés
- Log avant l'appel API avec tous les champs de la commande
- Log après l'appel API avec le résultat (success/error)

---

## 📊 Points de log ajoutés

### DatePicker (Hypothèses A, B, C)
1. **CreateOrderScreen.tsx:377** - `DatePicker onChange`
   - Données : platform, eventType, hasDate
   
2. **CreateOrderScreen.tsx:390** - `Date selected`
   - Données : date ISO

### Modes de règlement (Hypothèses D, E, F)
3. **CreateOrderScreen.tsx:210** - `Payment mode added`
   - Données : originalValue, convertedValue, fieldNames

4. **CreateOrderScreen.tsx:225** - `Shipping mode added`
   - Données : originalValue, convertedValue, fieldNames

5. **CreateOrderScreen.tsx:243** - `Before API call`
   - Données : orderFields, hasModeReglement, hasShippingMethod, valeurs

6. **CreateOrderScreen.tsx:251** - `After API call`
   - Données : success, error

---

## 🧪 Tests à effectuer

### Test 1 : Calendrier
1. Ouvrir le formulaire de création de commande
2. Cliquer sur "Sélectionner une date"
3. Vérifier le log `DatePicker onChange` avec eventType
4. Sélectionner une date
5. Vérifier le log `Date selected`
6. **Vérifier que le calendrier se ferme**
7. Vérifier que la date s'affiche au format français

### Test 2 : Modes de règlement
1. Sélectionner un mode de paiement (ex: "Carte bancaire")
2. Vérifier le log `Payment mode added` avec conversion
3. Sélectionner un mode de livraison (ex: "Transporteur")
4. Vérifier le log `Shipping mode added` avec conversion
5. Remplir le reste du formulaire
6. Créer la commande
7. Vérifier le log `Before API call` pour confirmer les champs
8. Vérifier le log `After API call` pour le résultat
9. **Vérifier dans Dolibarr** que les modes sont bien enregistrés

---

## 📝 Noms de champs Dolibarr

### Selon la documentation Dolibarr API

| Champ mobile | Champ API Dolibarr | Type | Notes |
|--------------|-------------------|------|-------|
| `mode_reglement_id` | `mode_reglement_id` | int | Mode de paiement (CB, Chèque, etc.) |
| | `cond_reglement_id` | int | Conditions de règlement (alternative) |
| | `mode_reglement` | int | Variante courte |
| `shipping_method_id` | `shipping_method_id` | int | Mode d'expédition |
| | `shipping_method` | int | Variante courte |
| `date_livraison` | `date_livraison` | timestamp | Date de livraison souhaitée |
| `deposit_percent` | `deposit_percent` | float | Acompte en pourcentage |
| `deposit_amount` | `deposit_amount` | float | Acompte en montant fixe |

**Note** : Nous envoyons plusieurs variantes pour garantir la compatibilité avec différentes versions de Dolibarr.

---

## ✅ Résultats attendus

### Calendrier
- ✅ Le calendrier se ferme automatiquement après sélection
- ✅ Comportement correct sur iOS et Android
- ✅ La date est enregistrée au bon format

### Modes de règlement
- ✅ Les valeurs sont converties en nombres
- ✅ Tous les noms de champs possibles sont envoyés
- ✅ Les modes sont correctement enregistrés dans Dolibarr
- ✅ Aucune erreur API

---

## 🔍 Analyse des logs

Après exécution, vérifier dans le fichier `/Users/fahd/myApp/dolibarr-mobile-app/.cursor/debug.log` :

1. **Calendrier** :
   ```json
   {"location":"CreateOrderScreen.tsx:377","message":"DatePicker onChange","data":{"platform":"ios","eventType":"set","hasDate":true}}
   {"location":"CreateOrderScreen.tsx:390","message":"Date selected","data":{"date":"2024-12-31T23:00:00.000Z"}}
   ```

2. **Modes de règlement** :
   ```json
   {"location":"CreateOrderScreen.tsx:210","message":"Payment mode added","data":{"originalValue":"1","convertedValue":1,"fieldNames":["mode_reglement_id","cond_reglement_id","mode_reglement"]}}
   {"location":"CreateOrderScreen.tsx:225","message":"Shipping mode added","data":{"originalValue":"2","convertedValue":2,"fieldNames":["shipping_method_id","shipping_method"]}}
   {"location":"CreateOrderScreen.tsx:243","message":"Before API call","data":{"hasModeReglement":true,"hasShippingMethod":true,"modeReglementValue":1,"shippingMethodValue":2}}
   ```

