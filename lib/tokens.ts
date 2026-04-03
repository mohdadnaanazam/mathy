/**
 * Design Token System
 * Centralized design tokens for consistent styling across the application.
 * Requirements: 6.1, 6.2, 6.3
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ColorTokens {
  accent: {
    orange: string
    orangeHover: string
    orangeMuted: string
    cyan: string
    pink: string
    purple: string
    success: string
    successMuted: string
  }
  background: {
    surface: string
    card: string
    cardElevated: string
    primary: string
  }
  border: {
    subtle: string
    bright: string
    default: string
    input: string
  }
  text: {
    primary: string
    secondary: string
    muted: string
  }
  chart: {
    1: string
    2: string
    3: string
    4: string
    5: string
  }
  semantic: {
    destructive: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
  }
}

export interface SpacingTokens {
  0: number
  1: number
  2: number
  3: number
  4: number
  5: number
  6: number
  8: number
  10: number
  12: number
  16: number
  20: number
  24: number
  32: number
  48: number
  64: number
}

export interface TypographyTokens {
  fontFamily: {
    sans: string
    mono: string
    display: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
  }
  fontWeight: {
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold: number
  }
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
  letterSpacing: {
    tight: string
    normal: string
    wide: string
    wider: string
  }
}

export interface ShadowTokens {
  sm: string
  md: string
  lg: string
  xl: string
  card: string
  cardHover: string
  button: string
  buttonHover: string
}

export interface RadiusTokens {
  sm: string
  md: string
  lg: string
  xl: string
  full: string
}

export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  shadows: ShadowTokens
  radii: RadiusTokens
}

// ============================================================================
// Token Values
// ============================================================================

export const colors: ColorTokens = {
  accent: {
    orange: '#f97316',
    orangeHover: '#ea580c',
    orangeMuted: 'rgba(249, 115, 22, 0.15)',
    cyan: '#06b6d4',
    pink: '#ff6b81',
    purple: '#8b3dff',
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.15)',
  },
  background: {
    surface: '#0c0c0f',
    card: 'rgba(24, 24, 27, 0.95)',
    cardElevated: 'rgba(30, 30, 35, 0.98)',
    primary: '#18181b',
  },
  border: {
    subtle: 'rgba(39, 39, 42, 0.8)',
    bright: 'rgba(82, 82, 91, 0.6)',
    default: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
  },
  text: {
    primary: 'oklch(0.985 0 0)',
    secondary: 'oklch(0.708 0 0)',
    muted: 'rgba(148, 163, 184, 0.85)',
  },
  chart: {
    1: 'oklch(0.65 0.18 40)',
    2: 'oklch(0.696 0.17 162.48)',
    3: 'oklch(0.769 0.188 70.08)',
    4: 'oklch(0.627 0.265 303.9)',
    5: 'oklch(0.645 0.246 16.439)',
  },
  semantic: {
    destructive: 'oklch(0.704 0.191 22.216)',
    primary: 'oklch(70% 0.18 40)',
    primaryForeground: 'oklch(0.205 0 0)',
    secondary: '#BB86FC',
    secondaryForeground: 'oklch(0.985 0 0)',
  },
}

export const spacing: SpacingTokens = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  48: 192,
  64: 256,
}

export const typography: TypographyTokens = {
  fontFamily: {
    sans: "var(--font-inter), 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "var(--font-geist-mono), 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    display: "var(--font-urbanist), 'Urbanist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.08em',
    wider: '0.12em',
  },
}

export const shadows: ShadowTokens = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  card: '0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.02) inset',
  cardHover: '0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
  button: '0 8px 24px rgba(0, 0, 0, 0.45)',
  buttonHover: '0 10px 28px rgba(0, 0, 0, 0.55)',
}

export const radii: RadiusTokens = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.625rem',  // 10px (--radius)
  xl: '1rem',      // 16px
  full: '9999px',
}

// ============================================================================
// Combined Tokens Export
// ============================================================================

export const tokens: DesignTokens = {
  colors,
  spacing,
  typography,
  shadows,
  radii,
}

// ============================================================================
// Breakpoints (for responsive system integration)
// ============================================================================

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get spacing value in pixels
 */
export function getSpacing(key: keyof SpacingTokens): string {
  return `${spacing[key]}px`
}

/**
 * Get color value
 */
export function getColor(
  category: keyof ColorTokens,
  key: string
): string | undefined {
  const categoryColors = colors[category] as Record<string, string>
  return categoryColors?.[key]
}

export default tokens
