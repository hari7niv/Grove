/**
 * Theme system — derives light/dark semantic colors from tokens.
 * Provides a React context for the active theme.
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { palette, spacing, radius, typeScale, elevation, motion } from './tokens';
import { useRepositories } from '../db/provider';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  thriving: string;
  ok: string;
  wilting: string;
  dying: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarInactive: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof typeScale;
  elevation: typeof elevation;
  motion: typeof motion;
}

const lightColors: ThemeColors = {
  background: palette.warmWhite,
  surface: palette.white,
  surfaceRaised: palette.cream,
  border: palette.sand,
  borderLight: '#F0EEE8',
  textPrimary: palette.night,
  textSecondary: palette.slate,
  textTertiary: palette.driftwood,
  textInverse: palette.white,
  accent: palette.green500,
  accentLight: palette.green50,
  accentDark: palette.green700,
  error: palette.error,
  warning: palette.warning,
  success: palette.success,
  info: palette.info,
  thriving: palette.thriving,
  ok: palette.ok,
  wilting: palette.wilting,
  dying: palette.dying,
  tabBar: palette.white,
  tabBarBorder: palette.sand,
  tabBarInactive: palette.driftwood,
};

const darkColors: ThemeColors = {
  background: palette.darkBg,
  surface: palette.darkSurface,
  surfaceRaised: palette.darkRaised,
  border: palette.darkBorder,
  borderLight: '#2A2A26',
  textPrimary: palette.darkTextPrimary,
  textSecondary: palette.driftwood,
  textTertiary: palette.slate,
  textInverse: palette.night,
  accent: palette.greenDark,
  accentLight: '#1A3025',
  accentDark: palette.green300,
  error: '#E07060',
  warning: '#E0BC5E',
  success: palette.greenDark,
  info: '#7BAED0',
  thriving: palette.greenDark,
  ok: '#8FC079',
  wilting: '#E0BC5E',
  dying: '#E07060',
  tabBar: palette.darkSurface,
  tabBarBorder: palette.darkBorder,
  tabBarInactive: palette.slate,
};

function buildTheme(dark: boolean): Theme {
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing,
    radius,
    type: typeScale,
    elevation,
    motion,
  };
}

export const lightTheme = buildTheme(false);
export const darkTheme = buildTheme(true);

const ThemeContext = createContext<Theme>(lightTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  override?: 'light' | 'dark' | 'system';
  children: React.ReactNode;
}

export function ThemeProvider({ override, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const repositories = useRepositories();
  const [pref, setPref] = useState<'system' | 'light' | 'dark'>(override || 'system');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (override) {
      setPref(override);
      return;
    }
    const loadSettings = async () => {
      try {
        const settings = await repositories.settings.getAll();
        setPref(settings.themePreference || 'system');
        setReduceMotion(settings.reduceMotion || false);
      } catch (e) {
        // use defaults if db fails
      }
    };
    loadSettings();
    // In a real app we might want to subscribe to settings changes.
  }, [override, repositories]);

  const theme = useMemo(() => {
    let isDark = false;
    if (pref === 'light') isDark = false;
    else if (pref === 'dark') isDark = true;
    else isDark = systemScheme === 'dark';

    const baseTheme = isDark ? darkTheme : lightTheme;
    
    // Apply reduceMotion override to motion config if needed
    if (reduceMotion) {
      return {
        ...baseTheme,
        motion: {
          ...baseTheme.motion,
          duration: {
            short: 0,
            medium: 0,
            long: 0,
          }
        }
      };
    }
    return baseTheme;
  }, [pref, systemScheme, reduceMotion]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
