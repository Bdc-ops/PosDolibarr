# 🚀 Optimisation Lazy Loading - Guide d'Implémentation

## 🎯 Objectifs

1. **Chargement initial rapide** : 25 documents pour affichage immédiat
2. **Chargement progressif en background** : Le reste se charge automatiquement
3. **Scroll infini** : Plus de données au scroll de l'utilisateur
4. **Préchargement stats** : Données statistiques chargées au lancement

---

## 📊 Stratégie de Chargement

### Phase 1 : Affichage Initial (< 1 seconde)
```
Chargement : 25 documents
Affichage : Immédiat
État : "Chargement des produits..."
```

### Phase 2 : Background Automatique (silencieux)
```
Chargement : 50 documents par page
Pages : Jusqu'à 500 documents total
Affichage : Progressif (l'utilisateur ne le voit pas)
État : Aucun indicateur (silencieux)
```

### Phase 3 : Scroll Infini (sur demande)
```
Trigger : L'utilisateur scroll en bas
Chargement : 50 documents supplémentaires
Affichage : Avec indicateur "Chargement..."
État : loadingMore = true
```

---

## 🔧 Implémentation par Hook

### useProducts

```typescript
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(false)          // Premier chargement
const [loadingMore, setLoadingMore] = useState(false)  // Chargements suivants
const [currentPage, setCurrentPage] = useState(0)
const [hasMore, setHasMore] = useState(true)

// Constantes
const INITIAL_PAGE_SIZE = 25  // Affichage rapide
const PAGE_SIZE = 50           // Pages suivantes

// 1. Chargement initial (25 produits)
const loadProducts = async (initialLoad = true) => {
  if (initialLoad) {
    setLoading(true)
    const data = await API.getAll({ limit: 25, page: 0 })
    setProducts(data)
    setLoading(false)
    
    // Lancer le background loading
    setTimeout(() => loadMoreInBackground(), 100)
  }
}

// 2. Chargement background (silencieux)
const loadMoreInBackground = async () => {
  const page = currentPage + 1
  const data = await API.getAll({ limit: 50, page })
  
  setProducts(prev => [...prev, ...data])
  setCurrentPage(page)
  
  // Continuer jusqu'à 500 produits
  if (products.length < 500 && data.length >= 50) {
    setTimeout(() => loadMoreInBackground(), 100)
  }
}

// 3. Scroll infini (sur demande)
const loadMore = async () => {
  if (!hasMore || loadingMore) return
  
  setLoadingMore(true)
  const data = await API.getAll({ limit: 50, page: currentPage + 1 })
  setProducts(prev => [...prev, ...data])
  setLoadingMore(false)
}
```

### useOrders / useInvoices / useThirdParties

Même logique que useProducts :
- Initial : 25 documents
- Background : Jusqu'à 500 documents (par pages de 50)
- Scroll : 50 documents supplémentaires

---

## 📱 Implémentation dans les Screens

### ProductsScreen.tsx

```typescript
const { 
  products, 
  loading, 
  loadingMore, 
  hasMore, 
  loadMore 
} = useProducts()

return (
  <FlatList
    data={products}
    renderItem={renderProduct}
    onEndReached={loadMore}        // Scroll infini
    onEndReachedThreshold={0.5}    // Trigger à 50% du bas
    ListFooterComponent={() => 
      loadingMore ? (
        <ActivityIndicator />      // Indicateur au bas de la liste
      ) : null
    }
  />
)
```

### Même pattern pour :
- OrdersScreen
- InvoicesScreen
- ClientsScreen

---

## 📊 Préchargement des Statistiques

### App.tsx - Au lancement

```typescript
useEffect(() => {
  // Précharger les données stats en background
  const preloadStats = async () => {
    try {
      console.log('🔄 Préchargement stats en background...')
      
      // Charger 500 factures (par pages de 100)
      for (let page = 0; page < 5; page++) {
        await InvoicesAPI.getAll({ limit: 100, page })
      }
      
      // Charger 500 commandes (par pages de 100)
      for (let page = 0; page < 5; page++) {
        await OrdersAPI.getAll({ limit: 100, page })
      }
      
      console.log('✅ Préchargement stats terminé')
    } catch (err) {
      console.warn('⚠️ Erreur préchargement stats:', err)
    }
  }
  
  // Lancer après 2 secondes (laisser l'app se charger d'abord)
  setTimeout(preloadStats, 2000)
}, [])
```

### StatsScreen.tsx - Utilisation du cache

```typescript
useEffect(() => {
  const loadStatsData = async () => {
    // Utiliser les données déjà préchargées si disponibles
    const cachedInvoices = await getCachedData('invoices')
    const cachedOrders = await getCachedData('orders')
    
    if (cachedInvoices && cachedOrders) {
      console.log('✅ Utilisation des données préchargées')
      setAllInvoices(cachedInvoices)
      setAllOrders(cachedOrders)
      return
    }
    
    // Sinon charger normalement
    // ...
  }
  
  loadStatsData()
}, [])
```

