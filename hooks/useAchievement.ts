'use client'

/**
 * useAchievement
 *
 * Tracks perfect-score (20/20) game completions across unique game modes.
 * When 2 different modes are completed with perfect scores, triggers achievement.
 * Persists to localStorage. Achievement triggers only once per user.
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'mathy_achievement_data'
const REQUIRED_PERFECT_GAMES = 2

export interface AchievementData {
  perfectGames: string[] // unique game mode identifiers, e.g. "Addition Easy"
  unlocked: boolean
}

function loadData(): AchievementData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.perfectGames)) {
        return { perfectGames: parsed.perfectGames, unlocked: !!parsed.unlocked }
      }
    }
  } catch {}
  return { perfectGames: [], unlocked: false }
}

function saveData(data: AchievementData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export interface UseAchievementReturn {
  /** Call when a game session ends with a perfect score */
  reportPerfectGame: (gameLabel: string) => void
  /** True when achievement just unlocked (show celebration) */
  showCelebration: boolean
  /** Dismiss the celebration */
  dismissCelebration: () => void
  /** The two game names that triggered the achievement */
  achievementGames: [string, string] | null
}

export function useAchievement(): UseAchievementReturn {
  const [data, setData] = useState<AchievementData>({ perfectGames: [], unlocked: false })
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementGames, setAchievementGames] = useState<[string, string] | null>(null)

  useEffect(() => {
    setData(loadData())
  }, [])

  const reportPerfectGame = useCallback((gameLabel: string) => {
    setData(prev => {
      if (prev.unlocked) return prev
      if (prev.perfectGames.includes(gameLabel)) return prev

      const updated: AchievementData = {
        perfectGames: [...prev.perfectGames, gameLabel],
        unlocked: prev.perfectGames.length + 1 >= REQUIRED_PERFECT_GAMES,
      }

      saveData(updated)

      if (updated.unlocked && !prev.unlocked) {
        const games = updated.perfectGames.slice(0, 2) as [string, string]
        setAchievementGames(games)
        setShowCelebration(true)
      }

      return updated
    })
  }, [])

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  return { reportPerfectGame, showCelebration, dismissCelebration, achievementGames }
}
