# Formulaire de Création de Commande - Documentation

## Nouveaux champs ajoutés

### 1. **Date de livraison souhaitée**
- Format: `JJ/MM/AAAA`
- Type: `TextInput`
- Champ API: `date_livraison` (timestamp Unix)
- Optionnel

### 2. **Mode de paiement**
- Source: API Dolibarr `/setup/dictionary/payment_types`
- Affichage: Boutons horizontaux sélectionnables
- Champ API: `mode_reglement_id`
- Modes par défaut (fallback si API inaccessible):
  - Carte bancaire (CB)
  - Chèque (CHQ)
  - Virement (VIR)
  - Espèces (LIQ)
  - Paiement en ligne (VAD)

### 3. **Mode de livraison**
- Source: API Dolibarr `/setup/dictionary/shipping_methods`
- Affichage: Boutons horizontaux sélectionnables
- Champ API: `shipping_method_id`
- Modes par défaut (fallback si API inaccessible):
  - Transporteur (TRANS)
  - Colissimo (COLISSIMO)
  - Chronopost (CHRONO)
  - Retrait sur place (RETRAIT)
  - Remise en main propre (MAIN)

### 4. **Note publique**
- Visible par le client sur la commande
- Type: `TextInput` multiligne (3 lignes)
- Champ API: `note_public`
- Optionnel

### 5. **Note privée**
- Interne uniquement, non visible par le client
- Type: `TextInput` multiligne (3 lignes)
- Champ API: `note_private`
- Optionnel

### 6. **Acompte (%)**
- Pourcentage d'acompte demandé
- Type: `TextInput` numérique
- Champ API: `deposit_percent`
- Format: Nombre décimal (ex: 30 pour 30%)
- Optionnel

## Fichiers modifiés

### Nouveaux fichiers
- `src/api/dictionaries.ts` : API pour récupérer les modes de paiement et de livraison

### Fichiers mis à jour
- `src/screens/CreateOrderScreen.tsx` : Interface utilisateur enrichie
- `src/types/dolibarr.types.ts` : Types Order mis à jour avec les nouveaux champs

## Structure visuelle

Le formulaire est organisé en sections claires :

1. **Client** (existant)
2. **Ajouter des produits** (existant)
3. **Produits sélectionnés** (existant)
4. **Informations complémentaires** (NOUVEAU)
   - Date de livraison
   - Mode de paiement (scroll horizontal)
   - Mode de livraison (scroll horizontal)
   - Acompte
5. **Notes** (NOUVEAU)
   - Note publique
   - Note privée
6. **Totaux** (existant)

## Style

- Boxes de sélection avec bordure pour les modes de paiement/livraison
- Box sélectionnée : fond bleu (#0B5FFF) avec texte blanc
- Box non sélectionnée : fond blanc transparent avec bordure grise
- Labels clairs au-dessus de chaque champ
- Zones de texte multiligne pour les notes

## API Dolibarr

### Endpoints utilisés
- `GET /setup/dictionary/payment_types` : Liste des modes de paiement
- `GET /setup/dictionary/shipping_methods` : Liste des modes d'expédition
- `POST /orders` : Création de commande avec les nouveaux champs

### Fallback
Si les endpoints des dictionnaires ne sont pas accessibles, l'application utilise des valeurs par défaut prédéfinies pour ne pas bloquer l'utilisateur.

## Test

Pour tester le formulaire enrichi :
1. Lancer l'application : `npx expo start`
2. Naviguer vers "Commandes"
3. Cliquer sur le bouton "+" pour créer une nouvelle commande
4. Remplir tous les nouveaux champs
5. Vérifier que la commande est créée avec succès dans Dolibarr

