'use client'

import { useEffect, useState, useCallback } from 'react'
import { getLastLeftAt, setLastLeftAt } from '@/lib/db'
import { useGameRefreshStore } from '@/store/gameRefreshStore'

const INACTIVE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

export interface UseInactiveUserResult {
  /** True when user returned after being away > 1 hour. */
  showInactiveModal: boolean
  onContinue: () => void
  onRefresh: (invalidateCache: () => Promise<void>) => void
}

/**
 * Listens to document visibility. When user returns (visible) after > 1 hour,
 * sets showInactiveModal true. On hidden, saves lastLeftAt to IndexedDB.
 */
export function useInactiveUser(): UseInactiveUserResult {
  const [showInactiveModal, setShowInactiveModal] = useState(false)
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)

  const onContinue = useCallback(() => {
    setShowInactiveModal(false)
  }, [])

  const onRefresh = useCallback(
    async (invalidateCache: () => Promise<void>) => {
      await invalidateCache()
      await setLastLeftAt(Date.now())
      setLastFetchAt(null)
      setShowInactiveModal(false)
    },
    [setLastFetchAt],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        getLastLeftAt().then(leftAt => {
          if (leftAt == null) return
          const elapsed = Date.now() - leftAt
          if (elapsed >= INACTIVE_THRESHOLD_MS) setShowInactiveModal(true)
        })
      } else {
        setLastLeftAt(Date.now())
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return { showInactiveModal, onContinue, onRefresh }
}
