/**
 * Contexte du panier (Cart)
 * Gère l'état du panier de vente (produits, remises, totaux)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartProduct, PendingSale, Discount } from '../../types/pos';
import { SelectedClient } from '../../types/client';
import { generateId } from '../../utils/id';

interface CartContextType {
  // État du panier
  currentSale: PendingSale | null;

  // Produits dans le panier
  products: CartProduct[];

  // Client sélectionné
  client: SelectedClient | null;

  // Remises
  discounts: Discount[];

  // Totaux
  subtotal: number;
  subtotal_ttc: number;
  total_discount: number;
  total_tax: number;
  total: number;
  total_ttc: number;

  // Actions
  addProduct: (product: CartProduct) => void;
  updateProduct: (index: number, updates: Partial<CartProduct>) => void;
  removeProduct: (index: number) => void;
  clearCart: () => void;
  setClient: (client: SelectedClient | null) => void;
  addDiscount: (discount: Discount) => void;
  removeDiscount: (index: number) => void;
  clearGlobalDiscounts: () => void;
  setGlobalDiscountPercent: (percent: number, reason?: string) => void;
  setGlobalDiscountAmount: (amountTtc: number, reason?: string) => void;
  setLineDiscountPercent: (lineIndex: number, percent: number, reason?: string) => void;
  setLineDiscountAmount: (lineIndex: number, amountTtc: number, reason?: string) => void;
  calculateTotals: () => void;
  createPendingSale: () => PendingSale;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  mergeSameProducts = true,
}: {
  children: ReactNode;
  mergeSameProducts?: boolean;
}) {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [client, setClient] = useState<SelectedClient | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    subtotal_ttc: 0,
    total_discount: 0,
    total_tax: 0,
    total: 0,
    total_ttc: 0,
  });

  /**
   * Calcule les totaux du panier
   */
  const calculateTotals = useCallback(() => {
    // Totaux "net" après remise ligne, avant remise globale
    let netSubtotalHt = 0;
    let netSubtotalTtc = 0;
    let lineDiscountTtcTotal = 0;

    products.forEach((p) => {
      netSubtotalHt += p.total; // total HT net de ligne
      netSubtotalTtc += p.total_ttc; // total TTC net de ligne
      lineDiscountTtcTotal += p.discount_amount || 0;
    });

    // Remises globales
    const globalDiscounts = discounts.filter((d) => d.type === 'global');
    const globalDiscountTtc = globalDiscounts.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Estime la part HT de la remise globale selon le ratio HT/TTC net
    const ratioHtOverTtc = netSubtotalTtc > 0 ? netSubtotalHt / netSubtotalTtc : 1;
    const globalDiscountHt = globalDiscountTtc * ratioHtOverTtc;

    const total_discount = lineDiscountTtcTotal + globalDiscountTtc;

    const total_ttc = Math.max(0, netSubtotalTtc - globalDiscountTtc);
    const total_ht = Math.max(0, netSubtotalHt - globalDiscountHt);
    const total_tax = total_ttc - total_ht;

    setTotals({
      subtotal: total_ht,
      subtotal_ttc: total_ttc,
      total_discount,
      total_tax,
      total: total_ht,
      total_ttc,
    });
  }, [products, discounts]);

  /**
   * Ajoute un produit au panier
   */
  const addProduct = useCallback(
    (product: CartProduct) => {
      setProducts((prev) => {
        const existingIndex = mergeSameProducts ? prev.findIndex((p) => p.id === product.id) : -1;
        if (existingIndex >= 0) {
          // Produit existant, incrémenter la quantité
          const updated = [...prev];
          const existing = updated[existingIndex];
          const quantity = existing.quantity + product.quantity;
          const grossHt = existing.price * quantity;
          const grossTtc = existing.price_ttc * quantity;
          const discountTtc = existing.discount_amount || 0; // conserve la remise ligne actuelle
          const taxRatio = 1 + (existing.tva_tx || 0) / 100;
          const discountHt = taxRatio > 0 ? discountTtc / taxRatio : discountTtc;
          const netHt = Math.max(0, grossHt - discountHt);
          const netTtc = Math.max(0, grossTtc - discountTtc);
          updated[existingIndex] = {
            ...existing,
            quantity,
            subtotal: grossHt,
            subtotal_ttc: grossTtc,
            total: netHt,
            total_ttc: netTtc,
          };
          return updated;
        } else {
          // Nouveau produit
          const qty = product.quantity;
          const grossHt = product.price * qty;
          const grossTtc = product.price_ttc * qty;
          const taxRatio = 1 + (product.tva_tx || 0) / 100;
          const discountTtc = product.discount_amount || 0;
          const discountHt = taxRatio > 0 ? discountTtc / taxRatio : discountTtc;
          const netHt = Math.max(0, grossHt - discountHt);
          const netTtc = Math.max(0, grossTtc - discountTtc);
          const normalized: CartProduct = {
            ...product,
            discount_amount: product.discount_amount || 0,
            discount_percent: product.discount_percent || 0,
            subtotal: grossHt,
            subtotal_ttc: grossTtc,
            total: netHt,
            total_ttc: netTtc,
          };
          return [...prev, normalized];
        }
      });
    },
    [mergeSameProducts]
  );

  /**
   * Met à jour un produit dans le panier
   */
  const updateProduct = useCallback((index: number, updates: Partial<CartProduct>) => {
    setProducts((prev) => {
      const updated = [...prev];
      const product = updated[index];
      const newProduct = { ...product, ...updates };
      
      // Recalculer les totaux du produit si la quantité ou le prix change
      if (
        updates.quantity !== undefined ||
        updates.price !== undefined ||
        updates.price_ttc !== undefined ||
        updates.discount_amount !== undefined ||
        updates.discount_percent !== undefined
      ) {
        const qty = newProduct.quantity;
        // Si l'utilisateur modifie le prix HT sans TTC, recalcul TTC à partir de la TVA
        if (updates.price !== undefined && updates.price_ttc === undefined) {
          newProduct.price_ttc = newProduct.price * (1 + (newProduct.tva_tx || 0) / 100);
        }
        // Si l'utilisateur modifie le prix TTC sans HT, recalcul HT à partir de la TVA
        if (updates.price_ttc !== undefined && updates.price === undefined) {
          const ratio = 1 + (newProduct.tva_tx || 0) / 100;
          newProduct.price = ratio > 0 ? newProduct.price_ttc / ratio : newProduct.price_ttc;
        }
        const grossHt = newProduct.price * qty;
        const grossTtc = newProduct.price_ttc * qty;
        const taxRatio = 1 + (newProduct.tva_tx || 0) / 100;

        // Si percent change, recalcul amount TTC à partir du brut TTC
        if (updates.discount_percent !== undefined) {
          const pct = Math.max(0, Math.min(100, updates.discount_percent));
          newProduct.discount_percent = pct;
          newProduct.discount_amount = (grossTtc * pct) / 100;
        }
        // Si amount change, recalcul percent
        if (updates.discount_amount !== undefined) {
          const amt = Math.max(0, updates.discount_amount);
          newProduct.discount_amount = Math.min(amt, grossTtc);
          newProduct.discount_percent = grossTtc > 0 ? (newProduct.discount_amount / grossTtc) * 100 : 0;
        }

        const discountTtc = Math.min(newProduct.discount_amount || 0, grossTtc);
        const discountHt = taxRatio > 0 ? discountTtc / taxRatio : discountTtc;
        const netHt = Math.max(0, grossHt - discountHt);
        const netTtc = Math.max(0, grossTtc - discountTtc);

        newProduct.subtotal = grossHt;
        newProduct.subtotal_ttc = grossTtc;
        newProduct.total = netHt;
        newProduct.total_ttc = netTtc;
      }

      updated[index] = newProduct;
      return updated;
    });
  }, []);

  /**
   * Supprime un produit du panier
   */
  const removeProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Vide le panier
   */
  const clearCart = useCallback(() => {
    setProducts([]);
    setClient(null);
    setDiscounts([]);
    setTotals({
      subtotal: 0,
      subtotal_ttc: 0,
      total_discount: 0,
      total_tax: 0,
      total: 0,
      total_ttc: 0,
    });
  }, []);

  /**
   * Ajoute une remise
   */
  const addDiscount = useCallback((discount: Discount) => {
    setDiscounts((prev) => [...prev, discount]);
  }, []);

  /**
   * Supprime une remise
   */
  const removeDiscount = useCallback((index: number) => {
    setDiscounts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearGlobalDiscounts = useCallback(() => {
    setDiscounts((prev) => prev.filter((d) => d.type !== 'global'));
  }, []);

  const setGlobalDiscountPercent = useCallback((percent: number, reason?: string) => {
    const pct = Math.max(0, Math.min(100, percent));
    // Amount TTC is calculated against current net total TTC (after line discounts)
    const netTtc = products.reduce((sum, p) => sum + p.total_ttc, 0);
    const amount = (netTtc * pct) / 100;
    setDiscounts((prev) => [
      ...prev.filter((d) => d.type !== 'global'),
      {
        type: 'global',
        amount,
        percent: pct,
        requires_authorization: false,
        reason,
      },
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/features/cart/CartContext.tsx:231',message:'setGlobalDiscountPercent',data:{percent:pct,amount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [products]);

  const setGlobalDiscountAmount = useCallback((amountTtc: number, reason?: string) => {
    const netTtc = products.reduce((sum, p) => sum + p.total_ttc, 0);
    const amount = Math.max(0, Math.min(amountTtc, netTtc));
    const percent = netTtc > 0 ? (amount / netTtc) * 100 : 0;
    setDiscounts((prev) => [
      ...prev.filter((d) => d.type !== 'global'),
      {
        type: 'global',
        amount,
        percent,
        requires_authorization: false,
        reason,
      },
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/features/cart/CartContext.tsx:258',message:'setGlobalDiscountAmount',data:{amount,percent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [products]);

  const setLineDiscountPercent = useCallback((lineIndex: number, percent: number, reason?: string) => {
    const pct = Math.max(0, Math.min(100, percent));
    setProducts((prev) => {
      const next = [...prev];
      const p = next[lineIndex];
      if (!p) return prev;
      const grossTtc = p.price_ttc * p.quantity;
      const discountTtc = (grossTtc * pct) / 100;
      next[lineIndex] = { ...p, discount_percent: pct, discount_amount: discountTtc };
      return next;
    });
    // store also in discounts list as "line" for audit (optional)
    setDiscounts((prev) => [
      ...prev.filter((d) => !(d.type === 'line' && d.line_index === lineIndex)),
      { type: 'line', line_index: lineIndex, amount: 0, percent: pct, requires_authorization: false, reason },
    ]);
  }, []);

  const setLineDiscountAmount = useCallback((lineIndex: number, amountTtc: number, reason?: string) => {
    setProducts((prev) => {
      const next = [...prev];
      const p = next[lineIndex];
      if (!p) return prev;
      const grossTtc = p.price_ttc * p.quantity;
      const amt = Math.max(0, Math.min(amountTtc, grossTtc));
      const pct = grossTtc > 0 ? (amt / grossTtc) * 100 : 0;
      next[lineIndex] = { ...p, discount_amount: amt, discount_percent: pct };
      return next;
    });
    setDiscounts((prev) => [
      ...prev.filter((d) => !(d.type === 'line' && d.line_index === lineIndex)),
      { type: 'line', line_index: lineIndex, amount: 0, percent: 0, requires_authorization: false, reason },
    ]);
  }, []);

  /**
   * Crée une vente en attente à partir du panier
   */
  const createPendingSale = useCallback((): PendingSale => {
    const now = Date.now();
    return {
      id: generateId(),
      status: 'draft',
      client_id: client?.id,
      client: client || undefined,
      products,
      discounts,
      ...totals,
      payments: [],
      payment_total: 0,
      remaining: totals.total_ttc,
      created_at: now,
      updated_at: now,
    };
  }, [client, products, discounts, totals]);

  // Recalcule les totaux quand les produits ou remises changent
  React.useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const value: CartContextType = {
    currentSale: null,
    products,
    client,
    discounts,
    ...totals,
    addProduct,
    updateProduct,
    removeProduct,
    clearCart,
    setClient,
    addDiscount,
    removeDiscount,
    clearGlobalDiscounts,
    setGlobalDiscountPercent,
    setGlobalDiscountAmount,
    setLineDiscountPercent,
    setLineDiscountAmount,
    calculateTotals,
    createPendingSale,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook pour accéder au contexte du panier
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé à l\'intérieur d\'un CartProvider');
  }
  return context;
}
