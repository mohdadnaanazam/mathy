'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  db,
  getMathSessionMax,
  getMathSessionPlayed,
  setMathSessionMax,
  setMathSessionPlayed,
  getMemorySessionMax,
  getMemorySessionPlayed,
  setMemorySessionMax,
  setMemorySessionPlayed,
  getTrueFalseSessionMax,
  getTrueFalseSessionPlayed,
  setTrueFalseSessionMax,
  setTrueFalseSessionPlayed,
  getGenericSessionMax,
  getGenericSessionPlayed,
  setGenericSessionMax,
  setGenericSessionPlayed,
} from '@/lib/db'

// ============================================================================
// Types
// ============================================================================

export type SessionGameType = 
  | 'math'
  | 'memory'
  | 'true_false'
  | 'square_root'
  | 'fractions'
  | 'percentage'
  | 'algebra'
  | 'speed_math'
  | 'logic_puzzle'
  | 'ssc_cgl'
  | 'tictactoe'
  | 'speed_sort'

export interface GameSessionState {
  sessionMax: number
  sessionPlayed: number
  sessionScore: number
  isComplete: boolean
  isLoading: boolean
}

export interface UseGameSessionReturn extends GameSessionState {
  /** Advance to next round, incrementing played count */
  nextRound: () => Promise<void>
  /** Mark session as complete */
  finishSession: () => void
  /** Reset session with new max */
  resetSession: (newMax?: number) => Promise<void>
  /** Add to score */
  addScore: (points: number) => void
  /** Get progress percentage */
  progress: number
  /** Remaining rounds */
  remaining: number
}

export interface GameHookConfig {
  /** Key for IndexedDB storage */
  sessionKey: string
  /** Default max rounds per session */
  defaultSessionMax: number
  /** Callback when session completes */
  onComplete?: (result: GameResult) => void
}

export interface GameResult {
  score: number
  correct: number
  total: number
  timeSpent: number
}

// ============================================================================
// Session Storage Adapters
// ============================================================================

interface SessionAdapter {
  getMax: () => Promise<number>
  getPlayed: () => Promise<number>
  setMax: (max: number) => Promise<void>
  setPlayed: (played: number) => Promise<void>
}

