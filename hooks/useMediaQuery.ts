'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * useMediaQuery Hook
 * Returns a boolean indicating whether the given CSS media query matches.
 * Handles SSR by returning mobile-first default on server.
 * 
 * Requirements: 4.1, 14.1, 14.3
 * 
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @param defaultValue - Default value to return on server (defaults to false for mobile-first)
 * @returns boolean indicating if the media query matches
 * 
 * Preconditions:
 * - query must be a valid CSS media query string
 * 
 * Postconditions:
 * - Returns defaultValue on server (SSR)
 * - Returns actual match state on client after hydration
 * - Updates when viewport changes without unnecessary re-renders
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  // Use a function to get the initial state to avoid SSR mismatch
  const getMatches = useCallback((): boolean => {
    // Return default on server
    if (typeof window === 'undefined') {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }, [query, defaultValue])

  // Initialize with default value to prevent hydration mismatch
  const [matches, setMatches] = useState<boolean>(defaultValue)

  useEffect(() => {
    // Set the actual value on client mount
    const mediaQuery = window.matchMedia(query)
    
    // Update state to actual value
    setMatches(mediaQuery.matches)

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [query])

  return matches
}

/**
 * Convenience hooks for common breakpoints
 * These use mobile-first defaults (false on server)
 */

export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 640px)')
}

export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery('(min-width: 640px)')
  const isBelowDesktop = !useMediaQuery('(min-width: 1024px)')
  return isAboveMobile && isBelowDesktop
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsSmallScreen(): boolean {
  return !useMediaQuery('(min-width: 768px)')
}

export function useIsLargeScreen(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}

/**
 * Hook to detect touch devices
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)')
}

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export default useMediaQuery
