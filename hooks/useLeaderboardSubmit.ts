'use client'

import { useState, useCallback } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getStoredUsername } from '@/components/ui/UsernameModal'

/**
 * Modular hook for submitting scores to the leaderboard.
 * Completely isolated — never modifies existing game logic.
 * Fails silently on any error.
 *
 * Usage:
 *   const { promptAndSubmit, needsUsername, submitWithUsername, dismiss } = useLeaderboardSubmit(userUuid)
 *   // Call promptAndSubmit(score, gameType, difficulty) when game ends
 *   // If needsUsername is true, show UsernameModal and call submitWithUsername(name)
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pendingScore, setPendingScore] = useState<{
    score: number
    gameType: string
    difficulty: string
  } | null>(null)

  const promptAndSubmit = useCallback(
    async (score: number, gameType: string, difficulty: string) => {
      if (!userUuid || score <= 0) return

      const username = getStoredUsername()
      if (username) {
        // Already have a username — submit silently
        try {
          await leaderboardApi.submitScore({
            user_id: userUuid,
            username,
            score,
            game_type: gameType,
            difficulty,
          })
        } catch {
          // Fail silently — leaderboard must never break the game
        }
      } else {
        // Need to ask for username
        setPendingScore({ score, gameType, difficulty })
        setNeedsUsername(true)
      }
    },
    [userUuid],
  )

  const submitWithUsername = useCallback(
    async (username: string) => {
      setNeedsUsername(false)
      if (!userUuid || !pendingScore) return

      try {
        await leaderboardApi.submitScore({
          user_id: userUuid,
          username,
          score: pendingScore.score,
          game_type: pendingScore.gameType,
          difficulty: pendingScore.difficulty,
        })
      } catch {
        // Fail silently
      } finally {
        setPendingScore(null)
      }
    },
    [userUuid, pendingScore],
  )

  const dismiss = useCallback(() => {
    setNeedsUsername(false)
    setPendingScore(null)
  }, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss }
}
