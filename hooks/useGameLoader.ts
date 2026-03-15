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
 * Load games from IndexedDB if cache is fresh (< 1 hour), otherwise fetch from server.
 * Stores result in IndexedDB and updates last fetch timestamp.
 */
export function useGameLoader(operation: string): UseGameLoaderResult {
  const gameType = mapOperationToType(operation)
  const setLastFetchAtGlobal = useGameRefreshStore(s => s.setLastFetchAt)

  const [games, setGames] = useState<BackendGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null)

  const loadFromServer = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGamesByType(gameType)
      if (!data.length) {
        setError('No games available. Please try again later.')
        setGames([])
        return
      }
      const now = Date.now()
      await setCachedGames(gameType, data, now)
      setGames(data)
      setLastFetchAt(now)
      setLastFetchAtGlobal(now)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
      setGames([])
    } finally {
      setLoading(false)
    }
  }, [gameType, setLastFetchAtGlobal])

  const refresh = useCallback(async () => {
    await loadFromServer()
  }, [loadFromServer])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const fresh = await isCacheFresh(gameType)
      if (fresh) {
        const cached = await getCachedGames(gameType)
        const at = await getLastFetchAt(gameType)
        if (!cancelled && cached?.length) {
          setGames(cached)
          setLastFetchAt(at ?? null)
          setLastFetchAtGlobal(at ?? null)
          setLoading(false)
          setError(null)
          return
        }
      }
      if (!cancelled) await loadFromServer()
    }

    init()
    return () => {
      cancelled = true
    }
  }, [gameType, setLastFetchAtGlobal])

  return { games, loading, error, lastFetchAt, refresh }
}

export { getCacheTtlMs }
