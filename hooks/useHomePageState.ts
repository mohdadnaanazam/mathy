'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import { OperationMode, type Difficulty } from '@/types'
import {
  clearGameCache, resetAllProgress,
  getMathSessionMax, getMathSessionPlayed,
  getMemorySessionMax, getMemorySessionPlayed,
  getTrueFalseSessionMax, getTrueFalseSessionPlayed,
  getLastPlayedSettings, setLastPlayedSettings,
  resetMathSession, resetMemorySession, resetTrueFalseSession,
  getVariantProgress, getSelectedGameCount, setSelectedGameCount,
} from '@/lib/db'
import { fetchAndCacheAllGames } from '@/lib/refreshGames'

export type ModeLabel = 'Addition' | 'Subtraction' | 'Multiplication' | 'Division' | 'Mixture' | 'Custom'
export type ActiveGame = 'math' | 'memory' | 'truefalse'

export const MODE_TO_OPERATION: Record<ModeLabel, OperationMode> = {
  Addition: 'addition', Subtraction: 'subtraction', Multiplication: 'multiplication',
  Division: 'division', Mixture: 'mixture', Custom: 'custom',
}

const DEFAULT_GAME_COUNT = 5

/** Per-game-type variant state (played/total/remaining/count/difficulty). */
interface VariantState {
  difficulty: Difficulty | null
  setDifficulty: (d: Difficulty) => void
  gamesCount: number
  setGamesCount: React.Dispatch<React.SetStateAction<number>>
  sessionHydrated: boolean
  variantPlayed: number
  variantTotal: number
  variantRemaining: number
  variantExhausted: boolean
}

