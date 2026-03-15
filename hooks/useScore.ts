'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getLocalScore,
  setLocalScore,
  setLastSync,
  getGameStoreRecord,
  getUserUuid,
} from '@/lib/indexeddb'
import { syncScoreToSupabase } from '@/lib/supabase-user'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export interface UseScoreResult {
  score: number
  addScore: (points: number) => Promise<void>
  syncNow: () => Promise<void>
}

/**
 * Local score in IndexedDB; sync to Supabase on game end, every 5 minutes, and on load/refresh.
 */
export function useScore(userUuid: string | null): UseScoreResult {
  const [score, setScoreState] = useState(0)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncNow = useCallback(async () => {
    if (!userUuid) return
    const record = await getGameStoreRecord()
    if (!record) return
    try {
      await syncScoreToSupabase(userUuid, record.score)
      await setLastSync(Date.now())
    } catch {
      // ignore sync errors; will retry later
    }
  }, [userUuid])

  const addScore = useCallback(
    async (points: number) => {
      const prev = await getLocalScore()
      const next = Math.max(0, prev + points)
      await setLocalScore(next)
      setScoreState(next)
    },
    [],
  )

  // Hydrate score from IndexedDB on mount
  useEffect(() => {
    getLocalScore().then(s => setScoreState(s))
  }, [])

  // Sync: on mount (page refresh), every 5 min, and when userUuid becomes available
  useEffect(() => {
    if (!userUuid) return
    syncNow()

    syncIntervalRef.current = setInterval(syncNow, SYNC_INTERVAL_MS)
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [userUuid, syncNow])

  return { score, addScore, syncNow }
}

/**
 * Get current local score (one-off read). Useful for displaying before hooks mount.
 */
export async function getScoreOnce(): Promise<number> {
  return getLocalScore()
}
