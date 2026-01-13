# 🎯 Guide d'utilisation avec Cursor AI

## 📝 Prompts essentiels pour Cursor

### 1. Comprendre le code
```
@Codebase Explique-moi comment fonctionne la création de commandes
```

### 2. Ajouter une fonctionnalité
```
Dans src/api/products.ts, ajoute une fonction pour filtrer les produits par prix minimum et maximum
```

### 3. Créer un nouveau composant
```
Crée un composant React Native ProductCard dans src/components/ProductCard.tsx qui affiche :
- L'image du produit
- Le nom
- Le prix
- Le stock disponible
- Un bouton "Ajouter au panier"
```

### 4. Créer un nouvel écran
```
Crée un écran StatsScreen.tsx qui affiche :
- Le CA du mois en cours
- Le nombre de commandes
- Les 5 meilleurs produits
- Un graphique des ventes
```

### 5. Débugger une erreur
```
@Codebase J'ai une erreur "Network Error" quand je crée une commande. Peux-tu m'aider ?
```

### 6. Optimiser les performances
```
@Codebase Comment optimiser le chargement de la liste des produits avec pagination et cache ?
```

### 7. Ajouter une validation
```
Dans src/api/orders.ts, ajoute une validation pour vérifier que :
- La commande a au moins 1 ligne
- Toutes les quantités sont > 0
- Le client est sélectionné
```

### 8. Gérer le mode offline
```
Ajoute un système de cache avec AsyncStorage pour permettre de consulter les produits hors ligne
```

### 9. Améliorer l'UX
```
Ajoute des animations avec react-native-reanimated pour les transitions entre écrans
```

### 10. Tests
```
Crée des tests unitaires avec Jest pour les fonctions de l'API products
```

## 🔧 Commandes Cursor utiles

### Cmd/Ctrl + K
Ouvre la barre de commande pour des modifications rapides

### Cmd/Ctrl + L
Ouvre le chat Cursor dans la sidebar

### Cmd/Ctrl + I
Génère du code inline

### Cmd/Ctrl + Shift + L
Ouvre le terminal Cursor

## 💡 Astuces Cursor

1. **Utiliser @Codebase** pour référencer tout le projet
2. **Utiliser @filename** pour référencer un fichier spécifique
3. **Utiliser @docs** pour accéder à la documentation
4. **Utiliser @web** pour chercher des infos en ligne

## 📋 Exemples de workflows

### Workflow 1 : Ajouter un nouveau module
```
1. "@Codebase Crée la structure pour un module de gestion des devis"
2. "Ajoute les types TypeScript pour les devis dans src/types/dolibarr.types.ts"
3. "Crée l'API dans src/api/quotes.ts avec les fonctions CRUD"
4. "Crée un hook useQuotes dans src/hooks/useDolibarr.ts"
5. "Crée l'écran QuotesScreen.tsx"
```

### Workflow 2 : Débugger et corriger
```
1. "J'ai une erreur [copier l'erreur]"
2. "@Codebase Trouve la cause de cette erreur"
3. "Propose-moi 3 solutions pour corriger ça"
4. "Implémente la solution 2"
```

### Workflow 3 : Refactoring
```
1. "@Codebase Analyse le code de src/api/products.ts"
2. "Quelles améliorations suggères-tu ?"
3. "Refactorise ce fichier en suivant les meilleures pratiques"
```

## 🎨 Personnalisation

### Changer le thème
```
Modifie les couleurs dans src/theme/colors.ts pour utiliser les couleurs de ma marque : #FF6B35, #004E89
```

### Ajouter une langue
```
Ajoute le support de l'espagnol avec i18next dans src/i18n/
```

### Modifier le logo
```
Remplace le logo dans assets/logo.png et mets à jour app.json
