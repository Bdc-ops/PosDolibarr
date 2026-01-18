import React from 'react';
import { Stack } from 'expo-router';
import { CartProvider } from '../../src/features/cart/CartContext';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';

export default function POSLayout() {
  const metier = getCurrentMetierConfig();
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/a621a27d-7aa4-4eef-8805-a825d105238e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(pos)/_layout.tsx:9',message:'POSLayout mounted (CartProvider active)',data:{mergeSameProducts:metier.options.activerCumulProduitsIdentiques},timestamp:Date.now(),sessionId:'debug-session',runId:'pos-split',hypothesisId:'M'})}).catch(()=>{});
  // #endregion

  return (
    <CartProvider mergeSameProducts={metier.options.activerCumulProduitsIdentiques}>
      <Stack
        screenOptions={{
          headerShown: false, // POS screens have custom headers already
        }}
      />
    </CartProvider>
  );
}

