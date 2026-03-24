'use client'

import { useState, useEffect, useCallback } from 'react'
import { leaderboardApi, type LeaderboardEntry, type UserRankInfo } from '@/src/services/leaderboardService'

export type LeaderboardTab = 'global' | 'daily' | 'weekly'

export function useLeaderboard(userUuid: string | null) {
  const [tab, setTab] = useState<LeaderboardTab>('global')
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

      const data = await fetcher()
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
  }, [tab, userUuid])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    tab, setTab,
    entries, userRank,
    loading, error,
    refresh: fetchLeaderboard,
  }
}
