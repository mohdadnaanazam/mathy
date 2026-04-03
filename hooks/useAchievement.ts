'use client'

/**
 * useAchievement
 *
 * Tracks game completions across unique game modes.
 * Every time 2 different modes are completed, triggers a celebration.
 * Resets after each celebration so it's repeatable.
 */

import { useState, useCallback } from 'react'

const REQUIRED_GAMES = 2

export interface UseAchievementReturn {
  /** Call when any game session completes */
  reportGameComplete: (gameLabel: string) => void
  /** True when achievement just unlocked (show celebration) */
  showCelebration: boolean
  /** Dismiss the celebration */
  dismissCelebration: () => void
  /** The two game names that triggered the achievement */
  achievementGames: [string, string] | null
}

export function useAchievement(): UseAchievementReturn {
  const [completedGames, setCompletedGames] = useState<string[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementGames, setAchievementGames] = useState<[string, string] | null>(null)

  const reportGameComplete = useCallback((gameLabel: string) => {
    setCompletedGames(prev => {
      // Don't count the same game mode twice in the same streak
      if (prev.includes(gameLabel)) return prev

      const updated = [...prev, gameLabel]

      if (updated.length >= REQUIRED_GAMES) {
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

  return { reportGameComplete, showCelebration, dismissCelebration, achievementGames }
}
