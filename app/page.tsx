'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, X, Divide, Sparkles, Settings2, Grid3X3, LayoutGrid, Calculator } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { OperationMode, type Difficulty } from '@/types'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import { formatTime } from '@/lib/utils'
import {
  clearGameCache,
  getMathSessionMax,
  getMathSessionPlayed,
  getMemorySessionMax,
  getMemorySessionPlayed,
  resetMathSession,
  resetMemorySession,
  setMathSessionPlayed,
  setMemorySessionPlayed,
  getVariantProgress,
} from '@/lib/db'
import { useGameRefreshStore } from '@/store/gameRefreshStore'

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
  const { formatted: gamesRefreshFormatted, hasTimer, isRefreshing } = useGameTimer()
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')
  const [memoryDifficulty, setMemoryDifficulty] = useState<Difficulty | null>(null)
  const [memoryGamesCount, setMemoryGamesCount] = useState<number>(10)
  const [memorySessionMax, setMemorySessionMaxState] = useState<number>(10)
  const [memorySessionPlayed, setMemorySessionPlayedState] = useState<number>(0)
  const [memorySessionHydrated, setMemorySessionHydrated] = useState(false)
  const [memoryVariantPlayed, setMemoryVariantPlayed] = useState<number>(0)
  const [memoryVariantTotal, setMemoryVariantTotal] = useState<number>(20)
  const [memoryVariantRemaining, setMemoryVariantRemaining] = useState<number>(20)
  const [mathDifficulty, setMathDifficulty] = useState<Difficulty | null>(null)
  const [mathGamesCount, setMathGamesCount] = useState<number>(10)
  const [mathSessionMax, setMathSessionMaxState] = useState<number>(10)
  const [mathSessionPlayed, setMathSessionPlayedState] = useState<number>(0)
  const [mathSessionHydrated, setMathSessionHydrated] = useState(false)
  const [activeGame, setActiveGame] = useState<'math' | 'memory'>('math')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isReloadingGames, setIsReloadingGames] = useState(false)
  const showMathOperations = mathDifficulty !== null
  const [mathVariantPlayed, setMathVariantPlayed] = useState<number>(0)
  const [mathVariantTotal, setMathVariantTotal] = useState<number>(20)
  const [mathVariantRemaining, setMathVariantRemaining] = useState<number>(20)

  // Hydrate math & memory session progress from IndexedDB so played/remaining show correctly after return
  function hydrateSessions() {
    getMathSessionMax().then(m => { setMathSessionMaxState(m); setMathGamesCount(m) })
    getMathSessionPlayed().then(p => setMathSessionPlayedState(p))
    setMathSessionHydrated(true)
    getMemorySessionMax().then(m => { setMemorySessionMaxState(m); setMemoryGamesCount(m) })
    getMemorySessionPlayed().then(p => setMemorySessionPlayedState(p))
    setMemorySessionHydrated(true)
  }
  useEffect(() => {
    hydrateSessions()
  }, [])

  // Hydrate per-variant progress (operation + difficulty) whenever either changes.
  useEffect(() => {
    if (!mathDifficulty) return
    const op = MODE_TO_OPERATION[activeMode]
    getVariantProgress(op, mathDifficulty).then(p => {
      setMathVariantPlayed(p.played)
      setMathVariantTotal(p.total)
      setMathVariantRemaining(p.remaining)
      // Clamp stepper so it never exceeds remaining (but stays at least 1 when remaining > 0)
      setMathGamesCount(prev =>
        p.remaining <= 0 ? 0 : Math.min(Math.max(prev || 5, 1), p.remaining),
      )
    })
  }, [activeMode, mathDifficulty])

  // Hydrate per-difficulty Memory Grid progress (easy / medium / hard separately).
  useEffect(() => {
    if (!memoryDifficulty) return
    getVariantProgress('memory', memoryDifficulty).then(p => {
      setMemoryVariantPlayed(p.played)
      setMemoryVariantTotal(p.total)
      setMemoryVariantRemaining(p.remaining)
      setMemoryGamesCount(prev =>
        p.remaining <= 0 ? 0 : Math.min(Math.max(prev || 5, 1), p.remaining),
      )
    })
  }, [memoryDifficulty])

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
      setLastFetchAt(null)
      await setMathSessionPlayed(0)
      setMathSessionPlayedState(0)
      await setMemorySessionPlayed(0)
      setMemorySessionPlayedState(0)
    } finally {
      setIsReloadingGames(false)
    }
  }

  async function play(operationMode?: ModeLabel) {
    if (isNavigating) return
    setIsNavigating(true)
    setType('math')
    setDifficulty(mathDifficulty ?? 'medium')
    const op = operationMode ? MODE_TO_OPERATION[operationMode] : 'mixture'
    setOperation(op)
    // Always start a fresh math session with the selected number of games.
    await resetMathSession(mathGamesCount)
    setMathSessionMaxState(mathGamesCount)
    setMathSessionPlayedState(0)
    router.push(`/game?op=${op}`)
  }

  async function playMemoryGrid() {
    if (isNavigating || memoryDifficulty === null) return
    setIsNavigating(true)
    setType('memory')
    setDifficulty(memoryDifficulty)
    if (memoryGamesCount !== memorySessionMax) {
      await resetMemorySession(memoryGamesCount)
      setMemorySessionMaxState(memoryGamesCount)
      setMemorySessionPlayedState(0)
    }
    router.push('/game?mode=memory')
  }

  function handlePlay() {
    if (isLocked || isRefreshing) return

    if (activeGame === 'math') {
      if (mathDifficulty === null) return
      // Prevent starting a math session when this variant is already exhausted (20 / 20).
      if (mathVariantRemaining <= 0) return
      play(activeMode)
      return
    }

    // Memory grid
    if (memoryDifficulty === null) return
    // Prevent starting when this difficulty has 0 remaining (per-difficulty progress).
    if (memoryVariantRemaining <= 0) return
    playMemoryGrid()
  }

  const canPlayMath = mathDifficulty !== null && mathVariantRemaining > 0
  const canPlayMemory = memoryDifficulty !== null && memoryVariantRemaining > 0
  const memoryVariantExhausted = memoryVariantRemaining <= 0

  const mathVariantExhausted = mathVariantRemaining <= 0

  const playDisabled =
    isNavigating ||
    isLocked ||
    isRefreshing ||
    (activeGame === 'math' && !canPlayMath) ||
    (activeGame === 'memory' && !canPlayMemory)

  return (
    <main
      className="min-h-screen overflow-x-hidden relative pt-16 sm:pt-20 md:pt-24 bg-[var(--bg-surface)]"
      style={{
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-1.5">
            Train your brain
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-lg">
            Quick math duels. No signup. Pick a mode and play.
          </p>
        </div>
      </section>

      {/* Math game section – operation first, then difficulty (matches reference UI) */}
      <section
        className={`border-b border-[var(--border-subtle)] py-5 sm:py-6 md:py-8 transition-opacity duration-200 ${activeGame !== 'math' ? 'opacity-60' : ''}`}
      >
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 space-y-4 sm:space-y-5">
          {/* 1. Operation icons */}
          <div className="flex flex-col gap-3">
            <div className={`rounded-xl border p-3 transition-colors ${activeGame === 'math' ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]/20' : 'border-[var(--border-subtle)]'}`}>
              <div className="section-label mb-0.5 text-xs">Choose operation</div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Addition, subtraction, multiplication, division, mixture, or custom.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
              {[
                { icon: Plus, label: 'Addition' as ModeLabel },
                { icon: Minus, label: 'Subtraction' as ModeLabel },
                { icon: X, label: 'Multiplication' as ModeLabel },
                { icon: Divide, label: 'Division' as ModeLabel },
                { icon: Sparkles, label: 'Mixture' as ModeLabel },
                { icon: Settings2, label: 'Custom' as ModeLabel },
              ].map(item => {
                const active = activeMode === item.label
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { setActiveMode(item.label); setActiveGame('math') }}
                    className="flex flex-col items-center justify-center rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                    }}
                  >
                    <item.icon
                      size={20}
                      strokeWidth={active ? 2.4 : 2}
                      className="mb-1"
                      style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                    />
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
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                const active = mathDifficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setMathDifficulty(d); setDifficulty(d); setActiveGame('math') }}
                    className="flex flex-col items-center justify-center rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                    }}
                  >
                    <Calculator
                      size={20}
                      strokeWidth={active ? 2.4 : 2}
                      className="mb-1"
                      style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                    />
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
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex flex-col">
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
                        You finished {activeMode} ({mathDifficulty}). Try{' '}
                        {mathDifficulty === 'easy'
                          ? 'Medium or Hard'
                          : mathDifficulty === 'medium'
                            ? 'Hard'
                            : 'another operation or difficulty'}
                        , or increase the number of games.
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (mathVariantExhausted) return
                    setMathGamesCount(v => Math.max(1, Math.min(v - 1, mathVariantRemaining)))
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                  disabled={mathVariantExhausted}
                >
                  −
                </button>
                <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
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
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
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
        className={`border-b border-[var(--border-subtle)] py-5 sm:py-6 md:py-8 transition-opacity duration-200 ${activeGame !== 'memory' ? 'opacity-60' : ''}`}
      >
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 space-y-4 sm:space-y-5">
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
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = memoryDifficulty === d
              const gridSize = d === 'easy' ? '3×3' : d === 'medium' ? '4×4' : '5×5'
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setMemoryDifficulty(d); setActiveGame('memory') }}
                  className="flex flex-col items-center justify-center rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 12,
                    border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                  }}
                >
                  <LayoutGrid
                    size={20}
                    strokeWidth={active ? 2.4 : 2}
                    className="mb-1"
                    style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                  />
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
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex flex-col">
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
                        You finished Memory Grid ({memoryDifficulty ?? 'easy'}). Try{' '}
                        {memoryDifficulty === 'easy'
                          ? 'Medium or Hard'
                          : memoryDifficulty === 'medium'
                            ? 'Hard'
                            : 'a different game or increase the number of rounds'}
                        , or increase the number of games.
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (memoryVariantExhausted) return
                    setMemoryGamesCount(v => Math.max(1, Math.min(v - 1, memoryVariantRemaining)))
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                  disabled={memoryVariantExhausted}
                >
                  −
                </button>
                <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
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
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                  disabled={memoryVariantExhausted}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Single Play button – starts the currently selected game; disabled when 15 plays used this hour */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 flex flex-col items-center gap-3">
          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.12em] text-slate-400" />
          <button
            type="button"
            onClick={handlePlay}
            disabled={playDisabled}
            className="inline-flex items-center justify-center rounded-full px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none shrink-0"
            style={{
              backgroundColor: isLocked ? 'var(--border-subtle)' : 'var(--accent-orange)',
              color: isLocked ? '#64748b' : '#111827',
              border: `1px solid ${isLocked ? 'var(--border-subtle)' : 'var(--accent-orange-hover)'}`,
              boxShadow: isLocked ? 'none' : '0 4px 16px rgba(249,115,22,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            {isLocked
              ? 'Limit reached (15/hour)'
              : (activeGame === 'math' && !canPlayMath) || (activeGame === 'memory' && !canPlayMemory)
                ? 'Choose difficulty first'
                : isNavigating
                  ? 'Starting…'
                  : `Play ${activeGame === 'math' ? 'math' : 'memory'} game`}
            {!isLocked &&
              !isNavigating &&
              !isRefreshing &&
              ((canPlayMath && activeGame === 'math') ||
                (canPlayMemory && activeGame === 'memory')) &&
              ' →'}
          </button>
        </div>
      </section>

      {/* Refresh timing + reload when user was away >1h (isRefreshing) */}
      <section
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.14em] text-slate-400">
              {hasTimer && gamesRefreshFormatted
                ? gamesRefreshFormatted
                : isRefreshing
                  ? 'Refreshing…'
                  : ''}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-slate-500">
              A new game loads every one hour.
            </span>
          </div>
          {isRefreshing && (
            <div className="flex flex-col items-center gap-1.5">
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
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500">
                Tap to reload a new game
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
