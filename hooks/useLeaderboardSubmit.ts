'use client'

import { useState, useCallback, useRef } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getLocalScore } from '@/lib/indexeddb'
import { getStoredIdentity } from '@/lib/userIdentity'

/**
 * Modular hook for submitting the TOTAL score to the leaderboard.
 * Fully automatic — uses auto-generated identity, no manual input needed.
 * Always reads the latest total from IndexedDB (single source of truth).
 * Fails silently — never breaks game logic.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [lastSubmitStatus, setLastSubmitStatus] = useState<string | null>(null)
  const submitInProgress = useRef(false)

  const promptAndSubmit = useCallback(
    async (_score: number, _gameType: string) => {
      if (!userUuid) return
      if (submitInProgress.current) return
      submitInProgress.current = true
      setLastSubmitStatus('submitting...')

      try {
        // Wait for IndexedDB write to settle
        await new Promise(r => setTimeout(r, 200))

        const freshScore = await getLocalScore()
        console.log('[Leaderboard] Total score from IndexedDB:', freshScore)
        if (freshScore <= 0) {
          setLastSubmitStatus('skipped (score=0)')
          return
        }

        // Get auto-generated identity
        const identity = getStoredIdentity()
        const username = identity?.username || `Player_${userUuid.slice(0, 6).toUpperCase()}`

        const payload = {
          user_id: userUuid,
          username,
          score: freshScore,
          game_type: 'total',
        }
        console.log('[Leaderboard] Sending:', JSON.stringify(payload))

        const result = await leaderboardApi.submitScore(payload)
        console.log('[Leaderboard] ✅ Success:', JSON.stringify(result))
        setLastSubmitStatus(`✅ sent ${freshScore}`)
      } catch (err: any) {
        console.error('[Leaderboard] ❌ Failed:', err?.message || err)
        setLastSubmitStatus(`❌ ${err?.message || 'failed'}`)
      } finally {
        submitInProgress.current = false
      }
    },
    [userUuid],
  )

  // Keep these for backward compatibility but they're no longer needed
  const needsUsername = false
  const submitWithUsername = useCallback(async () => {}, [])
  const dismiss = useCallback(() => {}, [])

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss, lastSubmitStatus }
}
