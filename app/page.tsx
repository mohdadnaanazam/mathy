'use client'

import { useState, useEffect } from 'react'
import { Grid3X3, CheckCircle } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { OperationMode, type Difficulty } from '@/types'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import {
  clearGameCache,
  getMathSessionMax,
  getMathSessionPlayed,
  getMemorySessionMax,
  getMemorySessionPlayed,
  getTrueFalseSessionMax,
  getTrueFalseSessionPlayed,
  getLastPlayedSettings,
  resetMathSession,
  resetMemorySession,
  resetTrueFalseSession,
  resetAllProgress,
  setLastPlayedSettings,
  setMathSessionPlayed,
  setMemorySessionPlayed,
  setTrueFalseSessionPlayed,
  getVariantProgress,
  getSelectedGameCount,
  setSelectedGameCount,
} from '@/lib/db'
import { fetchAndCacheAllGames } from '@/lib/refreshGames'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import RefreshBanner from '@/components/ui/RefreshBanner'

type ModeLabel = 'Addition' | 'Subtraction' | 'Multiplication' | 'Division' | 'Mixture' | 'Custom'

const MODE_TO_OPERATION: Record<ModeLabel, OperationMode> = {
  Addition: 'addition',
  Subtraction: 'subtraction',
  Multiplication: 'multiplication',
  Division: 'division',
  Mixture: 'mixture',
  Custom: 'custom',
}

const CUSTOM_OP_CHOICES: { label: string; value: OperationMode }[] = [
  { label: 'Addition', value: 'addition' },
  { label: 'Subtraction', value: 'subtraction' },
  { label: 'Multiplication', value: 'multiplication' },
  { label: 'Division', value: 'division' },
]

