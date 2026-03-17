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
 * Tracks a 1-hour inactivity window. When the user returns after ≥ 1 hour
 * of being away (tab hidden / browser closed), `isSessionExpired` becomes
 * true and they must press "Reset Progress" before they can play again.
 *
 * Activity is recorded automatically every 5 minutes while the tab is visible,
 * so normal gameplay never triggers a false expiry.
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
      if (elapsed >= EXPIRY_THRESHOLD_MS) {
        setIsSessionExpired(true)
      } else {
        setIsSessionExpired(false)
        // User is back within the window — refresh the timestamp
        await setLastActivityAt()
      }
    }

    check()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Heartbeat: while the tab is visible, record activity every 5 minutes
  // so that active gameplay keeps the session alive.
  useEffect(() => {
    if (isSessionExpired) return // don't heartbeat if already expired

    const HEARTBEAT_MS = 5 * 60 * 1000 // 5 minutes
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setLastActivityAt()
      }
    }, HEARTBEAT_MS)

    return () => clearInterval(id)
  }, [isSessionExpired])

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
