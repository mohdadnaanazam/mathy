'use client'

import { useEffect, useState, useCallback } from 'react'
import { clearGameCache, getGlobalLastFetchAt, getLastLeftAt, resetAllProgress, setLastLeftAt } from '@/lib/db'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { fetchAndCacheAllGames } from '@/lib/refreshGames'

const INACTIVE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

export interface UseInactiveUserResult {
  /** True when user returned after being away > 1 hour. */
  showInactiveModal: boolean
  /** True when cached games are expired (>1 hour). */
  isExpired: boolean
  onContinue: () => void
  onRefresh: () => Promise<void>
}

/**
 * Listens to document visibility. When user returns (visible) after > 1 hour,
 * sets showInactiveModal true. On hidden, saves lastLeftAt to IndexedDB.
 */
export function useInactiveUser(): UseInactiveUserResult {
  const [showInactiveModal, setShowInactiveModal] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)

  const onContinue = useCallback(() => {
    setShowInactiveModal(false)
  }, [])

  const onRefresh = useCallback(
    async () => {
      await clearGameCache()
      await resetAllProgress()
      const now = await fetchAndCacheAllGames()
      await setLastLeftAt(Date.now())
      setLastFetchAt(now)
      setIsExpired(false)
      setShowInactiveModal(false)
    },
    [setLastFetchAt],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        Promise.all([getLastLeftAt(), getGlobalLastFetchAt()]).then(([leftAt, lastFetchAt]) => {
          if (leftAt == null) return
          const elapsed = Date.now() - leftAt
          if (elapsed < INACTIVE_THRESHOLD_MS) return

          const expired = lastFetchAt != null && Date.now() - lastFetchAt >= INACTIVE_THRESHOLD_MS
          setIsExpired(expired)
          setShowInactiveModal(true)
        })
      } else {
        setLastLeftAt(Date.now())
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return { showInactiveModal, isExpired, onContinue, onRefresh }
}
