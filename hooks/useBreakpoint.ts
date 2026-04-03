'use client'

import { useMemo } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { breakpoints, minWidth, type Breakpoint, type DeviceCategory } from '@/lib/breakpoints'

/**
 * useBreakpoint Hook
 * Returns the current device category based on viewport width.
 * Uses useMediaQuery internally for breakpoint detection.
 * 
 * Requirements: 4.2, 4.4, 3.4
 * 
 * @returns 'mobile' | 'tablet' | 'desktop' based on current viewport
 * 
 * Preconditions:
 * - Must be used in a client component
 * 
 * Postconditions:
 * - Returns 'mobile' on server (SSR mobile-first default)
 * - Returns actual device category on client
 * - Updates when viewport changes without unnecessary re-renders
 */
export function useBreakpoint(): DeviceCategory {
  // Use individual media queries for each breakpoint
  // This approach minimizes re-renders by only updating when crossing a threshold
  const isTabletOrAbove = useMediaQuery(minWidth('md'))
  const isDesktop = useMediaQuery(minWidth('lg'))

  // Memoize the result to prevent unnecessary re-renders
  const deviceCategory = useMemo<DeviceCategory>(() => {
    if (isDesktop) return 'desktop'
    if (isTabletOrAbove) return 'tablet'
    return 'mobile'
  }, [isDesktop, isTabletOrAbove])

  return deviceCategory
}

/**
 * useCurrentBreakpoint Hook
 * Returns the current breakpoint name (sm, md, lg, xl) or 'base' for mobile.
 * More granular than useBreakpoint.
 * 
 * @returns Current breakpoint name
 */
export function useCurrentBreakpoint(): Breakpoint | 'base' {
  const isSm = useMediaQuery(minWidth('sm'))
  const isMd = useMediaQuery(minWidth('md'))
  const isLg = useMediaQuery(minWidth('lg'))
  const isXl = useMediaQuery(minWidth('xl'))

  return useMemo(() => {
    if (isXl) return 'xl'
    if (isLg) return 'lg'
    if (isMd) return 'md'
    if (isSm) return 'sm'
    return 'base'
  }, [isSm, isMd, isLg, isXl])
}

/**
 * useBreakpointValue Hook
 * Returns a value based on the current breakpoint.
 * Useful for responsive props that need different values at different breakpoints.
 * 
 * @param values - Object with values for each breakpoint
 * @returns The value for the current breakpoint
 * 
 * @example
 * const columns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 })
 */
export function useBreakpointValue<T>(values: {
  base: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}): T {
  const currentBreakpoint = useCurrentBreakpoint()

  return useMemo(() => {
    // Walk backwards from current breakpoint to find the most specific value
    const breakpointOrder: (Breakpoint | 'base')[] = ['base', 'sm', 'md', 'lg', 'xl']
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

    let resolvedValue: T = values.base

    for (let i = 1; i <= currentIndex; i++) {
      const bp = breakpointOrder[i] as Breakpoint
      const value = values[bp]
      if (value !== undefined) {
        resolvedValue = value
      }
    }

    return resolvedValue
  }, [currentBreakpoint, values])
}

/**
 * useIsBreakpoint Hook
 * Returns true if the current viewport matches the specified breakpoint or higher.
 * 
 * @param breakpoint - The breakpoint to check
 * @returns boolean indicating if viewport is at or above the breakpoint
 */
export function useIsBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(minWidth(breakpoint))
}

/**
 * useIsBelowBreakpoint Hook
 * Returns true if the current viewport is below the specified breakpoint.
 * 
 * @param breakpoint - The breakpoint to check
 * @returns boolean indicating if viewport is below the breakpoint
 */
export function useIsBelowBreakpoint(breakpoint: Breakpoint): boolean {
  return !useMediaQuery(minWidth(breakpoint))
}

export default useBreakpoint
