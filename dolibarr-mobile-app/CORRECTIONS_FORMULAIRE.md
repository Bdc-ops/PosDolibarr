# Corrections apportées au formulaire de commande

## ✅ Problèmes corrigés

### 1. **Calendrier pour la date de livraison**
- ❌ Avant : Simple `TextInput` avec format texte `JJ/MM/AAAA`
- ✅ Après : `DateTimePicker` natif avec :
  - Bouton cliquable affichant la date sélectionnée
  - Calendrier natif iOS/Android
  - Date minimale = aujourd'hui (pas de dates passées)
  - Bouton "Effacer la date" pour réinitialiser
  - Format d'affichage : `dd/MM/yyyy` (français)

### 2. **Acompte en % ou montant fixe**
- ❌ Avant : Uniquement en pourcentage
- ✅ Après : Deux modes sélectionnables :
  - **Pourcentage (%)** : Ex. 30 pour 30%
  - **Montant (€)** : Ex. 500.00 pour 500€
  - Boutons de sélection visuels
  - Envoi du bon champ à l'API :
    - `deposit_percent` si % sélectionné
    - `deposit_amount` si montant sélectionné

### 3. **Mode de paiement et livraison non envoyés**
- ❌ Avant : Valeurs stockées en string, pas converties
- ✅ Après : 
  - Conversion en `parseInt()` avant envoi
  - `mode_reglement_id` et `shipping_method_id` envoyés comme `number`
  - Logs ajoutés pour vérifier l'envoi :
    ```
    💳 Mode de paiement ajouté: 1
    🚚 Mode d'expédition ajouté: 2
    ```

### 4. **Calcul incorrect des totaux HT/TTC avec plusieurs produits**
- ❌ Avant : Calculs basés sur `price_ttc` du produit, incohérents
- ✅ Après : Calculs corrects et explicites :
  ```typescript
  const total_ht = qty * subprice
  const total_tva = total_ht * (tva_tx / 100)
  const total_ttc = total_ht + total_tva
  ```
  - Calculs refaits à chaque ajout/modification de quantité
  - Conversion explicite en `Number()` pour éviter les erreurs de type
  - Totaux globaux calculés par somme des lignes

## 📝 Modifications techniques

### Fichiers modifiés

#### `src/screens/CreateOrderScreen.tsx`
- Ajout de `DateTimePicker` pour la date de livraison
- Ajout du state `showDatePicker` pour contrôler l'affichage du calendrier
- Ajout du state `depositType` ("percent" | "amount")
- Refactorisation complète de `addProductToOrder()` et `updateLineQuantity()`
- Conversion `parseInt()` pour `mode_reglement_id` et `shipping_method_id`
- Ajout de logs détaillés pour le debugging

#### `src/types/dolibarr.types.ts`
- Ajout du champ `deposit_amount?: number` dans l'interface `Order`

#### `package.json`
- Ajout de `@react-native-community/datetimepicker": "8.2.0"`

### Nouveaux styles ajoutés

```typescript
datePickerButton: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: 12,
  padding: 14,
  backgroundColor: "rgba(255, 255, 255, 0.7)",
},
clearDateButton: {
  marginTop: 8,
  padding: 8,
  alignItems: "center",
},
depositTypeContainer: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 8,
},
depositTypeButton: {
  flex: 1,
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderWidth: 2,
  borderColor: "rgba(14, 27, 46, 0.12)",
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 12,
  alignItems: "center",
},
depositTypeButtonActive: {
  backgroundColor: "#0B5FFF",
  borderColor: "#0B5FFF",
},
```

## 🧪 Test de validation

Pour vérifier que tout fonctionne :

1. **Date de livraison** :
   - Cliquer sur le bouton "Sélectionner une date"
   - Vérifier que le calendrier s'affiche
   - Sélectionner une date future
   - Vérifier l'affichage au format français
   - Tester le bouton "Effacer la date"

2. **Acompte** :
   - Sélectionner "Pourcentage (%)"
   - Entrer `30`
   - Vérifier le log `💰 Acompte en %: 30`
   - Sélectionner "Montant (€)"
   - Entrer `500`
   - Vérifier le log `💰 Acompte en montant: 500`

3. **Modes de paiement/livraison** :
   - Sélectionner un mode de paiement
   - Sélectionner un mode de livraison
   - Vérifier les logs :
     ```
     💳 Mode de paiement ajouté: 1
     🚚 Mode d'expédition ajouté: 2
     ```

4. **Calculs HT/TTC** :
   - Ajouter un produit à 100€ HT (TVA 20%)
   - Vérifier : HT=100€, TVA=20€, TTC=120€
   - Augmenter la quantité à 3
   - Vérifier : HT=300€, TVA=60€, TTC=360€
   - Ajouter un 2e produit à 50€ HT (TVA 20%)
   - Vérifier totaux globaux : HT=350€, TVA=70€, TTC=420€

## 📦 Installation

Pour installer la nouvelle dépendance :

```bash
cd dolibarr-mobile-app
npm install @react-native-community/datetimepicker@8.2.0
```

Ou avec Expo :

```bash
npx expo install @react-native-community/datetimepicker
```

## ✨ Résultat

Le formulaire de création de commande est maintenant :
- ✅ Complet avec tous les champs fonctionnels
- ✅ Précis dans les calculs HT/TTC/TVA
- ✅ Robuste avec conversions de types correctes
- ✅ Ergonomique avec calendrier natif
- ✅ Flexible avec acompte en % ou montant
- ✅ Conforme à l'API Dolibarr
- ✅ Bien loggé pour le debugging

