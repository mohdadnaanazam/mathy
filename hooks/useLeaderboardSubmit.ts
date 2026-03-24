'use client'

import { useState, useCallback } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getStoredUsername, getStoredAvatarColor } from '@/components/ui/UsernameModal'
import { getLocalScore } from '@/lib/indexeddb'

/**
 * Modular hook for submitting the TOTAL score to the leaderboard.
 * Always reads the latest total from IndexedDB (single source of truth).
 * Submits as game_type='total'. Fails silently — never breaks game logic.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pending, setPending] = useState(false)

  const promptAndSubmit = useCallback(
    async (_score: number, _gameType: string) => {
      if (!userUuid) return

      // Small delay to ensure IndexedDB write from addScore has settled
      await new Promise(r => setTimeout(r, 100))

      const freshScore = await getLocalScore()
      console.log('[Leaderboard] Total score from IndexedDB:', freshScore)
      if (freshScore <= 0) return

      const username = getStoredUsername()
      if (username) {
        try {
          const result = await leaderboardApi.submitScore({
            user_id: userUuid,
            username,
            avatar_color: getStoredAvatarColor(),
            score: freshScore,
            game_type: 'total',
          })
          console.log('[Leaderboard] Submit success:', result)
        } catch (err) {
          console.error('[Leaderboard] Submit failed:', err)
        }
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
        console.log('[Leaderboard] Submit with username, score:', freshScore)
        const result = await leaderboardApi.submitScore({
          user_id: userUuid,
          username,
          avatar_color: avatarColor,
          score: freshScore,
          game_type: 'total',
        })
        console.log('[Leaderboard] Submit success:', result)
      } catch (err) {
        console.error('[Leaderboard] Submit failed:', err)
      } finally {
        setPending(false)
      }
    },
    [userUuid, pending],
  )

  const dismiss = useCallback(() => {
    setNeedsUsername(false)
    setPending(false)
  }, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss }
}