---

## ⚡ Gains de Performance

### Avant (chargement complet)
```
Temps d'affichage : 3-5 secondes
Données initiales : 500 documents
Expérience : ❌ L'utilisateur attend
```

### Après (lazy loading)
```
Temps d'affichage : 0.5-1 seconde
Données initiales : 25 documents
Background : +475 documents (invisible)
Expérience : ✅ L'utilisateur navigue immédiatement
```

### Tableau comparatif

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Affichage initial** | 3-5s | 0.5-1s | **80% plus rapide** |
| **Données visibles** | 500 | 25 puis 500 | Identique |
| **Perception utilisateur** | Lent | Instantané | ✅ |
| **Chargement réseau** | Bloquant | Progressif | ✅ |

---

## 🎯 Priorités d'Implémentation

### Phase 1 (Immédiat)
1. ✅ Modifier `useProducts` pour lazy loading
2. ✅ Modifier `useOrders` pour lazy loading
3. ✅ Modifier `useInvoices` pour lazy loading
4. ✅ Modifier `useThirdParties` pour lazy loading

### Phase 2 (UI)
1. Ajouter `onEndReached` dans ProductsScreen
2. Ajouter `onEndReached` dans OrdersScreen
3. Ajouter `onEndReached` dans InvoicesScreen
4. Ajouter `onEndReached` dans ClientsScreen

### Phase 3 (Stats)
1. Ajouter préchargement dans App.tsx
2. Utiliser le cache dans StatsScreen.tsx
3. Afficher indicateur "Données préchargées"

---

## 📝 Code de Production

### Hook Optimisé (Template)

```typescript
export function useResource(autoLoad = true) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { startLoading, stopLoading } = useLoading()
  
  const INITIAL_SIZE = 25
  const PAGE_SIZE = 50
  const MAX_BACKGROUND = 500

  const load = async (initialLoad = true) => {
    if (initialLoad) {
      setLoading(true)
      startLoading("resource", "Chargement...")
    } else {
      setLoadingMore(true)
    }

    try {
      const size = initialLoad ? INITIAL_SIZE : PAGE_SIZE
      const page = initialLoad ? 0 : currentPage + 1
      const data = await API.getAll({ limit: size, page })

      if (initialLoad) {
        setItems(data)
        // Background loading
        if (data.length >= INITIAL_SIZE) {
          setTimeout(() => loadBackground(), 100)
        }
      } else {
        setItems(prev => [...prev, ...data])
      }

      setCurrentPage(page)
      setHasMore(data.length >= size)
    } catch (err) {
      console.error(err)
      setHasMore(false)
    } finally {
      if (initialLoad) {
        setLoading(false)
        stopLoading("resource")
      } else {
        setLoadingMore(false)
      }
    }
  }

  const loadBackground = async () => {
    if (items.length >= MAX_BACKGROUND || !hasMore) return

    try {
      const page = currentPage + 1
      const data = await API.getAll({ limit: PAGE_SIZE, page })

      if (data.length > 0) {
        setItems(prev => [...prev, ...data])
        setCurrentPage(page)

        if (items.length < MAX_BACKGROUND && data.length >= PAGE_SIZE) {
          setTimeout(() => loadBackground(), 100)
        }
      }
    } catch (err) {
      console.warn("Background load error:", err)
    }
  }

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return
    load(false)
  }

  useEffect(() => {
    if (autoLoad) load(true)
  }, [autoLoad])

  return { items, loading, loadingMore, hasMore, reload: load, loadMore }
}
```

---

## 🧪 Tests de Performance

### Métriques à mesurer
1. **Time to First Paint** : Affichage des 25 premiers
2. **Time to Interactive** : L'utilisateur peut scroll
3. **Background Load Time** : Temps pour charger 500
4. **Memory Usage** : Consommation mémoire

### Outils
```bash
# React Native Performance Monitor
npx react-native log-ios | grep "PERFORMANCE"

# Mesure du temps
console.time("Initial Load")
await loadProducts()
console.timeEnd("Initial Load")  // < 1s ✅
```

---

## ✅ Checklist d'Implémentation

- [ ] Modifier useProducts avec lazy loading
- [ ] Modifier useOrders avec lazy loading
- [ ] Modifier useInvoices avec lazy loading
- [ ] Modifier useThirdParties avec lazy loading
- [ ] Ajouter onEndReached dans ProductsScreen
- [ ] Ajouter onEndReached dans OrdersScreen
- [ ] Ajouter onEndReached dans InvoicesScreen
- [ ] Ajouter onEndReached dans ClientsScreen
- [ ] Implémenter préchargement stats dans App.tsx
- [ ] Utiliser cache stats dans StatsScreen
- [ ] Tester performance (< 1s pour initial load)
- [ ] Vérifier mémoire (pas de memory leak)

---

**Résultat attendu** : Application 80% plus rapide au démarrage, expérience fluide et instantanée ! 🚀

