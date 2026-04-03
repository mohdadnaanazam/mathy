/**
 * Breakpoint Constants and Types
 * Unified responsive utilities and breakpoint management.
 * Requirements: 3.3
 */

// ============================================================================
// Breakpoint Definitions
// ============================================================================

/**
 * Standard breakpoint values in pixels
 * Matches Tailwind CSS defaults for consistency
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints
export type BreakpointValue = (typeof breakpoints)[Breakpoint]

/**
 * Breakpoint names in order from smallest to largest
 */
export const breakpointOrder: readonly Breakpoint[] = ['sm', 'md', 'lg', 'xl'] as const

// ============================================================================
// Responsive Value Types
// ============================================================================

/**
 * Responsive value type that allows different values at different breakpoints.
 * Uses mobile-first approach where 'base' is the default for all viewports.
 */
export interface ResponsiveValue<T> {
  /** Base value (mobile-first default) */
  base: T
  /** Value for sm breakpoint (640px+) */
  sm?: T
  /** Value for md breakpoint (768px+) */
  md?: T
  /** Value for lg breakpoint (1024px+) */
  lg?: T
  /** Value for xl breakpoint (1280px+) */
  xl?: T
}

/**
 * Device category based on viewport width
 */
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop'

// ============================================================================
// Media Query Helpers
// ============================================================================

/**
 * Generate min-width media query string for a breakpoint
 */
export function minWidth(breakpoint: Breakpoint): string {
  return `(min-width: ${breakpoints[breakpoint]}px)`
}

/**
 * Generate max-width media query string for a breakpoint
 */
export function maxWidth(breakpoint: Breakpoint): string {
  return `(max-width: ${breakpoints[breakpoint] - 1}px)`
}

/**
 * Generate media query string for a range between two breakpoints
 */
export function between(min: Breakpoint, max: Breakpoint): string {
  return `(min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`
}

// ============================================================================
// Breakpoint Detection Helpers
// ============================================================================

/**
 * Get the current breakpoint based on window width
 * Returns 'base' for mobile (< sm), or the largest matching breakpoint
 */
export function getCurrentBreakpoint(width: number): Breakpoint | 'base' {
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'base'
}

/**
 * Get device category based on window width
 */
export function getDeviceCategory(width: number): DeviceCategory {
  if (width >= breakpoints.lg) return 'desktop'
  if (width >= breakpoints.md) return 'tablet'
  return 'mobile'
}

/**
 * Check if width matches a specific breakpoint or higher
 */
export function isBreakpointOrHigher(width: number, breakpoint: Breakpoint): boolean {
  return width >= breakpoints[breakpoint]
}

/**
 * Check if width is below a specific breakpoint
 */
export function isBelowBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  return width < breakpoints[breakpoint]
}

// ============================================================================
// Responsive Value Resolution
// ============================================================================

/**
 * Resolve a responsive value for a given breakpoint.
 * Walks backwards through the breakpoint hierarchy to find the most specific value.
 * 
 * @param values - ResponsiveValue object with values for different breakpoints
 * @param currentBreakpoint - The current breakpoint to resolve for
 * @returns The resolved value for the current breakpoint
 * 
 * Preconditions:
 * - values.base must be defined
 * - currentBreakpoint must be a valid breakpoint name or 'base'
 * 
 * Postconditions:
 * - Returns the most specific value for the current breakpoint
 * - Falls back to base if no breakpoint-specific value exists
 */
export function resolveResponsiveValue<T>(
  values: ResponsiveValue<T>,
  currentBreakpoint: Breakpoint | 'base'
): T {
  // If we're at base (mobile), return base value
  if (currentBreakpoint === 'base') {
    return values.base
  }

  // Find the index of the current breakpoint
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  // Walk backwards from current breakpoint to find the most specific value
  let resolvedValue: T = values.base

  for (let i = 0; i <= currentIndex; i++) {
    const bp = breakpointOrder[i]
    const value = values[bp]
    if (value !== undefined) {
      resolvedValue = value
    }
  }

  return resolvedValue
}

export default breakpoints
