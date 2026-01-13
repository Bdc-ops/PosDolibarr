import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Package, Users, FileText, Smartphone, Code, Download, BookOpen } from "lucide-react"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Smartphone className="w-4 h-4" />
            Application Mobile iOS & Android
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">
            iSales <span className="text-blue-600">Dolibarr</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
            Application mobile complète pour gérer vos produits, stocks, commandes, factures et clients Dolibarr en
            déplacement
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-blue-500 transition-all">
            <CardHeader>
              <Package className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Produits & Stocks</CardTitle>
              <CardDescription>Catalogue complet avec gestion des stocks en temps réel</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-orange-500 transition-all">
            <CardHeader>
              <ShoppingCart className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle>Commandes</CardTitle>
              <CardDescription>Créez et gérez vos commandes depuis votre mobile</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-green-500 transition-all">
            <CardHeader>
              <FileText className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Factures</CardTitle>
              <CardDescription>Consultez et générez des factures instantanément</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-500 transition-all">
            <CardHeader>
              <Users className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Clients & Tiers</CardTitle>
              <CardDescription>CRUD complet pour gérer vos contacts</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Documentation Tabs */}
        <Tabs defaultValue="installation" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="cursor">Cursor AI</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="installation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <p className="text-green-400"># Télécharger le template</p>
                  <p>cd dolibarr-mobile-app</p>
                  <p className="mt-2 text-green-400"># Installer les dépendances</p>
                  <p>npm install</p>
                  <p className="mt-2 text-green-400"># Configurer l'API Dolibarr</p>
                  <p>cp .env.example .env</p>
                  <p className="mt-2 text-green-400"># Lancer l'application</p>
                  <p>npm run ios # ou npm run android</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="font-semibold text-blue-900 mb-2">⚙️ Configuration requise</p>
                  <p className="text-blue-800 text-sm">
                    Créez un fichier <code className="bg-blue-100 px-2 py-1 rounded">.env</code> avec :
                  </p>
                  <div className="mt-2 bg-white p-3 rounded font-mono text-xs">
                    <p>DOLIBARR_API_URL=https://votre-dolibarr.com/api/index.php</p>
                    <p>DOLIBARR_API_KEY=votre_cle_api</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  APIs disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-blue-600">📦 ProductsAPI</h3>
                    <ul className="space-y-1 text-sm text-gray-700 ml-4">
                      <li>• getAll() - Liste tous les produits</li>
                      <li>• getById(id) - Récupère un produit</li>
                      <li>• search(query) - Recherche de produits</li>
                      <li>• create(product) - Créer un produit</li>
                      <li>• update(id, product) - Modifier un produit</li>
                      <li>• delete(id) - Supprimer un produit</li>
                      <li>• getStock(productId) - Stock par entrepôt</li>
                      <li>• updateStock() - Mouvement de stock</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-orange-600">🛒 OrdersAPI</h3>
                    <ul className="space-y-1 text-sm text-gray-700 ml-4">
                      <li>• getAll() - Liste des commandes</li>
                      <li>• create(order) - Créer une commande</li>
                      <li>• validate(orderId) - Valider une commande</li>
                      <li>• addLine() - Ajouter une ligne</li>
                      <li>• close(orderId) - Clôturer</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-green-600">📄 InvoicesAPI</h3>
                    <ul className="space-y-1 text-sm text-gray-700 ml-4">
                      <li>• getAll() - Liste des factures</li>
                      <li>• createFromOrder() - Générer depuis commande</li>
                      <li>• validate() - Valider une facture</li>
                      <li>• addPayment() - Enregistrer un paiement</li>
                      <li>• downloadPDF() - Télécharger PDF</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-purple-600">👥 ThirdPartiesAPI</h3>
                    <ul className="space-y-1 text-sm text-gray-700 ml-4">
                      <li>• getAll() - Liste clients/fournisseurs</li>
                      <li>• search(query) - Recherche</li>
                      <li>• create() / update() / delete() - CRUD</li>
                      <li>• getOrders() - Commandes du tiers</li>
                      <li>• getInvoices() - Factures du tiers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cursor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Utiliser avec Cursor AI
                </CardTitle>
                <CardDescription>
                  Consultez <code className="bg-gray-100 px-2 py-1 rounded">CURSOR_GUIDE.md</code> pour la liste
                  complète
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">💬 Comprendre le code</p>
                    <code className="text-sm text-blue-800">
                      @Codebase Explique-moi comment fonctionne la création de commandes
                    </code>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">➕ Ajouter une fonctionnalité</p>
                    <code className="text-sm text-green-800">
                      Dans src/api/products.ts, ajoute une fonction pour filtrer par catégorie
                    </code>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">🎨 Créer un composant</p>
                    <code className="text-sm text-purple-800">
                      Crée un composant ProductCard qui affiche un produit avec image, prix et stock
                    </code>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <p className="font-semibold text-orange-900 mb-1">🐛 Débugger</p>
                    <code className="text-sm text-orange-800">
                      @Codebase J'ai une erreur Network Error, peux-tu m'aider ?
                    </code>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="font-semibold mb-2">🎯 Commandes Cursor utiles</p>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>
                      • <kbd className="bg-white px-2 py-1 rounded border">Cmd/Ctrl + K</kbd> - Modifications rapides
                    </li>
                    <li>
                      • <kbd className="bg-white px-2 py-1 rounded border">Cmd/Ctrl + L</kbd> - Chat Cursor
                    </li>
                    <li>
                      • <kbd className="bg-white px-2 py-1 rounded border">Cmd/Ctrl + I</kbd> - Code inline
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📁 Structure du projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs space-y-1">
                  <p className="text-blue-400">dolibarr-mobile-app/</p>
                  <p className="ml-4">├── src/</p>
                  <p className="ml-8 text-green-400">│ ├── api/ (Services API)</p>
                  <p className="ml-12">│ │ ├── dolibarr.client.ts</p>
                  <p className="ml-12">│ │ ├── products.ts</p>
                  <p className="ml-12">│ │ ├── orders.ts</p>
                  <p className="ml-12">│ │ ├── invoices.ts</p>
                  <p className="ml-12">│ │ └── thirdparties.ts</p>
                  <p className="ml-8 text-green-400">│ ├── components/ (Composants UI)</p>
                  <p className="ml-8 text-green-400">│ ├── screens/ (Écrans)</p>
                  <p className="ml-8 text-green-400">│ ├── hooks/ (Custom hooks)</p>
                  <p className="ml-12">│ │ └── useDolibarr.ts</p>
                  <p className="ml-8 text-green-400">│ ├── types/ (Types TypeScript)</p>
                  <p className="ml-12">│ │ └── dolibarr.types.ts</p>
                  <p className="ml-8 text-green-400">│ └── navigation/ (Navigation)</p>
                  <p className="ml-4">├── App.tsx</p>
                  <p className="ml-4">├── package.json</p>
                  <p className="ml-4">├── README.md</p>
                  <p className="ml-4">└── CURSOR_GUIDE.md</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-semibold text-blue-900 text-sm">✅ Inclus</p>
                    <ul className="text-xs text-blue-800 mt-1 space-y-1">
                      <li>• APIs complètes</li>
                      <li>• Types TypeScript</li>
                      <li>• Hooks personnalisés</li>
                      <li>• Guide Cursor</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="font-semibold text-orange-900 text-sm">🚧 À créer</p>
                    <ul className="text-xs text-orange-800 mt-1 space-y-1">
                      <li>• Écrans UI</li>
                      <li>• Composants</li>
                      <li>• Navigation</li>
                      <li>• Tests</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-orange-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Prêt à développer ? 🚀</CardTitle>
              <CardDescription className="text-blue-50">
                Ouvrez le dossier dans Cursor et commencez à coder avec l'IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <p className="font-mono text-sm">cd dolibarr-mobile-app && cursor .</p>
              </div>
              <p className="text-sm text-blue-100">
                📖 Consultez <strong>CURSOR_GUIDE.md</strong> pour 10+ exemples de prompts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
