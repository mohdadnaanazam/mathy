'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getLastActivityAt,
  setLastActivityAt,
  resetAllProgress,
} from '@/lib/db'

const EXPIRY_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

export interface UseSessionExpiryResult {
  /** True when the user has been inactive for ≥ 1 hour and must reset before playing. */
  isSessionExpired: boolean
  /** True while the reset operation is in progress. */
  isResetting: boolean
  /** Call this to reset progress counters (not score) and clear the expired state. */
  resetAndResume: () => Promise<void>
  /** Call this to record activity (e.g. when starting a game session). */
  recordActivity: () => Promise<void>
}

/**
 * Tracks a 1-hour inactivity window. When the user returns after ≥ 1 hour,
 * `isSessionExpired` becomes true and they must press "Reset Progress" before
 * they can play again. Resetting clears all variant played counters and session
 * counters but preserves the total score.
 */
export function useSessionExpiry(): UseSessionExpiryResult {
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Check on mount and when tab becomes visible
  useEffect(() => {
    const check = async () => {
      const lastActivity = await getLastActivityAt()
      if (lastActivity == null) {
        // First visit ever — record now, not expired
        await setLastActivityAt()
        setIsSessionExpired(false)
        return
      }
      const elapsed = Date.now() - lastActivity
      setIsSessionExpired(elapsed >= EXPIRY_THRESHOLD_MS)
    }

    check()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const resetAndResume = useCallback(async () => {
    setIsResetting(true)
    try {
      await resetAllProgress()
      await setLastActivityAt()
      setIsSessionExpired(false)
    } finally {
      setIsResetting(false)
    }
  }, [])

  const recordActivity = useCallback(async () => {
    await setLastActivityAt()
  }, [])

  return { isSessionExpired, isResetting, resetAndResume, recordActivity }
}
