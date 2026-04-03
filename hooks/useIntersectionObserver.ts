'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'

/**
 * useIntersectionObserver Hook
 * Observes when an element enters or leaves the viewport.
 * Useful for lazy loading content and triggering animations.
 * 
 * Requirements: 9.5
 * 
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting, entry]
 */

export interface UseIntersectionObserverOptions {
  /** Root element for intersection (default: viewport) */
  root?: Element | null
  /** Margin around root element */
  rootMargin?: string
  /** Threshold(s) at which to trigger callback */
  threshold?: number | number[]
  /** Only trigger once when element becomes visible */
  triggerOnce?: boolean
  /** Initial value before observation starts */
  initialValue?: boolean
}

export interface UseIntersectionObserverReturn<T extends Element> {
  ref: RefObject<T | null>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn<T> {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
    initialValue = false,
  } = options

  const ref = useRef<T | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(initialValue)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered.current) return

    // Check for IntersectionObserver support
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume visible
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry)
        setIsIntersecting(observerEntry.isIntersecting)

        // If triggerOnce and now intersecting, mark as triggered
        if (triggerOnce && observerEntry.isIntersecting) {
          hasTriggered.current = true
          observer.disconnect()
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [root, rootMargin, threshold, triggerOnce])

  return { ref, isIntersecting, entry }
}

/**
 * useIsVisible Hook
 * Simplified version that just returns whether element is visible.
 * 
 * @param options - IntersectionObserver options
 * @returns [ref, isVisible]
 */
export function useIsVisible<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const { ref, isIntersecting } = useIntersectionObserver<T>(options)
  return [ref, isIntersecting]
}

/**
 * useLazyLoad Hook
 * For lazy loading content when it enters the viewport.
 * Triggers once and stays loaded.
 * 
 * @param rootMargin - How far before viewport to start loading (default: '100px')
 * @returns [ref, shouldLoad]
 */
export function useLazyLoad<T extends Element = HTMLDivElement>(
  rootMargin = '100px'
): [RefObject<T | null>, boolean] {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    rootMargin,
    triggerOnce: true,
  })
  return [ref, isIntersecting]
}

/**
 * useOnScreen Hook
 * Returns true when element is on screen with configurable threshold.
 * 
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns [ref, isOnScreen]
 */
export function useOnScreen<T extends Element = HTMLDivElement>(
  threshold = 0.1
): [RefObject<T | null>, boolean] {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    threshold,
  })
  return [ref, isIntersecting]
}

export default useIntersectionObserver
