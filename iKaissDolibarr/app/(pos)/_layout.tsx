import React from 'react';
import { Stack } from 'expo-router';
import { CartProvider } from '../../src/features/cart/CartContext';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';

export default function POSLayout() {
  const metier = getCurrentMetierConfig();

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

