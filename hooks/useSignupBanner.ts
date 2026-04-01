'use client'

/**
 * useSignupBanner
 *
 * Manages the full lifecycle of the post-first-game signup banner.
 *
 * Logic summary
 * ─────────────────────────────────────────────────────────────
 *  Show banner when ALL of:
 *    • hasPlayedFirstGame === true
 *    • hasSignedUp !== true
 *    • closedAt is null  OR  5 minutes have elapsed since last close
 *
 *  markFirstGamePlayed()  → persists flag, triggers banner visibility check
 *  closeBanner()          → persists timestamp, hides banner for 5 min
 *  markSignedUp()         → persists flag, permanently hides banner
 *
 *  Multi-tab sync via the native `storage` event (localStorage writes).
 *  Hydration guard prevents SSR/client flicker.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getHasPlayedFirstGame,
  getHasSignedUp,
  getSignupBannerClosedAt,
  setHasPlayedFirstGame,
  setHasSignedUp,
  setSignupBannerClosedAt,
} from '@/lib/signupBannerStorage'

const RESHOW_AFTER_MS = 5 * 60 * 1000 // 5 minutes

// ─── Types ────────────────────────────────────────────────

export interface UseSignupBannerReturn {
  /** True once data has been read from storage (prevents flicker) */
  hydrated: boolean
  /** Whether the banner should be visible right now */
  showBanner: boolean
  /** Call this when ANY game session completes for the first time */
  markFirstGamePlayed: () => Promise<void>
  /** Call this when the user dismisses the banner */
  closeBanner: () => Promise<void>
  /**
   * Call this after a successful Google sign-in.
   * Placeholder for future Supabase OAuth integration.
   */
  markSignedUp: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────

export function useSignupBanner(): UseSignupBannerReturn {
  const [hydrated, setHydrated]               = useState(false)
  const [hasPlayed, setHasPlayed]             = useState(false)
  const [hasSignedUp, setHasSignedUpState]    = useState(false)
  const [closedAt, setClosedAt]               = useState<number | null>(null)

  // Timer ref so we can re-show the banner after 5 min without a page reload
  const reshowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived visibility ───────────────────────────────────
  const bannerAllowed =
    hydrated &&
    hasPlayed &&
    !hasSignedUp &&
    (closedAt === null || Date.now() - closedAt >= RESHOW_AFTER_MS)

  const showBanner = bannerAllowed

  // ── Bootstrap: read storage once on mount ───────────────
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const [played, signedup, closed] = await Promise.all([
        getHasPlayedFirstGame(),
        getHasSignedUp(),
        getSignupBannerClosedAt(),
      ])
      if (cancelled) return
      setHasPlayed(played)
      setHasSignedUpState(signedup)
      setClosedAt(closed)
      setHydrated(true)
    }

    hydrate()
    return () => { cancelled = true }
  }, [])

  // ── 5-min reshow timer: schedule when banner gets closed ─
  useEffect(() => {
    if (!hydrated || !hasPlayed || hasSignedUp || closedAt === null) return

    const elapsed = Date.now() - closedAt
    const remaining = RESHOW_AFTER_MS - elapsed

    if (remaining <= 0) return // already past the window; banner shows now

    reshowTimerRef.current = setTimeout(() => {
      // Re-trigger by clearing closedAt so bannerAllowed becomes true
      setClosedAt(prev => {
        if (prev === closedAt) return null // still the same close event
        return prev
      })
    }, remaining)

    return () => {
      if (reshowTimerRef.current) {
        clearTimeout(reshowTimerRef.current)
        reshowTimerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hasPlayed, hasSignedUp, closedAt])

  // ── Multi-tab sync via storage events ───────────────────
  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (!e.key) return

      if (e.key === 'mathy_banner_hasPlayedFirstGame' && e.newValue === 'true') {
        setHasPlayed(true)
      }
      if (e.key === 'mathy_banner_hasSignedUp' && e.newValue === 'true') {
        setHasSignedUpState(true)
      }
      if (e.key === 'mathy_banner_signupBannerClosedAt' && e.newValue) {
        const ts = Number(e.newValue)
        if (!Number.isNaN(ts)) setClosedAt(ts)
      }
    }

    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  // ── Actions ─────────────────────────────────────────────

  const markFirstGamePlayed = useCallback(async () => {
    if (hasPlayed) return // idempotent
    await setHasPlayedFirstGame()
    setHasPlayed(true)
  }, [hasPlayed])

  const closeBanner = useCallback(async () => {
    const now = Date.now()
    await setSignupBannerClosedAt(now)
    setClosedAt(now)
  }, [])

  const markSignedUp = useCallback(async () => {
    await setHasSignedUp()
    setHasSignedUpState(true)
  }, [])

  return {
    hydrated,
    showBanner,
    markFirstGamePlayed,
    closeBanner,
    markSignedUp,
  }
}
