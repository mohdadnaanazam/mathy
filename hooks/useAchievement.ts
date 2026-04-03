'use client'

/**
 * useAchievement
 *
 * Tracks perfect-score game completions across unique game modes.
 * Every time 2 different modes are completed with perfect scores,
 * triggers a celebration. Resets after each celebration so it's repeatable.
 */

import { useState, useCallback } from 'react'

const REQUIRED_PERFECT_GAMES = 2

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
  const [perfectGames, setPerfectGames] = useState<string[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementGames, setAchievementGames] = useState<[string, string] | null>(null)

  const reportPerfectGame = useCallback((gameLabel: string) => {
    setPerfectGames(prev => {
      // Don't count the same game mode twice in the same streak
      if (prev.includes(gameLabel)) return prev

      const updated = [...prev, gameLabel]

      if (updated.length >= REQUIRED_PERFECT_GAMES) {
        const games = updated.slice(0, 2) as [string, string]
        setAchievementGames(games)
        setShowCelebration(true)
        // Reset for next streak
        return []
      }

      return updated
    })
  }, [])

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  return { reportPerfectGame, showCelebration, dismissCelebration, achievementGames }
}
