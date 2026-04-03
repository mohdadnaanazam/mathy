/**
 * Responsive Utility Functions
 * Provides utilities for resolving responsive values based on breakpoints.
 * 
 * Requirements: 4.3, 3.5
 */

import {
  breakpoints,
  breakpointOrder,
  resolveResponsiveValue,
  type Breakpoint,
  type ResponsiveValue,
  type DeviceCategory,
} from './breakpoints'

// Re-export types for convenience
export type { Breakpoint, ResponsiveValue, DeviceCategory }
export { breakpoints, breakpointOrder }

/**
 * Create a responsive value object from individual breakpoint values.
 * Convenience function for creating ResponsiveValue objects.
 * 
 * @param base - Base value (mobile-first default)
 * @param sm - Value for sm breakpoint (optional)
 * @param md - Value for md breakpoint (optional)
 * @param lg - Value for lg breakpoint (optional)
 * @param xl - Value for xl breakpoint (optional)
 * @returns ResponsiveValue object
 * 
 * @example
 * const padding = createResponsiveValue('12px', '16px', '20px', '24px')
 */
export function createResponsiveValue<T>(
  base: T,
  sm?: T,
  md?: T,
  lg?: T,
  xl?: T
): ResponsiveValue<T> {
  const value: ResponsiveValue<T> = { base }
  if (sm !== undefined) value.sm = sm
  if (md !== undefined) value.md = md
  if (lg !== undefined) value.lg = lg
  if (xl !== undefined) value.xl = xl
  return value
}

/**
 * Resolve a responsive value for a given window width.
 * 
 * @param values - ResponsiveValue object
 * @param width - Current window width in pixels
 * @returns Resolved value for the current width
 * 
 * Preconditions:
 * - values.base must be defined
 * - width must be a non-negative number
 * 
 * Postconditions:
 * - Returns the most specific value for the current width
 * - Falls back to base if no breakpoint-specific value exists
 */
export function resolveForWidth<T>(values: ResponsiveValue<T>, width: number): T {
  // Determine current breakpoint from width
  let currentBreakpoint: Breakpoint | 'base' = 'base'
  
  if (width >= breakpoints.xl) currentBreakpoint = 'xl'
  else if (width >= breakpoints.lg) currentBreakpoint = 'lg'
  else if (width >= breakpoints.md) currentBreakpoint = 'md'
  else if (width >= breakpoints.sm) currentBreakpoint = 'sm'

  return resolveResponsiveValue(values, currentBreakpoint)
}

/**
 * Generate CSS media query styles from responsive values.
 * Useful for generating inline styles or CSS-in-JS.
 * 
 * @param property - CSS property name
 * @param values - ResponsiveValue object
 * @returns Object with media query keys and style values
 * 
 * @example
 * const styles = generateMediaStyles('padding', { base: '12px', md: '20px' })
 * // Returns: { padding: '12px', '@media (min-width: 768px)': { padding: '20px' } }
 */
export function generateMediaStyles<T extends string | number>(
  property: string,
  values: ResponsiveValue<T>
): Record<string, unknown> {
  const styles: Record<string, unknown> = {
    [property]: values.base,
  }

  for (const bp of breakpointOrder) {
    const value = values[bp]
    if (value !== undefined) {
      const mediaQuery = `@media (min-width: ${breakpoints[bp]}px)`
      styles[mediaQuery] = { [property]: value }
    }
  }

  return styles
}

/**
 * Generate Tailwind-style responsive class names.
 * 
 * @param baseClass - Base class name
 * @param values - ResponsiveValue object with class modifiers
 * @returns Space-separated class string
 * 
 * @example
 * const classes = generateResponsiveClasses('p', { base: '4', md: '6', lg: '8' })
 * // Returns: 'p-4 md:p-6 lg:p-8'
 */
export function generateResponsiveClasses(
  baseClass: string,
  values: ResponsiveValue<string | number>
): string {
  const classes: string[] = [`${baseClass}-${values.base}`]

  for (const bp of breakpointOrder) {
    const value = values[bp]
    if (value !== undefined) {
      classes.push(`${bp}:${baseClass}-${value}`)
    }
  }

  return classes.join(' ')
}

/**
 * Map responsive values through a transform function.
 * 
 * @param values - ResponsiveValue object
 * @param transform - Function to transform each value
 * @returns New ResponsiveValue with transformed values
 */
export function mapResponsiveValue<T, U>(
  values: ResponsiveValue<T>,
  transform: (value: T) => U
): ResponsiveValue<U> {
  const result: ResponsiveValue<U> = { base: transform(values.base) }

  for (const bp of breakpointOrder) {
    const value = values[bp]
    if (value !== undefined) {
      result[bp] = transform(value)
    }
  }

  return result
}

/**
 * Check if a value is a ResponsiveValue object.
 */
export function isResponsiveValue<T>(value: unknown): value is ResponsiveValue<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value
  )
}

/**
 * Normalize a value to ResponsiveValue format.
 * If already a ResponsiveValue, returns as-is.
 * Otherwise, wraps in a ResponsiveValue with the value as base.
 */
export function normalizeResponsiveValue<T>(
  value: T | ResponsiveValue<T>
): ResponsiveValue<T> {
  if (isResponsiveValue<T>(value)) {
    return value
  }
  return { base: value }
}

/**
 * Merge multiple responsive values, with later values taking precedence.
 */
export function mergeResponsiveValues<T>(
  ...values: (ResponsiveValue<T> | undefined)[]
): ResponsiveValue<T> | undefined {
  const defined = values.filter((v): v is ResponsiveValue<T> => v !== undefined)
  if (defined.length === 0) return undefined

  const result: ResponsiveValue<T> = { base: defined[0].base }

  for (const value of defined) {
    if (value.base !== undefined) result.base = value.base
    for (const bp of breakpointOrder) {
      if (value[bp] !== undefined) {
        result[bp] = value[bp]
      }
    }
  }

  return result
}

export default {
  breakpoints,
  breakpointOrder,
  createResponsiveValue,
  resolveForWidth,
  resolveResponsiveValue,
  generateMediaStyles,
  generateResponsiveClasses,
  mapResponsiveValue,
  isResponsiveValue,
  normalizeResponsiveValue,
  mergeResponsiveValues,
}
