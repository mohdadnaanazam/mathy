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
 * to avoid stale React closure values. Submits as game_type='total'.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pending, setPending] = useState(false)

  const promptAndSubmit = useCallback(
    async (_score: number, _gameType: string) => {
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
            game_type: 'total',
          })
        } catch { /* fail silently */ }
      } else {
        setPending(true)
        setNeedsUsername(true)
      }
    },
    [userUuid],
  )

  const submitWithUsername = useCallback(
    async (username: string, avatarColor: string) => {
      setNeedsUsername(false)
      if (!userUuid || !pending) return
      try {
        const freshScore = await getLocalScore()
        await leaderboardApi.submitScore({
          user_id: userUuid,
          username,
          avatar_color: avatarColor,
          score: freshScore,
          game_type: 'total',
        })
      } catch { /* fail silently */ }
      finally { setPending(false) }
    },
    [userUuid, pending],
  )

  const dismiss = useCallback(() => {
    setNeedsUsername(false)
    setPending(false)
  }, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss }
}
