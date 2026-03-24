'use client'

import { useState, useEffect, useCallback } from 'react'
import { leaderboardApi, type LeaderboardEntry, type UserRankInfo, type GameFilter } from '@/src/services/leaderboardService'

export type LeaderboardTab = 'global' | 'daily' | 'weekly'

export function useLeaderboard(userUuid: string | null) {
  const [tab, setTab] = useState<LeaderboardTab>('global')
  const [gameFilter, setGameFilter] = useState<GameFilter>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<UserRankInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetcher = tab === 'daily'
        ? leaderboardApi.getDaily
        : tab === 'weekly'
          ? leaderboardApi.getWeekly
          : leaderboardApi.getGlobal

      const data = await fetcher(gameFilter)
      setEntries(data)

      if (userUuid) {
        try {
          const rank = await leaderboardApi.getUserRank(userUuid)
          setUserRank(rank)
        } catch { /* non-critical */ }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [tab, gameFilter, userUuid])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    tab, setTab,
    gameFilter, setGameFilter,
    entries, userRank,
    loading, error,
    refresh: fetchLeaderboard,
  }
}
