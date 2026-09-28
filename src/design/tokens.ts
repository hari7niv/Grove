/**
 * Grove Design Tokens
 *
 * Single source of truth for all visual constants.
 * Warm-neutral palette with forest green accent.
 */

export const palette = {
  // Warm neutrals
  warmWhite: '#FAFAF7',
  white: '#FFFFFF',
  cream: '#F5F4F0',
  sand: '#E8E6E0',
  stone: '#D4D2CC',
  driftwood: '#9C9A92',
  slate: '#6B6962',
  charcoal: '#3A3935',
  night: '#1A1A18',

  // Dark mode surfaces
  darkBg: '#121210',
  darkSurface: '#1C1C1A',
  darkRaised: '#252522',
  darkBorder: '#363630',
  darkTextPrimary: '#EDEDEA',

  // Accent — forest green
  green50: '#E8F5EC',
  green100: '#C8E6C9',
  green300: '#7FB069',
  green500: '#2D7A4F',
  green600: '#246B43',
  green700: '#1B5E38',
  green800: '#124A2A',
  greenDark: '#4CAF6E', // brighter variant for dark mode

  // Plant health semantics
  thriving: '#2D7A4F',
  ok: '#7FB069',
  wilting: '#D4A843',
  dying: '#C45B3E',

  // Utility
  error: '#C45B3E',
  warning: '#D4A843',
  success: '#2D7A4F',
  info: '#5B8FB0',

  // Category colors (muted, earthy)
  categoryFitness: '#C45B3E',
  categoryReading: '#5B8FB0',
  categoryLearning: '#8B6DB0',
  categoryFocus: '#D4A843',
  categoryTasks: '#2D7A4F',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typeScale = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  title1: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  title2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
} as const;

export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
  easing: [0.25, 0.1, 0.25, 1] as const,
} as const;

/** Minimum touch target per WCAG */
export const minTouchTarget = 44;

/** Max content width on desktop to prevent text stretching */
export const maxContentWidth = 960;

/** Breakpoints for responsive layout */
export const breakpoints = {
  mobile: 0,
  tablet: 600,
  desktop: 1024,
} as const;