export function useHomePageState() {
  const router = useRouter()

  // ── Global stores & hooks ──────────────────────────────────────────
  const setType = useGameStore(s => s.setGameType)
  const setOperation = useGameStore(s => s.setOperation)
  const customOperations = useGameStore(s => s.customOperations)
  const toggleCustomOp = useGameStore(s => s.toggleCustomOp)
  const setStoreDifficulty = useGameStore(s => s.setDifficulty)
  const { used, max: maxAttempts, timeToReset, isLocked } = useAttempts()
  const { isRefreshing } = useGameTimer()
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)
  const { isSessionExpired, isResetting: isExpiryResetting, resetAndResume, recordActivity } = useSessionExpiry()
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  // ── Local UI state ─────────────────────────────────────────────────
  const [activeGame, setActiveGame] = useState<ActiveGame>('math')
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isReloadingGames, setIsReloadingGames] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Suppresses the reload banner right after a fresh reload so the user
  // sees a clean slate instead of stale "new games available" messaging.
  const [justReloaded, setJustReloaded] = useState(false)

  // ── Math variant state ─────────────────────────────────────────────
  const [mathDifficulty, setMathDifficulty] = useState<Difficulty | null>(null)
  const [mathGamesCount, setMathGamesCount] = useState(DEFAULT_GAME_COUNT)
  const [mathSessionMax, setMathSessionMax] = useState(10)
  const [mathSessionPlayed, setMathSessionPlayed_] = useState(0)
  const [mathSessionHydrated, setMathSessionHydrated] = useState(false)
  const [mathVariantPlayed, setMathVariantPlayed] = useState(0)
  const [mathVariantTotal, setMathVariantTotal] = useState(20)
  const [mathVariantRemaining, setMathVariantRemaining] = useState(20)

  // ── Memory variant state ───────────────────────────────────────────
  const [memoryDifficulty, setMemoryDifficulty] = useState<Difficulty | null>(null)
  const [memoryGamesCount, setMemoryGamesCount] = useState(DEFAULT_GAME_COUNT)
  const [memorySessionMax, setMemorySessionMax] = useState(10)
  const [memorySessionPlayed, setMemorySessionPlayed_] = useState(0)
  const [memorySessionHydrated, setMemorySessionHydrated] = useState(false)
  const [memoryVariantPlayed, setMemoryVariantPlayed] = useState(0)
  const [memoryVariantTotal, setMemoryVariantTotal] = useState(20)
  const [memoryVariantRemaining, setMemoryVariantRemaining] = useState(20)

  // ── True/False variant state ───────────────────────────────────────
  const [tfDifficulty, setTfDifficulty] = useState<Difficulty | null>(null)
  const [tfGamesCount, setTfGamesCount] = useState(DEFAULT_GAME_COUNT)
  const [tfSessionMax, setTfSessionMax] = useState(10)
  const [tfSessionPlayed, setTfSessionPlayed_] = useState(0)
  const [tfSessionHydrated, setTfSessionHydrated] = useState(false)
  const [tfVariantPlayed, setTfVariantPlayed] = useState(0)
  const [tfVariantTotal, setTfVariantTotal] = useState(20)
  const [tfVariantRemaining, setTfVariantRemaining] = useState(20)

  // ── Hydration effects ──────────────────────────────────────────────

  // Restore last-played settings from IndexedDB
  useEffect(() => {
    getLastPlayedSettings().then((last) => {
      if (!last.gameType) return
      if (last.gameType === 'memory') {
        setActiveGame('memory'); setType('memory')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setMemoryDifficulty(last.difficulty as Difficulty); setStoreDifficulty(last.difficulty as Difficulty)
        }
        return
      }
      if (last.gameType === 'true_false') {
        setActiveGame('truefalse'); setType('true_false')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setTfDifficulty(last.difficulty as Difficulty); setStoreDifficulty(last.difficulty as Difficulty)
        }
        return
      }
      setActiveGame('math'); setType('math')
      if (last.operation && last.operation in MODE_TO_OPERATION || ['addition','subtraction','multiplication','division','mixture','custom'].includes(last.operation ?? '')) {
        const opToLabel: Record<string, ModeLabel> = {
          addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication',
          division: 'Division', mixture: 'Mixture', custom: 'Custom',
        }
        setActiveMode(opToLabel[last.operation!] ?? 'Mixture')
        setOperation(last.operation as OperationMode)
      }
      if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
        setMathDifficulty(last.difficulty as Difficulty); setStoreDifficulty(last.difficulty as Difficulty)
      }
    })
    getSelectedGameCount().then(saved => {
      const c = saved ?? DEFAULT_GAME_COUNT
      setMathGamesCount(c); setMemoryGamesCount(c); setTfGamesCount(c)
    })
  }, [setStoreDifficulty, setOperation, setType])

  // Hydrate session progress from IndexedDB
  function hydrateSessions() {
    Promise.all([
      getMathSessionMax().then(m => setMathSessionMax(m)),
      getMathSessionPlayed().then(p => setMathSessionPlayed_(p)),
    ]).then(() => setMathSessionHydrated(true))
    Promise.all([
      getMemorySessionMax().then(m => setMemorySessionMax(m)),
      getMemorySessionPlayed().then(p => setMemorySessionPlayed_(p)),
    ]).then(() => setMemorySessionHydrated(true))
    Promise.all([
      getTrueFalseSessionMax().then(m => setTfSessionMax(m)),
      getTrueFalseSessionPlayed().then(p => setTfSessionPlayed_(p)),
    ]).then(() => setTfSessionHydrated(true))
  }

  useEffect(() => { hydrateSessions(); setMounted(true) }, [isSessionExpired])

  // Clear the justReloaded flag once the timer picks up the fresh timestamp
  // (isRefreshing becomes false). This way, when the cache eventually expires
  // again, justReloaded is already false and the banner will show.
  useEffect(() => {
    if (justReloaded && !isRefreshing) setJustReloaded(false)
  }, [justReloaded, isRefreshing])

  // Per-variant progress hydration
  useEffect(() => {
    if (!mathDifficulty) return
    getVariantProgress(MODE_TO_OPERATION[activeMode], mathDifficulty).then(p => {
      setMathVariantPlayed(p.played); setMathVariantTotal(p.total); setMathVariantRemaining(p.remaining)
      setMathGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [activeMode, mathDifficulty, isSessionExpired])

  useEffect(() => {
    if (!memoryDifficulty) return
    getVariantProgress('memory', memoryDifficulty).then(p => {
      setMemoryVariantPlayed(p.played); setMemoryVariantTotal(p.total); setMemoryVariantRemaining(p.remaining)
      setMemoryGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [memoryDifficulty, isSessionExpired])

  useEffect(() => {
    if (!tfDifficulty) return
    getVariantProgress('true_false_math', tfDifficulty).then(p => {
      setTfVariantPlayed(p.played); setTfVariantTotal(p.total); setTfVariantRemaining(p.remaining)
      setTfGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [tfDifficulty, isSessionExpired])

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') hydrateSessions() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────

  function resetAllCounts() {
    setMathSessionMax(DEFAULT_GAME_COUNT); setMathSessionPlayed_(0); setMathGamesCount(DEFAULT_GAME_COUNT)
    setMemorySessionMax(DEFAULT_GAME_COUNT); setMemorySessionPlayed_(0); setMemoryGamesCount(DEFAULT_GAME_COUNT)
    setMathVariantPlayed(0); setMathVariantRemaining(20)
    setMemoryVariantPlayed(0); setMemoryVariantRemaining(20)
    setTfSessionMax(DEFAULT_GAME_COUNT); setTfSessionPlayed_(0); setTfGamesCount(DEFAULT_GAME_COUNT)
    setTfVariantPlayed(0); setTfVariantRemaining(20)
  }

  const handleReload = useCallback(async () => {
    if (isReloadingGames) return
    setIsReloadingGames(true)
    try {
      // If session expired, clear the expired flag first
      if (isSessionExpired) await resetAndResume()

      // Reset progress and counts
      await resetAllProgress()
      resetAllCounts()
      await setSelectedGameCount(DEFAULT_GAME_COUNT)

      // Clear cache and fetch fresh games
      await clearGameCache()
      const now = await fetchAndCacheAllGames()
      setLastFetchAt(now)
      setJustReloaded(true)
    } catch { /* stop spinner even on failure */ }
    finally { setIsReloadingGames(false) }
  }, [isReloadingGames, isSessionExpired, resetAndResume, setLastFetchAt])

  /** Safety timeout: if navigation hasn't completed after 6s, reset the spinner. */
  const NAV_TIMEOUT_MS = 6000

  async function playMath() {
    if (isNavigating) return
    setIsNavigating(true)
    const timeout = setTimeout(() => setIsNavigating(false), NAV_TIMEOUT_MS)
    try {
      const op = MODE_TO_OPERATION[activeMode]
      const diff = (mathDifficulty ?? 'medium') as Difficulty
      setType('math'); setStoreDifficulty(diff); setOperation(op)
      // Run all IndexedDB writes in parallel — they're independent
      await Promise.all([
        recordActivity(),
        setLastPlayedSettings({ gameType: 'math', operation: op, difficulty: diff }),
        setSelectedGameCount(mathGamesCount),
        resetMathSession(mathGamesCount),
      ])
      setMathSessionMax(mathGamesCount); setMathSessionPlayed_(0)
      router.push(`/game?op=${op}`)
    } catch {
      setIsNavigating(false)
      clearTimeout(timeout)
    }
  }

  async function playMemory() {
    if (isNavigating || memoryDifficulty === null) return
    setIsNavigating(true)
    const timeout = setTimeout(() => setIsNavigating(false), NAV_TIMEOUT_MS)
    try {
      setType('memory'); setStoreDifficulty(memoryDifficulty)
      const writes: Promise<unknown>[] = [
        recordActivity(),
        setLastPlayedSettings({ gameType: 'memory', operation: null, difficulty: memoryDifficulty }),
      ]
      if (memoryGamesCount !== memorySessionMax) {
        writes.push(resetMemorySession(memoryGamesCount))
        setMemorySessionMax(memoryGamesCount); setMemorySessionPlayed_(0)
      }
      await Promise.all(writes)
      router.push('/game?mode=memory')
    } catch {
      setIsNavigating(false)
      clearTimeout(timeout)
    }
  }

  async function playTrueFalse() {
    if (isNavigating || tfDifficulty === null) return
    setIsNavigating(true)
    const timeout = setTimeout(() => setIsNavigating(false), NAV_TIMEOUT_MS)
    try {
      setType('true_false'); setStoreDifficulty(tfDifficulty)
      await Promise.all([
        recordActivity(),
        setLastPlayedSettings({ gameType: 'true_false', operation: null, difficulty: tfDifficulty }),
        setSelectedGameCount(tfGamesCount),
        resetTrueFalseSession(tfGamesCount),
      ])
      setTfSessionMax(tfGamesCount); setTfSessionPlayed_(0)
      router.push('/game?mode=truefalse')
    } catch {
      setIsNavigating(false)
      clearTimeout(timeout)
    }
  }

  function handlePlay() {
    if (isLocked) return
    if (activeGame === 'math') { if (!mathDifficulty || mathVariantRemaining <= 0) return; playMath() }
    else if (activeGame === 'truefalse') { if (!tfDifficulty || tfVariantRemaining <= 0) return; playTrueFalse() }
    else { if (!memoryDifficulty || memoryVariantRemaining <= 0) return; playMemory() }
  }

  /** Continue playing without resetting — just clear the expired flag and resume. */
  const handleContinue = useCallback(async () => {
    await recordActivity()
    await resetAndResume()
  }, [recordActivity, resetAndResume])

  // ── Computed values ────────────────────────────────────────────────
  const canPlayMath = mathDifficulty !== null && mathVariantRemaining > 0
  const canPlayMemory = memoryDifficulty !== null && memoryVariantRemaining > 0
  const canPlayTf = tfDifficulty !== null && tfVariantRemaining > 0
  const canPlayActive =
    (activeGame === 'math' && canPlayMath) ||
    (activeGame === 'memory' && canPlayMemory) ||
    (activeGame === 'truefalse' && canPlayTf)

  const mathVariantExhausted = mathVariantRemaining <= 0
  const memoryVariantExhausted = memoryVariantRemaining <= 0
  const tfVariantExhausted = tfVariantRemaining <= 0

  // True when any active game type has unfinished variant games
  const hasUnfinishedGames =
    (activeGame === 'math' && canPlayMath) ||
    (activeGame === 'memory' && canPlayMemory) ||
    (activeGame === 'truefalse' && canPlayTf)

  const playDisabled =
    isNavigating || isLocked || isReloadingGames ||
    (activeGame === 'math' && !canPlayMath) ||
    (activeGame === 'memory' && !canPlayMemory) ||
    (activeGame === 'truefalse' && !canPlayTf)

  const playLabel = isReloadingGames
    ? 'Loading…'
    : isLocked
      ? 'Limit reached'
      : (activeGame === 'math' && !canPlayMath) || (activeGame === 'memory' && !canPlayMemory) || (activeGame === 'truefalse' && !canPlayTf)
        ? 'Choose difficulty'
        : isNavigating
          ? 'Starting…'
          : hasUnfinishedGames
            ? 'Continue playing'
            : `Play ${activeGame === 'math' ? 'math' : activeGame === 'truefalse' ? 'true/false' : 'memory'}`

  // ── Return ─────────────────────────────────────────────────────────
  return {
    // UI state
    mounted, activeGame, setActiveGame, activeMode, setActiveMode,
    isNavigating, isReloading: isReloadingGames,

    // Attempts / lock
    used, maxAttempts, timeToReset, isLocked,

    // Session expiry
    isSessionExpired, hasUnfinishedGames, justReloaded,

    // Refresh
    isRefreshing, refreshFormatted, refreshTier, refreshReady,

    // Math
    mathDifficulty, setMathDifficulty: (d: Difficulty) => { setMathDifficulty(d); setStoreDifficulty(d); setActiveGame('math') },
    mathGamesCount, setMathGamesCount,
    mathSessionHydrated, mathVariantPlayed, mathVariantTotal, mathVariantRemaining, mathVariantExhausted,

    // Memory
    memoryDifficulty, setMemoryDifficulty: (d: Difficulty) => { setMemoryDifficulty(d); setActiveGame('memory') },
    memoryGamesCount, setMemoryGamesCount,
    memorySessionHydrated, memoryVariantPlayed, memoryVariantTotal, memoryVariantRemaining, memoryVariantExhausted,

    // True/False
    tfDifficulty, setTfDifficulty: (d: Difficulty) => { setTfDifficulty(d); setActiveGame('truefalse') },
    tfGamesCount, setTfGamesCount,
    tfSessionHydrated, tfVariantPlayed, tfVariantTotal, tfVariantRemaining, tfVariantExhausted,

    // Custom ops (math)
    customOperations, toggleCustomOp,

    // Computed
    canPlayActive, playDisabled, playLabel,

    // Handlers
    handlePlay, handleReload, handleContinue,
  }
}
