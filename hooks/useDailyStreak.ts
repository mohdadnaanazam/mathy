'use client'

/**
 * useDailyStreak
 *
 * Tracks consecutive days the user completes at least one game.
 * Fully client-side using localStorage. Works offline.
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'mathy_daily_streak'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string // YYYY-MM-DD
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.currentStreak === 'number') {
        return {
          currentStreak: parsed.currentStreak,
          longestStreak: parsed.longestStreak ?? parsed.currentStreak,
          lastPlayedDate: parsed.lastPlayedDate ?? '',
        }
      }
    }
  } catch {}
  return { currentStreak: 0, longestStreak: 0, lastPlayedDate: '' }
}

function saveStreak(data: StreakData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

/**
 * On load, check if the streak is still valid (played yesterday or today).
 * If the user missed a day, reset to 0.
 */
function getValidatedStreak(): StreakData {
  const data = loadStreak()
  if (!data.lastPlayedDate) return data

  const today = getTodayStr()
  const yesterday = getYesterdayStr()

  if (data.lastPlayedDate === today || data.lastPlayedDate === yesterday) {
    return data // streak is still valid
  }

  // Missed more than 1 day — reset
  const reset: StreakData = { currentStreak: 0, longestStreak: data.longestStreak, lastPlayedDate: '' }
  saveStreak(reset)
  return reset
}

export interface UseDailyStreakReturn {
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string
  /** Call when a game session completes */
  recordPlay: () => void
  /** True if streak just increased this session (for celebration) */
  justIncreased: boolean
  /** Dismiss the "just increased" flag */
  clearJustIncreased: () => void
}

export function useDailyStreak(): UseDailyStreakReturn {
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastPlayedDate: '' })
  const [justIncreased, setJustIncreased] = useState(false)

  useEffect(() => {
    setStreak(getValidatedStreak())
  }, [])

  const recordPlay = useCallback(() => {
    setStreak(prev => {
      const today = getTodayStr()

      // Already played today — do nothing
      if (prev.lastPlayedDate === today) return prev

      const yesterday = getYesterdayStr()
      let newStreak: number

      if (prev.lastPlayedDate === yesterday) {
        // Consecutive day — increment
        newStreak = prev.currentStreak + 1
      } else {
        // First play or gap > 1 day — start at 1
        newStreak = 1
      }

      const newLongest = Math.max(prev.longestStreak, newStreak)
      const updated: StreakData = {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastPlayedDate: today,
      }
      saveStreak(updated)
      setJustIncreased(true)
      return updated
    })
  }, [])

  const clearJustIncreased = useCallback(() => {
    setJustIncreased(false)
  }, [])

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastPlayedDate: streak.lastPlayedDate,
    recordPlay,
    justIncreased,
    clearJustIncreased,
  }
}
