'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getCachedGames,
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
  square_root: 'square_root',
  fractions: 'fractions',
  percentage: 'percentage',
  algebra: 'algebra',
  speed_math: 'speed_math',
  logic_puzzle: 'logic_puzzle',
}

/** The four standard math operation types (used for mixture/custom fallback). */
const MATH_OP_TYPES: BackendGame['game_type'][] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]

function mapOperationToType(op: string): BackendGame['game_type'] {
  return MAP_OP_TO_TYPE[op] ?? 'mixed'
}

/** Whether this operation needs all four math caches merged instead of a single type. */
function needsAllMathTypes(op: string): boolean {
  return op === 'mixture' || op === 'custom'
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
 *
 * For mixture/custom modes, merges all four math operation caches so the game
 * always has questions even if the 'mixed' endpoint cache is empty.
 */
export function useGameLoader(operation: string): UseGameLoaderResult {
  const gameType = mapOperationToType(operation)
  const mergeAll = needsAllMathTypes(operation)
  const setLastFetchAtGlobal = useGameRefreshStore(s => s.setLastFetchAt)

  const [games, setGames] = useState<BackendGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null)

  /** Load all four math caches and merge them into one array. */
  const loadAllMathFromCache = useCallback(async (): Promise<{
    games: BackendGame[]
    at: number | null
  }> => {
    const results = await Promise.all(
      MATH_OP_TYPES.map(async (t) => {
        const cached = await getCachedGames(t)
        const at = await getLastFetchAt(t)
        return { games: cached ?? [], at }
      }),
    )
    const merged = results.flatMap(r => r.games)
    // Use the oldest fetch timestamp so staleness check is conservative
    const timestamps = results.map(r => r.at).filter((a): a is number => a != null)
    const oldestAt = timestamps.length ? Math.min(...timestamps) : null
    return { games: merged, at: oldestAt }
  }, [])

  /** Fetch all four math types from server and cache each one. */
  const fetchAllMathFromServer = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled(
        MATH_OP_TYPES.map(async (t) => {
          const data = await fetchGamesByType(t)
          const now = Date.now()
          if (data.length) await setCachedGames(t, data, now)
          return data
        }),
      )
      const merged = results.flatMap(r =>
        r.status === 'fulfilled' ? r.value : [],
      )
      if (!merged.length) {
        setGames(prev => {
          if (prev.length === 0) setError('No games available. Please try again later.')
          return prev.length > 0 ? prev : []
        })
        return
      }
      const now = Date.now()
      // Only replace the games array if the actual content changed.
      // This prevents downstream reshuffles when a background refresh
      // returns the same data the user is already playing with.
      setGames(prev => {
        if (prev.length > 0 && !showLoader) {
          const prevIds = new Set(prev.map(g => g.id))
          const mergedIds = new Set(merged.map(g => g.id))
          if (prevIds.size === mergedIds.size && [...prevIds].every(id => mergedIds.has(id))) {
            return prev
          }
        }
        return merged
      })
      setLastFetchAt(now)
      setLastFetchAtGlobal(now)
    } catch (err) {
      setGames(prev => {
        if (prev.length === 0) setError(err instanceof Error ? err.message : 'Failed to load games')
        return prev
      })
    } finally {
      setLoading(false)
    }
  }, [setLastFetchAtGlobal])

  const loadSingleFromServer = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const data = await fetchGamesByType(gameType)
      if (!data.length) {
        setGames(prev => {
          if (prev.length === 0) setError('No games available. Please try again later.')
          return prev.length > 0 ? prev : []
        })
        return
      }
      const now = Date.now()
      await setCachedGames(gameType, data, now)
      // Only replace the games array if the actual content changed.
      setGames(prev => {
        if (prev.length > 0 && !showLoader) {
          const prevIds = new Set(prev.map(g => g.id))
          const dataIds = new Set(data.map(g => g.id))
          if (prevIds.size === dataIds.size && [...prevIds].every(id => dataIds.has(id))) {
            return prev
          }
        }
        return data
      })
      setLastFetchAt(now)
      setLastFetchAtGlobal(now)
    } catch (err) {
      setGames(prev => {
        if (prev.length === 0) setError(err instanceof Error ? err.message : 'Failed to load games')
        return prev
      })
    } finally {
      setLoading(false)
    }
  }, [gameType, setLastFetchAtGlobal])

  const refresh = useCallback(async () => {
    if (mergeAll) await fetchAllMathFromServer(true)
    else await loadSingleFromServer(true)
  }, [mergeAll, fetchAllMathFromServer, loadSingleFromServer])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (mergeAll) {
        // Mixture/custom: merge all four math caches
        const { games: cached, at } = await loadAllMathFromCache()
        if (!cancelled && cached.length) {
          setGames(cached)
          setLastFetchAt(at)
          setLastFetchAtGlobal(at)
          setLoading(false)
          setError(null)
          // Don't auto-fetch in background when cache is stale.
          // The user can play cached games and reload manually if they want fresh ones.
          return
        }
        // No cache — fetch from server
        if (!cancelled) await fetchAllMathFromServer(true)
      } else {
        // Single operation: load from its specific cache
        const cached = await getCachedGames(gameType)
        const at = await getLastFetchAt(gameType)
        if (!cancelled && cached?.length) {
          setGames(cached)
          setLastFetchAt(at ?? null)
          setLastFetchAtGlobal(at ?? null)
          setLoading(false)
          setError(null)
          // Don't auto-fetch in background — cached games are playable.
          return
        }
        if (!cancelled) await loadSingleFromServer(true)
      }
    }

    init()
    return () => { cancelled = true }
  }, [gameType, mergeAll, setLastFetchAtGlobal, loadAllMathFromCache, fetchAllMathFromServer, loadSingleFromServer])

  return { games, loading, error, lastFetchAt, refresh }
}

export { getCacheTtlMs }
