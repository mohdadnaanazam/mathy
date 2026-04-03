/**
 * CSS Custom Properties Generator
 * Converts design tokens to CSS custom properties for use in stylesheets.
 * Requirements: 6.4, 6.5
 */

import { colors, spacing, typography, shadows, radii } from './tokens'

type CSSVariableMap = Record<string, string>

/**
 * Flatten nested object to CSS variable format
 */
function flattenToCSSVars(
  obj: Record<string, unknown>,
  prefix: string
): CSSVariableMap {
  const result: CSSVariableMap = {}

  for (const [key, value] of Object.entries(obj)) {
    const varName = `--${prefix}-${kebabCase(key)}`

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = flattenToCSSVars(
        value as Record<string, unknown>,
        `${prefix}-${kebabCase(key)}`
      )
      Object.assign(result, nested)
    } else {
      result[varName] = String(value)
    }
  }

  return result
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Generate all CSS custom properties from design tokens
 */
export function generateCSSVariables(): CSSVariableMap {
  return {
    // Color tokens
    ...flattenToCSSVars(colors.accent, 'token-accent'),
    ...flattenToCSSVars(colors.background, 'token-bg'),
    ...flattenToCSSVars(colors.border, 'token-border'),
    ...flattenToCSSVars(colors.text, 'token-text'),
    ...flattenToCSSVars(colors.chart, 'token-chart'),
    ...flattenToCSSVars(colors.semantic, 'token-semantic'),

    // Spacing tokens
    ...Object.entries(spacing).reduce((acc, [key, value]) => {
      acc[`--token-space-${key}`] = `${value}px`
      return acc
    }, {} as CSSVariableMap),

    // Typography tokens
    ...flattenToCSSVars(typography.fontFamily, 'token-font'),
    ...flattenToCSSVars(typography.fontSize, 'token-text'),
    ...flattenToCSSVars(typography.fontWeight, 'token-weight'),
    ...flattenToCSSVars(typography.lineHeight, 'token-leading'),
    ...flattenToCSSVars(typography.letterSpacing, 'token-tracking'),

    // Shadow tokens
    ...Object.entries(shadows).reduce((acc, [key, value]) => {
      acc[`--token-shadow-${kebabCase(key)}`] = value
      return acc
    }, {} as CSSVariableMap),

    // Radius tokens
    ...Object.entries(radii).reduce((acc, [key, value]) => {
      acc[`--token-radius-${kebabCase(key)}`] = value
      return acc
    }, {} as CSSVariableMap),
  }
}

/**
 * Generate CSS string with all custom properties
 */
export function generateCSSString(): string {
  const vars = generateCSSVariables()
  const lines = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `:root {\n${lines}\n}`
}

/**
 * CSS variable reference helpers for use in components
 */
export const cssVar = {
  // Colors
  accentOrange: 'var(--token-accent-orange)',
  accentOrangeHover: 'var(--token-accent-orange-hover)',
  accentOrangeMuted: 'var(--token-accent-orange-muted)',
  accentCyan: 'var(--token-accent-cyan)',
  accentPink: 'var(--token-accent-pink)',
  accentPurple: 'var(--token-accent-purple)',
  accentSuccess: 'var(--token-accent-success)',
  accentSuccessMuted: 'var(--token-accent-success-muted)',

  bgSurface: 'var(--token-bg-surface)',
  bgCard: 'var(--token-bg-card)',
  bgCardElevated: 'var(--token-bg-card-elevated)',
  bgPrimary: 'var(--token-bg-primary)',

  borderSubtle: 'var(--token-border-subtle)',
  borderBright: 'var(--token-border-bright)',
  borderDefault: 'var(--token-border-default)',
  borderInput: 'var(--token-border-input)',

  textPrimary: 'var(--token-text-primary)',
  textSecondary: 'var(--token-text-secondary)',
  textMuted: 'var(--token-text-muted)',

  // Spacing
  space: (key: number) => `var(--token-space-${key})`,

  // Typography
  fontSans: 'var(--token-font-sans)',
  fontMono: 'var(--token-font-mono)',
  fontDisplay: 'var(--token-font-display)',

  // Shadows
  shadowSm: 'var(--token-shadow-sm)',
  shadowMd: 'var(--token-shadow-md)',
  shadowLg: 'var(--token-shadow-lg)',
  shadowXl: 'var(--token-shadow-xl)',
  shadowCard: 'var(--token-shadow-card)',
  shadowCardHover: 'var(--token-shadow-card-hover)',
  shadowButton: 'var(--token-shadow-button)',
  shadowButtonHover: 'var(--token-shadow-button-hover)',

  // Radius
  radiusSm: 'var(--token-radius-sm)',
  radiusMd: 'var(--token-radius-md)',
  radiusLg: 'var(--token-radius-lg)',
  radiusXl: 'var(--token-radius-xl)',
  radiusFull: 'var(--token-radius-full)',
} as const

export default cssVar