export default function LandingPage() {
  const router = useRouter()
  const setType = useGameStore(s => s.setGameType)
  const setOperation = useGameStore(s => s.setOperation)
  const customOperations = useGameStore(s => s.customOperations)
  const toggleCustomOp = useGameStore(s => s.toggleCustomOp)
  const { used, max: maxAttempts, timeToReset, isLocked } = useAttempts()
  const { isRefreshing } = useGameTimer()
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { isSessionExpired, isResetting: isExpiryResetting, resetAndResume, recordActivity } = useSessionExpiry()
  const { secondsLeft: refreshSecondsLeft, formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')
  const [memoryDifficulty, setMemoryDifficulty] = useState<Difficulty | null>(null)
  const [memoryGamesCount, setMemoryGamesCount] = useState<number>(5)
  const [memorySessionMax, setMemorySessionMaxState] = useState<number>(10)
  const [memorySessionPlayed, setMemorySessionPlayedState] = useState<number>(0)
  const [memorySessionHydrated, setMemorySessionHydrated] = useState(false)
  const [memoryVariantPlayed, setMemoryVariantPlayed] = useState<number>(0)
  const [memoryVariantTotal, setMemoryVariantTotal] = useState<number>(20)
  const [memoryVariantRemaining, setMemoryVariantRemaining] = useState<number>(20)
  const [mathDifficulty, setMathDifficulty] = useState<Difficulty | null>(null)
  const [mathGamesCount, setMathGamesCount] = useState<number>(5)
  const [mathSessionMax, setMathSessionMaxState] = useState<number>(10)
  const [mathSessionPlayed, setMathSessionPlayedState] = useState<number>(0)
  const [mathSessionHydrated, setMathSessionHydrated] = useState(false)
  const [activeGame, setActiveGame] = useState<'math' | 'memory' | 'truefalse'>('math')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isReloadingGames, setIsReloadingGames] = useState(false)
  const showMathOperations = mathDifficulty !== null
  const [mathVariantPlayed, setMathVariantPlayed] = useState<number>(0)
  const [mathVariantTotal, setMathVariantTotal] = useState<number>(20)
  const [mathVariantRemaining, setMathVariantRemaining] = useState<number>(20)
  // True/False Math state
  const [tfDifficulty, setTfDifficulty] = useState<Difficulty | null>(null)
  const [tfGamesCount, setTfGamesCount] = useState<number>(5)
  const [tfSessionMax, setTfSessionMaxState] = useState<number>(10)
  const [tfSessionPlayed, setTfSessionPlayedState] = useState<number>(0)
  const [tfSessionHydrated, setTfSessionHydrated] = useState(false)
  const [tfVariantPlayed, setTfVariantPlayed] = useState<number>(0)
  const [tfVariantTotal, setTfVariantTotal] = useState<number>(20)
  const [tfVariantRemaining, setTfVariantRemaining] = useState<number>(20)

  const DEFAULT_GAME_COUNT = 5

  useEffect(() => {
    // Hydrate last played selections so Home reflects the last game the user played.
    getLastPlayedSettings().then((last) => {
      if (!last.gameType) return

      if (last.gameType === 'memory') {
        setActiveGame('memory')
        setType('memory')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setMemoryDifficulty(last.difficulty as Difficulty)
          setDifficulty(last.difficulty as Difficulty)
        }
        return
      }

      if (last.gameType === 'true_false') {
        setActiveGame('truefalse')
        setType('true_false')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setTfDifficulty(last.difficulty as Difficulty)
          setDifficulty(last.difficulty as Difficulty)
        }
        return
      }

      // Math
      setActiveGame('math')
      setType('math')
      if (
        last.operation === 'addition' ||
        last.operation === 'subtraction' ||
        last.operation === 'multiplication' ||
        last.operation === 'division' ||
        last.operation === 'mixture' ||
        last.operation === 'custom'
      ) {
        const label =
          last.operation === 'addition'
            ? 'Addition'
            : last.operation === 'subtraction'
              ? 'Subtraction'
              : last.operation === 'multiplication'
                ? 'Multiplication'
                : last.operation === 'division'
                  ? 'Division'
                  : last.operation === 'mixture'
                    ? 'Mixture'
                    : 'Custom'
        setActiveMode(label as ModeLabel)
        setOperation(last.operation as OperationMode)
      }
      if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
        setMathDifficulty(last.difficulty as Difficulty)
        setDifficulty(last.difficulty as Difficulty)
      }
    })

    // Restore persisted game count (or use default for first visit)
    getSelectedGameCount().then(saved => {
      const count = saved ?? DEFAULT_GAME_COUNT
      setMathGamesCount(count)
      setMemoryGamesCount(count)
      setTfGamesCount(count)
    })
  }, [setDifficulty, setOperation, setType])

  // Hydrate math & memory session progress from IndexedDB so played/remaining show correctly after return
  function hydrateSessions() {
    getMathSessionMax().then(m => { setMathSessionMaxState(m) })
    getMathSessionPlayed().then(p => setMathSessionPlayedState(p))
    setMathSessionHydrated(true)
    getMemorySessionMax().then(m => { setMemorySessionMaxState(m) })
    getMemorySessionPlayed().then(p => setMemorySessionPlayedState(p))
    setMemorySessionHydrated(true)
    getTrueFalseSessionMax().then(m => { setTfSessionMaxState(m) })
    getTrueFalseSessionPlayed().then(p => setTfSessionPlayedState(p))
    setTfSessionHydrated(true)
  }
  useEffect(() => {
    hydrateSessions()
  }, [isSessionExpired])

  // Hydrate per-variant progress (operation + difficulty) whenever either changes.
  // Also re-hydrate when session expiry state changes (after a reset, isSessionExpired
  // flips to false and we need to re-read the now-cleared IndexedDB values).
  useEffect(() => {
    if (!mathDifficulty) return
    const op = MODE_TO_OPERATION[activeMode]
    getVariantProgress(op, mathDifficulty).then(p => {
      setMathVariantPlayed(p.played)
      setMathVariantTotal(p.total)
      setMathVariantRemaining(p.remaining)
      // Clamp stepper so it never exceeds remaining (but stays at least 1 when remaining > 0).
      // Do NOT replace the user's chosen count with a default — just clamp it.
      setMathGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [activeMode, mathDifficulty, isSessionExpired])

  // Hydrate per-difficulty Memory Grid progress (easy / medium / hard separately).
  // Also re-hydrate after session expiry reset.
  useEffect(() => {
    if (!memoryDifficulty) return
    getVariantProgress('memory', memoryDifficulty).then(p => {
      setMemoryVariantPlayed(p.played)
      setMemoryVariantTotal(p.total)
      setMemoryVariantRemaining(p.remaining)
      setMemoryGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [memoryDifficulty, isSessionExpired])

  // Hydrate per-difficulty True/False Math progress.
  useEffect(() => {
    if (!tfDifficulty) return
    getVariantProgress('true_false_math', tfDifficulty).then(p => {
      setTfVariantPlayed(p.played)
      setTfVariantTotal(p.total)
      setTfVariantRemaining(p.remaining)
      setTfGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [tfDifficulty, isSessionExpired])

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') hydrateSessions() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  async function handleReloadNewGames() {
    if (!isRefreshing || isReloadingGames) return
    setIsReloadingGames(true)
    try {
      await clearGameCache()
      await resetAllProgress()
      const now = await fetchAndCacheAllGames()
      setLastFetchAt(now)
      setMathSessionMaxState(DEFAULT_GAME_COUNT)
      setMathSessionPlayedState(0)
      setMathGamesCount(DEFAULT_GAME_COUNT)
      setMemorySessionMaxState(DEFAULT_GAME_COUNT)
      setMemorySessionPlayedState(0)
      setMemoryGamesCount(DEFAULT_GAME_COUNT)
      setMathVariantPlayed(0)
      setMathVariantRemaining(20)
      setMemoryVariantPlayed(0)
      setMemoryVariantRemaining(20)
      setTfSessionMaxState(DEFAULT_GAME_COUNT)
      setTfSessionPlayedState(0)
      setTfGamesCount(DEFAULT_GAME_COUNT)
      setTfVariantPlayed(0)
      setTfVariantRemaining(20)
      await setSelectedGameCount(DEFAULT_GAME_COUNT)
    } catch (err) {
      setLastFetchAt(null)
    } finally {
      setIsReloadingGames(false)
    }
  }

  async function play(operationMode?: ModeLabel) {
    if (isNavigating) return
    setIsNavigating(true)
    await recordActivity()
    setType('math')
    setDifficulty(mathDifficulty ?? 'medium')
    const op = operationMode ? MODE_TO_OPERATION[operationMode] : 'mixture'
    setOperation(op)
    await setLastPlayedSettings({
      gameType: 'math',
      operation: op,
      difficulty: (mathDifficulty ?? 'medium') as Difficulty,
    })
    await setSelectedGameCount(mathGamesCount)
    // Always start a fresh math session with the selected number of games.
    await resetMathSession(mathGamesCount)
    setMathSessionMaxState(mathGamesCount)
    setMathSessionPlayedState(0)
    router.push(`/game?op=${op}`)
  }

  async function playMemoryGrid() {
    if (isNavigating || memoryDifficulty === null) return
    setIsNavigating(true)
    await recordActivity()
    setType('memory')
    setDifficulty(memoryDifficulty)
    await setLastPlayedSettings({
      gameType: 'memory',
      operation: null,
      difficulty: memoryDifficulty,
    })
    if (memoryGamesCount !== memorySessionMax) {
      await resetMemorySession(memoryGamesCount)
      setMemorySessionMaxState(memoryGamesCount)
      setMemorySessionPlayedState(0)
    }
    router.push('/game?mode=memory')
  }

  async function playTrueFalse() {
    if (isNavigating || tfDifficulty === null) return
    setIsNavigating(true)
    await recordActivity()
    setType('true_false')
    setDifficulty(tfDifficulty)
    await setLastPlayedSettings({
      gameType: 'true_false',
      operation: null,
      difficulty: tfDifficulty,
    })
    await setSelectedGameCount(tfGamesCount)
    await resetTrueFalseSession(tfGamesCount)
    setTfSessionMaxState(tfGamesCount)
    setTfSessionPlayedState(0)
    router.push('/game?mode=truefalse')
  }

  function handlePlay() {
    if (isLocked || isRefreshing) return

    if (activeGame === 'math') {
      if (mathDifficulty === null) return
      if (mathVariantRemaining <= 0) return
      play(activeMode)
      return
    }

    if (activeGame === 'truefalse') {
      if (tfDifficulty === null) return
      if (tfVariantRemaining <= 0) return
      playTrueFalse()
      return
    }

    // Memory grid
    if (memoryDifficulty === null) return
    if (memoryVariantRemaining <= 0) return
    playMemoryGrid()
  }

  const canPlayMath = mathDifficulty !== null && mathVariantRemaining > 0
  const canPlayMemory = memoryDifficulty !== null && memoryVariantRemaining > 0
  const canPlayTf = tfDifficulty !== null && tfVariantRemaining > 0
  const memoryVariantExhausted = memoryVariantRemaining <= 0
  const mathVariantExhausted = mathVariantRemaining <= 0
  const tfVariantExhausted = tfVariantRemaining <= 0

  const playDisabled =
    isNavigating ||
    isLocked ||
    isRefreshing ||
    isSessionExpired ||
    (activeGame === 'math' && !canPlayMath) ||
    (activeGame === 'memory' && !canPlayMemory) ||
    (activeGame === 'truefalse' && !canPlayTf)

  return (
    <main
      className="min-h-screen overflow-x-hidden relative bg-[var(--bg-surface)]"
      style={{
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 sm:py-10 md:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Train your brain
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md">
            Quick math duels. No signup. Pick a mode and play.
          </p>
        </div>
      </section>

      {/* Math game section – operation first, then difficulty (matches reference UI) */}
      <section
        className={`border-b border-[var(--border-subtle)] py-6 sm:py-8 md:py-10 transition-opacity duration-200 ${activeGame !== 'math' ? 'opacity-50' : ''}`}
      >
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 space-y-5 sm:space-y-6">
          {/* 1. Operation icons */}
          <div className="flex flex-col gap-3">
            <div className={`rounded-xl border p-3 transition-colors ${activeGame === 'math' ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]/20' : 'border-[var(--border-subtle)]'}`}>
              <div className="section-label mb-0.5 text-xs">Choose operation</div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Addition, subtraction, multiplication, division, mixture, or custom.
              </p>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {[
                { symbol: '+', label: 'Addition' as ModeLabel },
                { symbol: '−', label: 'Subtraction' as ModeLabel },
                { symbol: '×', label: 'Multiplication' as ModeLabel },
                { symbol: '÷', label: 'Division' as ModeLabel },
                { symbol: 'Mix', label: 'Mixture' as ModeLabel },
                { symbol: '⚙', label: 'Custom' as ModeLabel },
              ].map(item => {
                const active = activeMode === item.label
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { setActiveMode(item.label); setActiveGame('math') }}
                    className="flex flex-col items-center justify-center rounded-xl px-2 py-3 sm:px-3 sm:py-3.5 transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.15)' : 'none',
                    }}
                  >
                    <span
                      className="text-xl font-bold mb-1"
                      style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                    >
                      {item.symbol}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold tracking-[0.06em] text-slate-300">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom: choose which operations to include */}
          {activeMode === 'Custom' && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-zinc-900/30 p-3 space-y-1.5">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                Include (e.g. only × & ÷ or only + & −)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_OP_CHOICES.map(({ label, value }) => {
                  const on = customOperations.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { toggleCustomOp(value); setActiveGame('math') }}
                      className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-full border transition-colors ${
                        on
                          ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)] text-[var(--accent-orange)]'
                          : 'border-zinc-700 bg-zinc-800/50 text-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 2. Choose difficulty (Easy / Medium / Hard) – math icon, no grid size */}
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-[var(--border-subtle)] p-3">
              <div className="section-label mb-0.5 text-xs">Choose difficulty</div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Pick Easy, Medium, or Hard, then press Play.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                const active = mathDifficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setMathDifficulty(d); setDifficulty(d); setActiveGame('math') }}
                    className="flex flex-col items-center justify-center rounded-xl px-2 py-3 sm:px-3 sm:py-3.5 transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.15)' : 'none',
                    }}
                  >
                    <span
                      className="text-[10px] sm:text-xs font-semibold tracking-[0.06em]"
                      style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                    >
                      {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of games: only visible after user has chosen a difficulty */}
          {mathDifficulty !== null && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-1">
                <span className="section-label text-xs mb-0.5">Number of games</span>
                <span className="text-[11px] sm:text-xs text-slate-400">
                  Max 20 per type and level. Tap − or + to adjust.
                </span>
                {mathSessionHydrated && (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">
                      {mathVariantPlayed} / {mathVariantTotal} played · {mathVariantRemaining} remaining
                    </span>
                    {mathVariantExhausted && (
                      <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">
                        {refreshReady
                          ? '🎉 New games available! Tap Reload to play.'
                          : `Next games unlock in ${refreshFormatted}`}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (mathVariantExhausted) return
                    setMathGamesCount(v => Math.max(1, Math.min(v - 1, mathVariantRemaining)))
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={mathVariantExhausted}
                >
                  −
                </button>
                <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">
                  {mathGamesCount}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (mathVariantExhausted) return
                    setMathGamesCount(v =>
                      Math.min(Math.max(v + 1, 1), mathVariantRemaining),
                    )
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={mathVariantExhausted}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Memory Grid Game section – selecting an option sets this as the active game */}
      <section
        className={`border-b border-[var(--border-subtle)] py-6 sm:py-8 md:py-10 transition-opacity duration-200 ${activeGame !== 'memory' ? 'opacity-50' : ''}`}
      >
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 space-y-5 sm:space-y-6">
          <div className={`rounded-xl border p-3 transition-colors ${activeGame === 'memory' ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]/20' : 'border-[var(--border-subtle)]'}`}>
            <div className="section-label mb-0.5 text-xs flex items-center gap-1.5">
              <Grid3X3 size={14} style={{ color: 'var(--accent-orange)' }} />
              Memory Grid Game
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Remember the highlighted blocks, then tap them in order. Grid size depends on difficulty.
            </p>
          </div>

          {/* Difficulty helper copy */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-zinc-900/30 p-3">
            <div className="section-label mb-0.5 text-xs">
              Choose difficulty
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Pick Easy, Medium, or Hard. Then tap Play to start the memory grid game.
            </p>
          </div>

          {/* Difficulty options – clicking sets active game to memory; required before Play */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = memoryDifficulty === d
              const gridSize = d === 'easy' ? '3×3' : d === 'medium' ? '4×4' : '5×5'
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setMemoryDifficulty(d); setActiveGame('memory') }}
                  className="flex flex-col items-center justify-center rounded-xl px-2 py-3 sm:px-3 sm:py-3.5 transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                  style={{
                    backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                    borderRadius: 12,
                    border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.15)' : 'none',
                  }}
                >
                  <span className="text-[10px] sm:text-xs font-semibold tracking-[0.06em] text-slate-300" style={{ color: active ? 'var(--accent-orange)' : undefined }}>
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                    {gridSize}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Number of games for memory: same rules as math, only visible after difficulty chosen */}
          {memoryDifficulty !== null && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-1">
                <span className="section-label text-xs mb-0.5">Number of games</span>
                <span className="text-[11px] sm:text-xs text-slate-400">
                  Max 20 per type and level. Tap − or + to adjust.
                </span>
                {memorySessionHydrated && (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">
                      {memoryVariantPlayed} / {memoryVariantTotal} played · {memoryVariantRemaining} remaining
                    </span>
                    {memoryVariantExhausted && (
                      <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">
                        {refreshReady
                          ? '🎉 New games available! Tap Reload to play.'
                          : `Next games unlock in ${refreshFormatted}`}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (memoryVariantExhausted) return
                    setMemoryGamesCount(v => Math.max(1, Math.min(v - 1, memoryVariantRemaining)))
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={memoryVariantExhausted}
                >
                  −
                </button>
                <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">
                  {memoryGamesCount}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (memoryVariantExhausted) return
                    setMemoryGamesCount(v =>
                      Math.min(Math.max(v + 1, 1), memoryVariantRemaining),
                    )
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={memoryVariantExhausted}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* True / False Math section */}
      <section
        className={`border-b border-[var(--border-subtle)] py-6 sm:py-8 md:py-10 transition-opacity duration-200 ${activeGame !== 'truefalse' ? 'opacity-50' : ''}`}
      >
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 space-y-5 sm:space-y-6">
          <div className={`rounded-xl border p-3 transition-colors ${activeGame === 'truefalse' ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]/20' : 'border-[var(--border-subtle)]'}`}>
            <div className="section-label mb-0.5 text-xs flex items-center gap-1.5">
              <CheckCircle size={14} style={{ color: 'var(--accent-orange)' }} />
              True / False Math
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Is the equation correct? Answer TRUE or FALSE. Wrong results are close to the real answer.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-zinc-900/30 p-3">
            <div className="section-label mb-0.5 text-xs">Choose difficulty</div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Pick Easy, Medium, or Hard. Then tap Play to start.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = tfDifficulty === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setTfDifficulty(d); setActiveGame('truefalse') }}
                  className="flex flex-col items-center justify-center rounded-xl px-2 py-3 sm:px-3 sm:py-3.5 transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                  style={{
                    backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                    borderRadius: 12,
                    border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.15)' : 'none',
                  }}
                >
                  <span
                    className="text-[10px] sm:text-xs font-semibold tracking-[0.06em]"
                    style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                  >
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                  </span>
                </button>
              )
            })}
          </div>

          {tfDifficulty !== null && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-1">
                <span className="section-label text-xs mb-0.5">Number of games</span>
                <span className="text-[11px] sm:text-xs text-slate-400">
                  Max 20 per difficulty. Tap − or + to adjust.
                </span>
                {tfSessionHydrated && (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">
                      {tfVariantPlayed} / {tfVariantTotal} played · {tfVariantRemaining} remaining
                    </span>
                    {tfVariantExhausted && (
                      <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">
                        {refreshReady
                          ? '🎉 New games available! Tap Reload to play.'
                          : `Next games unlock in ${refreshFormatted}`}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (tfVariantExhausted) return
                    setTfGamesCount(v => Math.max(1, Math.min(v - 1, tfVariantRemaining)))
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={tfVariantExhausted}
                >
                  −
                </button>
                <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">
                  {tfGamesCount}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (tfVariantExhausted) return
                    setTfGamesCount(v => Math.min(Math.max(v + 1, 1), tfVariantRemaining))
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                  disabled={tfVariantExhausted}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Session expiry banner — stays inline in content flow */}
      {isSessionExpired && (
        <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4">
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
            <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-amber-400">
                You've been away for over an hour. Reset your progress to continue playing.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await resetAndResume()
                  setMathSessionMaxState(DEFAULT_GAME_COUNT)
                  setMathSessionPlayedState(0)
                  setMathGamesCount(DEFAULT_GAME_COUNT)
                  setMemorySessionMaxState(DEFAULT_GAME_COUNT)
                  setMemorySessionPlayedState(0)
                  setMemoryGamesCount(DEFAULT_GAME_COUNT)
                  setMathVariantPlayed(0)
                  setMathVariantRemaining(20)
                  setMemoryVariantPlayed(0)
                  setMemoryVariantRemaining(20)
                  setTfSessionMaxState(DEFAULT_GAME_COUNT)
                  setTfSessionPlayedState(0)
                  setTfGamesCount(DEFAULT_GAME_COUNT)
                  setTfVariantPlayed(0)
                  setTfVariantRemaining(20)
                  await setSelectedGameCount(DEFAULT_GAME_COUNT)
                }}
                disabled={isExpiryResetting}
                className="shrink-0 inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--accent-orange)',
                  color: '#111827',
                  border: '1px solid var(--accent-orange-hover)',
                }}
              >
                {isExpiryResetting ? 'Resetting…' : 'Reset Progress'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Floating sticky Play button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="pointer-events-auto w-full"
          style={{
            background: 'linear-gradient(to top, var(--bg-surface) 60%, transparent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center gap-2 py-3 sm:py-4">
            {/* Refresh countdown banner */}
            {(mathVariantExhausted || memoryVariantExhausted || tfVariantExhausted) && (
              <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />
            )}
            {isRefreshing && !isSessionExpired && (
              <button
                type="button"
                onClick={handleReloadNewGames}
                disabled={isReloadingGames}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--accent-orange)',
                  color: '#111827',
                  border: '1px solid var(--accent-orange-hover)',
                }}
              >
                {isReloadingGames ? '…' : 'Reload'}
              </button>
            )}
            <button
              type="button"
              onClick={handlePlay}
              disabled={playDisabled}
              className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-10 py-3.5 sm:px-12 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0"
              style={{
                backgroundColor: isLocked ? 'var(--border-subtle)' : 'var(--accent-orange)',
                color: isLocked ? '#64748b' : '#111827',
                border: `1px solid ${isLocked ? 'var(--border-subtle)' : 'var(--accent-orange-hover)'}`,
                boxShadow: isLocked ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {isLocked
                ? 'Limit reached (15/hour)'
                : isSessionExpired
                  ? 'Reset progress to play'
                  : isRefreshing
                    ? 'Reload to play'
                    : (activeGame === 'math' && !canPlayMath) || (activeGame === 'memory' && !canPlayMemory)
                      ? 'Choose difficulty first'
                      : isNavigating
                        ? 'Starting…'
                        : `Play ${activeGame === 'math' ? 'math' : activeGame === 'truefalse' ? 'true/false' : 'memory'} game`}
              {!isLocked &&
                !isNavigating &&
                !isRefreshing &&
                !isSessionExpired &&
                ((canPlayMath && activeGame === 'math') ||
                  (canPlayMemory && activeGame === 'memory') ||
                  (canPlayTf && activeGame === 'truefalse')) &&
                ' →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
