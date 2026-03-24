'use client'

import { useState, useCallback } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getStoredUsername, getStoredAvatarColor } from '@/components/ui/UsernameModal'

/**
 * Modular hook for submitting scores to the leaderboard.
 * Completely isolated — never modifies existing game logic.
 * Fails silently on any error.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pendingScore, setPendingScore] = useState<{
    score: number
    gameType: string
  } | null>(null)

  const promptAndSubmit = useCallback(
    async (score: number, gameType: string) => {
      if (!userUuid || score <= 0) return
      const username = getStoredUsername()
      if (username) {
        try {
          await leaderboardApi.submitScore({
            user_id: userUuid,
            username,
            avatar_color: getStoredAvatarColor(),
            score,
            game_type: gameType,
          })
        } catch { /* fail silently */ }
      } else {
        setPendingScore({ score, gameType })
        setNeedsUsername(true)
      }
    },
    [userUuid],
  )

  const submitWithUsername = useCallback(
    async (username: string, avatarColor: string) => {
      setNeedsUsername(false)
      if (!userUuid || !pendingScore) return
      try {
        await leaderboardApi.submitScore({
          user_id: userUuid,
          username,
          avatar_color: avatarColor,
          score: pendingScore.score,
          game_type: pendingScore.gameType,
        })
      } catch { /* fail silently */ }
      finally { setPendingScore(null) }
    },
    [userUuid, pendingScore],
  )

  const dismiss = useCallback(() => {
    setNeedsUsername(false)
    setPendingScore(null)
  }, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss }
}
