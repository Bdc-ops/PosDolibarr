// Données de démonstration pour le mode démo Apple App Store Review
import type { Product, Invoice, Order, ThirdParty, Category } from "../types/dolibarr.types"

// Générer des dates réalistes
const now = new Date()
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10)
const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 5)

// Catégories de produits
export const demoCategories: Category[] = [
  { id: "1", label: "Électronique", type: "product", color: "#FF6B35" },
  { id: "2", label: "Vêtements", type: "product", color: "#004E89" },
  { id: "3", label: "Alimentaire", type: "product", color: "#1A936F" },
  { id: "4", label: "Maison & Jardin", type: "product", color: "#FFB627" },
]

// Catégories de clients
export const demoCustomerCategories: Category[] = [
  { id: "10", label: "Particulier", type: "customer", color: "#FF6B35" },
  { id: "11", label: "Entreprise", type: "customer", color: "#004E89" },
  { id: "12", label: "Revendeur", type: "customer", color: "#1A936F" },
]

// Produits de démonstration
export const demoProducts: Product[] = [
  {
    id: "1",
    ref: "PROD-001",
    label: "Smartphone Premium",
    description: "Smartphone haut de gamme avec écran OLED",
    price: 899.99,
    price_ttc: 1079.99,
    stock_reel: 45,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "2",
    ref: "PROD-002",
    label: "T-shirt Coton Bio",
    description: "T-shirt en coton biologique, plusieurs coloris",
    price: 24.99,
    price_ttc: 29.99,
    stock_reel: 120,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "3",
    ref: "PROD-003",
    label: "Café Arabica",
    description: "Café en grains 100% Arabica, origine Éthiopie",
    price: 12.50,
    price_ttc: 15.00,
    stock_reel: 200,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "4",
    ref: "PROD-004",
    label: "Table Basse Moderne",
    description: "Table basse design en bois massif",
    price: 349.99,
    price_ttc: 419.99,
    stock_reel: 15,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "5",
    ref: "PROD-005",
    label: "Écouteurs Sans Fil",
    description: "Écouteurs Bluetooth avec réduction de bruit",
    price: 129.99,
    price_ttc: 155.99,
    stock_reel: 80,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "6",
    ref: "PROD-006",
    label: "Jeans Slim",
    description: "Jeans coupe slim, plusieurs tailles",
    price: 59.99,
    price_ttc: 71.99,
    stock_reel: 90,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "7",
    ref: "PROD-007",
    label: "Thé Vert Premium",
    description: "Thé vert de qualité supérieure, sachets individuels",
    price: 8.99,
    price_ttc: 10.79,
    stock_reel: 150,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
  {
    id: "8",
    ref: "PROD-008",
    label: "Lampadaire Design",
    description: "Lampadaire moderne avec variateur d'intensité",
    price: 199.99,
    price_ttc: 239.99,
    stock_reel: 25,
    status: "1",
    tosell: "1",
    tobuy: "0",
  },
]

// Clients de démonstration
export const demoThirdParties: ThirdParty[] = [
  {
    id: "1",
    name: "TechCorp Solutions",
    ref: "CLI-001",
    code_client: "TC001",
    email: "contact@techcorp.fr",
    phone: "+33 1 23 45 67 89",
    address: "123 Avenue des Champs-Élysées",
    zip: "75008",
    town: "Paris",
    country: "France",
    status: "1",
    client: "1",
  },
  {
    id: "2",
    name: "Mode & Style SARL",
    ref: "CLI-002",
    code_client: "MS002",
    email: "info@modestyle.fr",
    phone: "+33 4 56 78 90 12",
    address: "45 Rue de la Mode",
    zip: "69001",
    town: "Lyon",
    country: "France",
    status: "1",
    client: "1",
  },
  {
    id: "3",
    name: "Café des Artisans",
    ref: "CLI-003",
    code_client: "CA003",
    email: "bonjour@cafeartisans.fr",
    phone: "+33 5 67 89 01 23",
    address: "78 Boulevard Saint-Michel",
    zip: "33000",
    town: "Bordeaux",
    country: "France",
    status: "1",
    client: "1",
  },
  {
    id: "4",
    name: "Déco Maison Pro",
    ref: "CLI-004",
    code_client: "DM004",
    email: "contact@decomaison.fr",
    phone: "+33 6 78 90 12 34",
    address: "12 Place de la République",
    zip: "13001",
    town: "Marseille",
    country: "France",
    status: "1",
    client: "1",
  },
]

// Factures de démonstration
export const demoInvoices: Invoice[] = [
  {
    id: "1",
    ref: "FAC-2025-001",
    ref_ext: "",
    datef: now.toISOString().split("T")[0],
    date_creation: now.toISOString(),
    total_ht: 899.99,
    total_ttc: 1079.99,
    total_tva: 179.99,
    statut: "1",
    paye: "0",
    fk_statut: "1",
    thirdparty: demoThirdParties[0],
    lines: [
      {
        id: "1",
        fk_product: demoProducts[0].id,
        product_label: demoProducts[0].label,
        qty: 1,
        price: 899.99,
        total_ht: 899.99,
        total_ttc: 1079.99,
      },
    ],
  },
  {
    id: "2",
    ref: "FAC-2025-002",
    ref_ext: "",
    datef: now.toISOString().split("T")[0],
    date_creation: now.toISOString(),
    total_ht: 84.98,
    total_ttc: 101.98,
    total_tva: 17.00,
    statut: "1",
    paye: "1",
    fk_statut: "2",
    thirdparty: demoThirdParties[1],
    lines: [
      {
        id: "2",
        fk_product: demoProducts[1].id,
        product_label: demoProducts[1].label,
        qty: 2,
        price: 24.99,
        total_ht: 49.98,
        total_ttc: 59.98,
      },
      {
        id: "3",
        fk_product: demoProducts[5].id,
        product_label: demoProducts[5].label,
        qty: 1,
        price: 59.99,
        total_ht: 59.99,
        total_ttc: 71.99,
      },
    ],
  },
  {
    id: "3",
    ref: "FAC-2024-120",
    ref_ext: "",
    datef: lastMonth.toISOString().split("T")[0],
    date_creation: lastMonth.toISOString(),
    total_ht: 349.99,
    total_ttc: 419.99,
    total_tva: 70.00,
    statut: "1",
    paye: "1",
    fk_statut: "2",
    thirdparty: demoThirdParties[3],
    lines: [
      {
        id: "4",
        fk_product: demoProducts[3].id,
        product_label: demoProducts[3].label,
        qty: 1,
        price: 349.99,
        total_ht: 349.99,
        total_ttc: 419.99,
      },
    ],
  },
  {
    id: "4",
    ref: "FAC-2024-119",
    ref_ext: "",
    datef: twoMonthsAgo.toISOString().split("T")[0],
    date_creation: twoMonthsAgo.toISOString(),
    total_ht: 142.48,
    total_ttc: 170.98,
    total_tva: 28.50,
    statut: "1",
    paye: "1",
    fk_statut: "2",
    thirdparty: demoThirdParties[2],
    lines: [
      {
        id: "5",
        fk_product: demoProducts[2].id,
        product_label: demoProducts[2].label,
        qty: 5,
        price: 12.50,
        total_ht: 62.50,
        total_ttc: 75.00,
      },
      {
        id: "6",
        fk_product: demoProducts[6].id,
        product_label: demoProducts[6].label,
        qty: 8,
        price: 8.99,
        total_ht: 71.92,
        total_ttc: 86.30,
      },
    ],
  },
  {
    id: "5",
    ref: "FAC-2024-118",
    ref_ext: "",
    datef: threeMonthsAgo.toISOString().split("T")[0],
    date_creation: threeMonthsAgo.toISOString(),
    total_ht: 199.99,
    total_ttc: 239.99,
    total_tva: 40.00,
    statut: "1",
    paye: "1",
    fk_statut: "2",
    thirdparty: demoThirdParties[3],
    lines: [
      {
        id: "7",
        fk_product: demoProducts[7].id,
        product_label: demoProducts[7].label,
        qty: 1,
        price: 199.99,
        total_ht: 199.99,
        total_ttc: 239.99,
      },
    ],
  },
]

// Commandes de démonstration
export const demoOrders: Order[] = [
  {
    id: "1",
    ref: "CMD-2025-001",
    date_commande: now.toISOString().split("T")[0],
    date_creation: now.toISOString(),
    total_ht: 129.99,
    total_ttc: 155.99,
    total_tva: 26.00,
    statut: "0",
    fk_statut: "0",
    thirdparty: demoThirdParties[0],
    lines: [
      {
        id: "1",
        fk_product: demoProducts[4].id,
        product_label: demoProducts[4].label,
        qty: 1,
        price: 129.99,
        total_ht: 129.99,
        total_ttc: 155.99,
      },
    ],
  },
  {
    id: "2",
    ref: "CMD-2025-002",
    date_commande: now.toISOString().split("T")[0],
    date_creation: now.toISOString(),
    total_ht: 24.99,
    total_ttc: 29.99,
    total_tva: 5.00,
    statut: "1",
    fk_statut: "1",
    thirdparty: demoThirdParties[1],
    lines: [
      {
        id: "2",
        fk_product: demoProducts[1].id,
        product_label: demoProducts[1].label,
        qty: 1,
        price: 24.99,
        total_ht: 24.99,
        total_ttc: 29.99,
      },
    ],
  },
  {
    id: "3",
    ref: "CMD-2024-095",
    date_commande: lastMonth.toISOString().split("T")[0],
    date_creation: lastMonth.toISOString(),
    total_ht: 349.99,
    total_ttc: 419.99,
    total_tva: 70.00,
    statut: "2",
    fk_statut: "2",
    thirdparty: demoThirdParties[3],
    lines: [
      {
        id: "3",
        fk_product: demoProducts[3].id,
        product_label: demoProducts[3].label,
        qty: 1,
        price: 349.99,
        total_ht: 349.99,
        total_ttc: 419.99,
      },
    ],
  },
  {
    id: "4",
    ref: "CMD-2024-094",
    date_commande: twoMonthsAgo.toISOString().split("T")[0],
    date_creation: twoMonthsAgo.toISOString(),
    total_ht: 62.50,
    total_ttc: 75.00,
    total_tva: 12.50,
    statut: "2",
    fk_statut: "2",
    thirdparty: demoThirdParties[2],
    lines: [
      {
        id: "4",
        fk_product: demoProducts[2].id,
        product_label: demoProducts[2].label,
        qty: 5,
        price: 12.50,
        total_ht: 62.50,
        total_ttc: 75.00,
      },
    ],
  },
]

// Fonction helper pour filtrer les données mock selon les paramètres
export function filterDemoData<T extends { id: string }>(
  data: T[],
  params?: { limit?: number; page?: number; sqlfilters?: string }
): T[] {
  let filtered = [...data]

  // Appliquer la pagination
  const limit = params?.limit || 25
  const page = params?.page || 0
  const start = page * limit
  const end = start + limit

  return filtered.slice(start, end)
}
