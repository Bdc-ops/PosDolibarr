import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export type DeviceClass = 'phone' | 'tablet';

export function useLayoutInfo() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const isTablet = Platform.OS === 'ios' ? Math.max(width, height) >= 768 : Math.max(width, height) >= 800;
    const deviceClass: DeviceClass = isTablet ? 'tablet' : 'phone';

    // Simple heuristic for grids
    const categoryColumns = deviceClass === 'tablet' ? (isLandscape ? 4 : 3) : 2;
    // Limite à 4 colonnes max pour les produits
    const productColumns = Math.min(deviceClass === 'tablet' ? (isLandscape ? 5 : 4) : 2, 4);

    return {
      width,
      height,
      isLandscape,
      deviceClass,
      categoryColumns,
      productColumns,
    };
  }, [width, height]);
}

