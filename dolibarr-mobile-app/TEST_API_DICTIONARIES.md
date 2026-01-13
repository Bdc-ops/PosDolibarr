# Test des endpoints API Dolibarr pour les dictionnaires

## 🔍 Nouvelles hypothèses

### Hypothèse G : Endpoints API incorrects
L'API Dolibarr n'expose pas `/setup/dictionary/payment_types` mais un autre endpoint.

**Endpoints possibles** :
- `/setup/dictionary/payment_types` (actuel)
- `/setup/dictionaries/payment_types`
- `/dictionaries/payment_types`
- `/c_paiement` (table directe)
- `/setup/dictionary/c_paiement`

### Hypothèse H : Les données sont récupérées mais mal filtrées
L'API retourne des données mais le filtre `active === "1"` est trop strict.

**Vérifications** :
- Vérifier si `active` peut être `true`, `"true"`, `1`, `"1"`, ou autre
- Vérifier la structure complète de la réponse

### Hypothèse I : loadDictionaries échoue silencieusement
La fonction `loadDictionaries()` échoue mais ne met pas à jour les states, donc rien ne s'affiche.

**Vérifications** :
- Vérifier si les Promise.all réussissent
- Vérifier si les setters de state sont appelés
- Vérifier le contenu exact chargé

### Hypothèse J : Erreur d'authentification ou de permissions
L'API nécessite des permissions spécifiques pour accéder aux dictionnaires.

**Vérifications** :
- Code d'erreur 401/403
- Message d'erreur spécifique Dolibarr

---

## 📊 Points d'instrumentation ajoutés

### Dans `dictionaries.ts`

1. **Ligne 20** - `START getPaymentTypes`
   - Entrée dans la fonction

2. **Ligne 28** - `API response received`
   - Données : isArray, length, firstItem
   - Vérifie si la réponse est un tableau et son contenu

3. **Ligne 36** - `Payment types filtered`
   - Données : originalCount, filteredCount, items (id + label)
   - Vérifie combien d'éléments sont filtrés

4. **Ligne 44** - `ERROR getPaymentTypes`
   - Données : errorMessage, errorCode, errorStatus
   - Capture l'erreur exacte de l'API

5. **Ligne 60** - `Using fallback payment types`
   - Données : count
   - Confirme l'utilisation du fallback

6. **Ligne 71** - `START getShippingMethods`
   - Entrée dans la fonction

7. **Ligne 79** - `Shipping API response`
   - Données : isArray, length, firstItem

8. **Ligne 87** - `Shipping methods filtered`
   - Données : originalCount, filteredCount, items

9. **Ligne 95** - `ERROR getShippingMethods`
   - Données : errorMessage, errorCode, errorStatus

10. **Ligne 111** - `Using fallback shipping methods`
    - Données : count

### Dans `CreateOrderScreen.tsx`

11. **Ligne 50** - `START loadDictionaries`
    - Entrée dans loadDictionaries

12. **Ligne 62** - `Dictionaries loaded`
    - Données : paymentsCount, shippingCount, firstPayment, firstShipping

13. **Ligne 72** - `State updated`
    - Confirme que setState a été appelé

14. **Ligne 81** - `Default payment selected`
    - Données : selectedId, selectedLabel

15. **Ligne 88** - `Default shipping selected`
    - Données : selectedId, selectedLabel

16. **Ligne 95** - `ERROR loadDictionaries`
    - Données : errorMessage

---

## 🧪 Scénarios de test

### Scénario 1 : API fonctionne correctement
**Logs attendus** :
```
START getPaymentTypes
API response received (isArray=true, length=5)
Payment types filtered (originalCount=5, filteredCount=5)
START getShippingMethods
Shipping API response (isArray=true, length=5)
Shipping methods filtered (originalCount=5, filteredCount=5)
Dictionaries loaded (paymentsCount=5, shippingCount=5)
State updated
Default payment selected
Default shipping selected
```

### Scénario 2 : API échoue, fallback utilisé
**Logs attendus** :
```
START getPaymentTypes
ERROR getPaymentTypes (errorCode=404)
Using fallback payment types (count=5)
START getShippingMethods
ERROR getShippingMethods (errorCode=404)
Using fallback shipping methods (count=5)
Dictionaries loaded (paymentsCount=5, shippingCount=5)
State updated
Default payment selected
Default shipping selected
```

### Scénario 3 : API retourne des données vides
**Logs attendus** :
```
START getPaymentTypes
API response received (isArray=true, length=0)
Payment types filtered (originalCount=0, filteredCount=0)
START getShippingMethods
Shipping API response (isArray=true, length=0)
Shipping methods filtered (originalCount=0, filteredCount=0)
Dictionaries loaded (paymentsCount=0, shippingCount=0)
State updated
(pas de default selected)
```

---

## 🔧 Solutions alternatives

Si l'API Dolibarr ne fonctionne pas, essayer ces endpoints alternatifs :

### Pour les modes de paiement
```typescript
// Option 1 : Table c_paiement directement
const response = await dolibarrClient.get("/c_paiement")

// Option 2 : Via setup
const response = await dolibarrClient.get("/setup/dictionary/c_paiement")

// Option 3 : Dictionnaires généraux
const response = await dolibarrClient.get("/dictionaries/payment_types")
```

### Pour les modes d'expédition
```typescript
// Option 1 : Table c_shipment_mode
const response = await dolibarrClient.get("/c_shipment_mode")

// Option 2 : Via setup
const response = await dolibarrClient.get("/setup/dictionary/c_shipment_mode")

// Option 3 : shipping_mode (variante)
const response = await dolibarrClient.get("/setup/dictionary/shipping_mode")
```

---

## ✅ Prochaines étapes

1. Lancer l'app et aller sur le formulaire de commande
2. Vérifier les logs dans `/Users/fahd/myApp/dolibarr-mobile-app/.cursor/debug.log`
3. Identifier quel scénario se produit
4. Si erreur 404 : tester les endpoints alternatifs
5. Si données vides : vérifier la configuration Dolibarr
6. Si fallback utilisé : vérifier que les boutons s'affichent quand même

