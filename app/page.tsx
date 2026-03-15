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
  const [mathDifficulty, setMathDifficulty] = useState<Difficulty | null>(null)
  const [mathGamesCount, setMathGamesCount] = useState<number>(10)
  const [mathSessionMax, setMathSessionMaxState] = useState<number>(10)
  const [mathSessionPlayed, setMathSessionPlayedState] = useState<number>(0)
  const [mathSessionHydrated, setMathSessionHydrated] = useState(false)
  const [activeGame, setActiveGame] = useState<'math' | 'memory'>('math')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isReloadingGames, setIsReloadingGames] = useState(false)
  const showMathOperations = mathDifficulty !== null

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
    // If user changed "Number of games", start a new session (reset played). Otherwise keep progress.
    if (mathGamesCount !== mathSessionMax) {
      await resetMathSession(mathGamesCount)
      setMathSessionMaxState(mathGamesCount)
      setMathSessionPlayedState(0)
    }
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
      play(activeMode)
    } else {
      if (memoryDifficulty === null) return
      playMemoryGrid()
    }
  }

  const canPlayMath = mathDifficulty !== null
  const canPlayMemory = memoryDifficulty !== null

  const mathSessionFinished =
    mathSessionHydrated && mathSessionPlayed >= mathSessionMax

  const playDisabled = isNavigating || isLocked || isRefreshing ||
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
                      {mathSessionPlayed} / {mathSessionMax} played · {Math.max(0, mathSessionMax - mathSessionPlayed)} remaining
                    </span>
                    {mathSessionPlayed >= mathSessionMax && (
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
                    if (mathSessionFinished) return
                    setMathGamesCount(v => Math.max(1, v - 1))
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                  disabled={mathSessionFinished}
                >
                  −
                </button>
                <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
                  {mathGamesCount}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (mathSessionFinished) return
                    setMathGamesCount(v => Math.min(20, v + 1))
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                  disabled={mathSessionFinished}
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
                      {memorySessionPlayed} / {memorySessionMax} played · {Math.max(0, memorySessionMax - memorySessionPlayed)} remaining
                    </span>
                    {memorySessionPlayed >= memorySessionMax && (
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
                  onClick={() => setMemoryGamesCount(v => Math.max(1, v - 1))}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200"
                >
                  −
                </button>
                <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
                  {memoryGamesCount}
                </div>
                <button
                  type="button"
                  onClick={() => setMemoryGamesCount(v => Math.min(20, v + 1))}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200"
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
              : isRefreshing
                ? 'Refreshing…'
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
