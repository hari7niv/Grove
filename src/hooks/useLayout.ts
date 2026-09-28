/**
 * Responsive layout hook.
 *
 * Detects current layout tier (mobile/tablet/desktop)
 * and provides breakpoint information.
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { breakpoints } from '../design/tokens';

export type LayoutTier = 'mobile' | 'tablet' | 'desktop';

export interface LayoutInfo {
  tier: LayoutTier;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
}

function getLayoutInfo(): LayoutInfo {
  const { width, height } = Dimensions.get('window');

  let tier: LayoutTier = 'mobile';
  if (width >= breakpoints.desktop) {
    tier = 'desktop';
  } else if (width >= breakpoints.tablet) {
    tier = 'tablet';
  }

  return {
    tier,
    width,
    height,
    isMobile: tier === 'mobile',
    isTablet: tier === 'tablet',
    isDesktop: tier === 'desktop',
    isWeb: Platform.OS === 'web',
  };
}

export function useLayout(): LayoutInfo {
  const [layout, setLayout] = useState<LayoutInfo>(getLayoutInfo);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getLayoutInfo());
    });

    return () => subscription.remove();
  }, []);

  return layout;
}
