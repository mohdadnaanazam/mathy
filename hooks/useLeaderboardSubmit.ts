'use client'

import { useState, useCallback } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getStoredUsername, getStoredAvatarColor } from '@/components/ui/UsernameModal'
import { getLocalScore } from '@/lib/indexeddb'

/**
 * Modular hook for submitting scores to the leaderboard.
 * Completely isolated — never modifies existing game logic.
 * Fails silently on any error.
 *
 * Always reads the latest total score from IndexedDB at submission time
 * to avoid stale React closure values.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pendingGameType, setPendingGameType] = useState<string | null>(null)

  const promptAndSubmit = useCallback(
    async (_score: number, gameType: string) => {
      if (!userUuid) return
      // Always read the freshest total score from IndexedDB
      const freshScore = await getLocalScore()
      if (freshScore <= 0) return
      const username = getStoredUsername()
      if (username) {
        try {
          await leaderboardApi.submitScore({
            user_id: userUuid,
            username,
            avatar_color: getStoredAvatarColor(),
            score: freshScore,
            game_type: gameType,
          })
        } catch { /* fail silently */ }
      } else {
        setPendingGameType(gameType)
        setNeedsUsername(true)
      }
    },
    [userUuid],
  )

  const submitWithUsername = useCallback(
    async (username: string, avatarColor: string) => {
      setNeedsUsername(false)
      if (!userUuid || !pendingGameType) return
      try {
        const freshScore = await getLocalScore()
        await leaderboardApi.submitScore({
          user_id: userUuid,
          username,
          avatar_color: avatarColor,
          score: freshScore,
          game_type: pendingGameType,
        })
      } catch { /* fail silently */ }
      finally { setPendingGameType(null) }
    },
    [userUuid, pendingGameType],
  )

  const dismiss = useCallback(() => {
    setNeedsUsername(false)
    setPendingGameType(null)
  }, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss }
}
