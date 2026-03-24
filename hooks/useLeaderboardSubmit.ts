'use client'

import { useState, useCallback, useRef } from 'react'
import { leaderboardApi } from '@/src/services/leaderboardService'
import { getStoredUsername, getStoredAvatarColor } from '@/components/ui/UsernameModal'
import { getLocalScore } from '@/lib/indexeddb'

/**
 * Modular hook for submitting the TOTAL score to the leaderboard.
 * Always reads the latest total from IndexedDB (single source of truth).
 * Fails silently — never breaks game logic.
 */
export function useLeaderboardSubmit(userUuid: string | null) {
  const [needsUsername, setNeedsUsername] = useState(false)
  const [pending, setPending] = useState(false)
  const [lastSubmitStatus, setLastSubmitStatus] = useState<string | null>(null)
  const submitInProgress = useRef(false)

  const promptAndSubmit = useCallback(
    async (_score: number, _gameType: string) => {
      if (!userUuid) {
        console.warn('[Leaderboard] No userUuid, skipping submit')
        return
      }
      if (submitInProgress.current) {
        console.warn('[Leaderboard] Submit already in progress, skipping')
        return
      }
      submitInProgress.current = true
      setLastSubmitStatus('submitting...')

      try {
        // Wait for IndexedDB write to fully settle
        await new Promise(r => setTimeout(r, 200))

        const freshScore = await getLocalScore()
        console.log('[Leaderboard] === SUBMIT START ===')
        console.log('[Leaderboard] userUuid:', userUuid)
        console.log('[Leaderboard] Total score from IndexedDB:', freshScore)

        if (freshScore <= 0) {
          console.warn('[Leaderboard] Score is 0, skipping')
          setLastSubmitStatus('skipped (score=0)')
          return
        }

        const username = getStoredUsername()
        console.log('[Leaderboard] Username from localStorage:', username)

        if (username) {
          const payload = {
            user_id: userUuid,
            username,
            avatar_color: getStoredAvatarColor(),
            score: freshScore,
            game_type: 'total',
          }
          console.log('[Leaderboard] Sending payload:', JSON.stringify(payload))

          const result = await leaderboardApi.submitScore(payload)
          console.log('[Leaderboard] ✅ Submit SUCCESS:', JSON.stringify(result))
          setLastSubmitStatus(`✅ sent ${freshScore}`)
        } else {
          console.log('[Leaderboard] No username stored, showing modal')
          setPending(true)
          setNeedsUsername(true)
          setLastSubmitStatus('waiting for username')
        }
      } catch (err: any) {
        console.error('[Leaderboard] ❌ Submit FAILED:', err?.message || err)
        setLastSubmitStatus(`❌ failed: ${err?.message || 'unknown'}`)
      } finally {
        submitInProgress.current = false
        console.log('[Leaderboard] === SUBMIT END ===')
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
        console.log('[Leaderboard] ✅ Submit SUCCESS:', JSON.stringify(result))
        setLastSubmitStatus(`✅ sent ${freshScore}`)
      } catch (err: any) {
        console.error('[Leaderboard] ❌ Submit FAILED:', err?.message || err)
        setLastSubmitStatus(`❌ failed: ${err?.message || 'unknown'}`)
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

  return { promptAndSubmit, needsUsername, submitWithUsername, dismiss, lastSubmitStatus }
}
