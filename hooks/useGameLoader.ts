'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getCachedGames,
  isCacheFresh,
  setCachedGames,
  getLastFetchAt,
  getCacheTtlMs,
} from '@/lib/db'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { fetchGamesByType } from '@/src/services/gameService'
import type { BackendGame } from '@/src/services/gameService'

const MAP_OP_TO_TYPE: Record<string, BackendGame['game_type']> = {
  addition: 'addition',
  subtraction: 'subtraction',
  multiplication: 'multiplication',
  division: 'division',
  mixture: 'mixed',
  custom: 'mixed',
  true_false_math: 'true_false_math',
}

function mapOperationToType(op: string): BackendGame['game_type'] {
  return MAP_OP_TO_TYPE[op] ?? 'mixed'
}

export interface UseGameLoaderResult {
  games: BackendGame[]
  loading: boolean
  error: string | null
  lastFetchAt: number | null
  refresh: () => Promise<void>
}

/**
 * Load games from IndexedDB immediately (fast), then check freshness.
 * If cache is stale, fetch from server in the background and update silently.
 * This ensures the UI is never blocked waiting for a server response.
 */
export function useGameLoader(operation: string): UseGameLoaderResult {
  const gameType = mapOperationToType(operation)
  const setLastFetchAtGlobal = useGameRefreshStore(s => s.setLastFetchAt)

  const [games, setGames] = useState<BackendGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null)

  const loadFromServer = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const data = await fetchGamesByType(gameType)
      if (!data.length) {
        // Only show error if we have no cached fallback
        setGames(prev => {
          if (prev.length === 0) setError('No games available. Please try again later.')
          return prev.length > 0 ? prev : []
        })
        return
      }
      const now = Date.now()
      await setCachedGames(gameType, data, now)
      setGames(data)
      setLastFetchAt(now)
      setLastFetchAtGlobal(now)
    } catch (err) {
      // Only show error if we have no cached fallback
      setGames(prev => {
        if (prev.length === 0) setError(err instanceof Error ? err.message : 'Failed to load games')
        return prev
      })
    } finally {
      setLoading(false)
    }
  }, [gameType, setLastFetchAtGlobal])

  const refresh = useCallback(async () => {
    await loadFromServer(true)
  }, [loadFromServer])

  useEffect(() => {
    let cancelled = false

    async function init() {
      // Step 1: Always try to load from IndexedDB first (instant)
      const cached = await getCachedGames(gameType)
      const at = await getLastFetchAt(gameType)
      if (!cancelled && cached?.length) {
        setGames(cached)
        setLastFetchAt(at ?? null)
        setLastFetchAtGlobal(at ?? null)
        setLoading(false)
        setError(null)

        // Step 2: If cache is stale, refresh silently in background
        const fresh = await isCacheFresh(gameType)
        if (!fresh && !cancelled) {
          loadFromServer(false) // non-blocking, no loader
        }
        return
      }

      // No cache at all — must fetch from server (show loader)
      if (!cancelled) await loadFromServer(true)
    }

    init()
    return () => { cancelled = true }
  }, [gameType, setLastFetchAtGlobal, loadFromServer])

  return { games, loading, error, lastFetchAt, refresh }
}

export { getCacheTtlMs }
