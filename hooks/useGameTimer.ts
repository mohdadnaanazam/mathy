'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { getGlobalLastFetchAt } from '@/lib/db'
import { getCacheTtlMs } from '@/lib/db'

const TTL_MS = getCacheTtlMs()

function getNextRefreshAt(lastFetchAt: number | null): number | null {
  if (lastFetchAt == null) return null
  return lastFetchAt + TTL_MS
}

function getSecondsRemaining(nextRefreshAt: number | null): number {
  if (nextRefreshAt == null) return 0
  const remaining = Math.round((nextRefreshAt - Date.now()) / 1000)
  return Math.max(0, remaining)
}

/**
 * Format seconds as "X minutes" or "X min Y sec" for games refresh countdown.
 */
export function formatGamesRefreshTime(seconds: number): string {
  if (seconds <= 0) return 'Refreshing…'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 1) {
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  return `${secs} second${secs !== 1 ? 's' : ''}`
}

export interface UseGameTimerResult {
  /** Seconds until next refresh (0 if no cache or already past). */
  secondsRemaining: number
  /** Timestamp (ms) when next refresh is due. */
  nextRefreshAt: number | null
  /** Human-readable string for UI, e.g. "Games refresh in 36 minutes" */
  formatted: string
  /** Whether we have a valid countdown (had a fetch time). */
  hasTimer: boolean
  /** True when user was away >1h and games cache has expired; show reload to fetch new games. */
  isRefreshing: boolean
}

/**
 * Countdown until next hourly games refresh. Updates every second.
 * Uses global lastFetchAt from store (and hydrates from IndexedDB on mount).
 */
export function useGameTimer(): UseGameTimerResult {
  const lastFetchAt = useGameRefreshStore(s => s.lastFetchAt)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null)

  const tick = useCallback(() => {
    const at = getNextRefreshAt(lastFetchAt)
    setNextRefreshAt(at)
    setSecondsRemaining(getSecondsRemaining(at))
  }, [lastFetchAt])

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

  useEffect(() => {
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  const hasTimer = lastFetchAt != null && secondsRemaining > 0
  const isRefreshing = lastFetchAt != null && secondsRemaining <= 0
  const formatted =
    hasTimer
      ? `Games refresh in ${formatGamesRefreshTime(secondsRemaining)}`
      : isRefreshing
        ? 'Refreshing…'
        : ''

  return {
    secondsRemaining,
    nextRefreshAt,
    formatted,
    hasTimer: lastFetchAt != null,
    isRefreshing,
  }
}
