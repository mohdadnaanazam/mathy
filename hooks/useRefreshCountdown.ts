'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { getGlobalLastFetchAt, getCacheTtlMs } from '@/lib/db'

const TTL_MS = getCacheTtlMs()

export type RefreshTier = 'none' | 'warning' | 'urgent' | 'ready'

export interface UseRefreshCountdownResult {
  /** Seconds until next refresh (0 = ready now). */
  secondsLeft: number
  /** Formatted as "42m 15s". */
  formatted: string
  /** Banner tier based on remaining time. */
  tier: RefreshTier
  /** True when countdown has reached zero and new games are available. */
  isReady: boolean
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0m 00s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function getTier(seconds: number): RefreshTier {
  if (seconds <= 0) return 'ready'
  if (seconds <= 120) return 'urgent'   // < 2 minutes
  if (seconds <= 600) return 'warning'  // < 10 minutes
  return 'none'
}

/**
 * Live countdown until the next hourly game refresh.
 * Ticks every second. Returns formatted time and a tier for banner display.
 */
export function useRefreshCountdown(): UseRefreshCountdownResult {
  const lastFetchAt = useGameRefreshStore(s => s.lastFetchAt)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Hydrate store from IndexedDB if needed
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (lastFetchAt == null) {
      getGlobalLastFetchAt().then(globalAt => {
        if (globalAt != null) {
          useGameRefreshStore.getState().setLastFetchAt(globalAt)
        }
      })
    }
  }, [lastFetchAt])

  const tick = useCallback(() => {
    if (lastFetchAt == null) {
      setSecondsLeft(0)
      return
    }
    const nextAt = lastFetchAt + TTL_MS
    const remaining = Math.max(0, Math.round((nextAt - Date.now()) / 1000))
    setSecondsLeft(remaining)
  }, [lastFetchAt])

  useEffect(() => {
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  const tier = getTier(secondsLeft)

  return {
    secondsLeft,
    formatted: formatCountdown(secondsLeft),
    tier,
    isReady: tier === 'ready' && lastFetchAt != null,
  }
}