function getSessionAdapter(gameType: SessionGameType): SessionAdapter {
  switch (gameType) {
    case 'math':
      return {
        getMax: getMathSessionMax,
        getPlayed: getMathSessionPlayed,
        setMax: setMathSessionMax,
        setPlayed: setMathSessionPlayed,
      }
    case 'memory':
      return {
        getMax: getMemorySessionMax,
        getPlayed: getMemorySessionPlayed,
        setMax: setMemorySessionMax,
        setPlayed: setMemorySessionPlayed,
      }
    case 'true_false':
      return {
        getMax: getTrueFalseSessionMax,
        getPlayed: getTrueFalseSessionPlayed,
        setMax: setTrueFalseSessionMax,
        setPlayed: setTrueFalseSessionPlayed,
      }
    default:
      // Use generic session for all other game types
      return {
        getMax: () => getGenericSessionMax(gameType),
        getPlayed: () => getGenericSessionPlayed(gameType),
        setMax: (max: number) => setGenericSessionMax(gameType, max),
        setPlayed: (played: number) => setGenericSessionPlayed(gameType, played),
      }
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useGameSession Hook
 * Manages game session state with IndexedDB persistence.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param gameType - The type of game for session management
 * @param config - Optional configuration overrides
 * @returns Session state and control functions
 * 
 * Preconditions:
 * - gameType is a valid SessionGameType
 * - Must be used in a client component
 * 
 * Postconditions:
 * - Session state persists to IndexedDB
 * - State initializes from IndexedDB on mount
 * - Provides consistent API across all game types
 */
export function useGameSession(
  gameType: SessionGameType,
  config?: Partial<GameHookConfig>
): UseGameSessionReturn {
  const defaultMax = config?.defaultSessionMax ?? 10
  const onComplete = config?.onComplete

  // State
  const [sessionMax, setSessionMax] = useState(defaultMax)
  const [sessionPlayed, setSessionPlayed] = useState(0)
  const [sessionScore, setSessionScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [startTime] = useState(() => Date.now())

  // Get adapter for this game type
  const adapter = useMemo(() => getSessionAdapter(gameType), [gameType])

  // Derived state
  const isComplete = sessionPlayed >= sessionMax
  const progress = sessionMax > 0 ? (sessionPlayed / sessionMax) * 100 : 0
  const remaining = Math.max(0, sessionMax - sessionPlayed)

  // Initialize from IndexedDB
  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const [max, played] = await Promise.all([
          adapter.getMax(),
          adapter.getPlayed(),
        ])

        if (mounted) {
          setSessionMax(max || defaultMax)
          setSessionPlayed(played || 0)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[useGameSession] Failed to load session:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      mounted = false
    }
  }, [adapter, defaultMax])

  // Next round - increment played count
  const nextRound = useCallback(async () => {
    const newPlayed = sessionPlayed + 1
    setSessionPlayed(newPlayed)

    try {
      await adapter.setPlayed(newPlayed)
    } catch (error) {
      console.error('[useGameSession] Failed to persist played count:', error)
    }

    // Check if session is now complete
    if (newPlayed >= sessionMax && onComplete) {
      onComplete({
        score: sessionScore,
        correct: sessionScore, // Assuming 1 point per correct answer
        total: sessionMax,
        timeSpent: Date.now() - startTime,
      })
    }
  }, [sessionPlayed, sessionMax, sessionScore, adapter, onComplete, startTime])

  // Finish session manually
  const finishSession = useCallback(() => {
    if (onComplete) {
      onComplete({
        score: sessionScore,
        correct: sessionScore,
        total: sessionPlayed,
        timeSpent: Date.now() - startTime,
      })
    }
  }, [sessionScore, sessionPlayed, onComplete, startTime])

  // Reset session
  const resetSession = useCallback(async (newMax?: number) => {
    const max = newMax ?? defaultMax
    setSessionMax(max)
    setSessionPlayed(0)
    setSessionScore(0)

    try {
      await Promise.all([
        adapter.setMax(max),
        adapter.setPlayed(0),
      ])
    } catch (error) {
      console.error('[useGameSession] Failed to reset session:', error)
    }
  }, [adapter, defaultMax])

  // Add to score
  const addScore = useCallback((points: number) => {
    setSessionScore(prev => prev + points)
  }, [])

  return {
    sessionMax,
    sessionPlayed,
    sessionScore,
    isComplete,
    isLoading,
    nextRound,
    finishSession,
    resetSession,
    addScore,
    progress,
    remaining,
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a typed game session hook for a specific game type.
 * Useful for creating pre-configured hooks for each game.
 * 
 * @param gameType - The game type to create a hook for
 * @param defaultConfig - Default configuration for the hook
 * @returns A hook function that returns UseGameSessionReturn
 * 
 * @example
 * const useMathSession = createGameSessionHook('math', { defaultSessionMax: 10 })
 * // In component:
 * const { sessionPlayed, nextRound } = useMathSession()
 */
export function createGameSessionHook(
  gameType: SessionGameType,
  defaultConfig?: Partial<GameHookConfig>
) {
  return function useTypedGameSession(
    config?: Partial<GameHookConfig>
  ): UseGameSessionReturn {
    return useGameSession(gameType, { ...defaultConfig, ...config })
  }
}

// ============================================================================
// Pre-configured Hooks
// ============================================================================

export const useMathSession = createGameSessionHook('math', { defaultSessionMax: 10 })
export const useMemorySession = createGameSessionHook('memory', { defaultSessionMax: 10 })
export const useTrueFalseSession = createGameSessionHook('true_false', { defaultSessionMax: 10 })
export const useSpeedSortSession = createGameSessionHook('speed_sort', { defaultSessionMax: 10 })
export const useTicTacToeSession = createGameSessionHook('tictactoe', { defaultSessionMax: 5 })

export default useGameSession
