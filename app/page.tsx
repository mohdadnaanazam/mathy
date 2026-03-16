'use client'

import { useState, useEffect } from 'react'
import { Grid3X3, CheckCircle, Calculator, Minus, Plus } from 'lucide-react'
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
  { label: '+', value: 'addition' },
  { label: '−', value: 'subtraction' },
  { label: '×', value: 'multiplication' },
  { label: '÷', value: 'division' },
]

/* ── Reusable sub-components ─────────────────────────────────────────── */

function DifficultyPills({
  value,
  onChange,
  gridSizes,
}: {
  value: Difficulty | null
  onChange: (d: Difficulty) => void
  gridSizes?: Record<Difficulty, string>
}) {
  return (
    <div className="flex gap-1.5">
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
        const active = value === d
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className="flex-1 py-1.5 rounded-lg text-center transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: active ? 'var(--accent-orange-muted)' : 'rgba(39,39,42,0.5)',
              border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
              color: active ? 'var(--accent-orange)' : '#a1a1aa',
            }}
          >
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
              {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
            </span>
            {gridSizes && (
              <span className="block text-[9px] mt-0.5" style={{ color: active ? 'var(--accent-orange)' : '#71717a' }}>
                {gridSizes[d]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function GameStepper({
  count,
  onDecrement,
  onIncrement,
  disabled,
}: {
  count: number
  onDecrement: () => void
  onIncrement: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 mr-1">Games</span>
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        className="h-7 w-7 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-slate-300 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-30"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[1.5rem] text-center font-mono text-sm text-white font-semibold">
        {count}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        className="h-7 w-7 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-slate-300 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-30"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

function ProgressLine({
  played,
  total,
  remaining,
  exhausted,
  refreshReady,
  refreshFormatted,
}: {
  played: number
  total: number
  remaining: number
  exhausted: boolean
  refreshReady: boolean
  refreshFormatted: string
}) {
  return (
    <div className="mt-1.5">
      <span className="text-[10px] font-mono text-slate-500">
        {played}/{total} played · {remaining} left
      </span>
      {exhausted && (
        <span className="text-[10px] font-mono text-amber-400 ml-2">
          {refreshReady ? '🎉 New games ready!' : `Unlock in ${refreshFormatted}`}
        </span>
      )}
    </div>
  )
}

/* ── Main page component ─────────────────────────────────────────────── */

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
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

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
  const [mounted, setMounted] = useState(false)
  const [mathVariantPlayed, setMathVariantPlayed] = useState<number>(0)
  const [mathVariantTotal, setMathVariantTotal] = useState<number>(20)
  const [mathVariantRemaining, setMathVariantRemaining] = useState<number>(20)
  const [tfDifficulty, setTfDifficulty] = useState<Difficulty | null>(null)
  const [tfGamesCount, setTfGamesCount] = useState<number>(5)
  const [tfSessionMax, setTfSessionMaxState] = useState<number>(10)
  const [tfSessionPlayed, setTfSessionPlayedState] = useState<number>(0)
  const [tfSessionHydrated, setTfSessionHydrated] = useState(false)
  const [tfVariantPlayed, setTfVariantPlayed] = useState<number>(0)
  const [tfVariantTotal, setTfVariantTotal] = useState<number>(20)
  const [tfVariantRemaining, setTfVariantRemaining] = useState<number>(20)

  const DEFAULT_GAME_COUNT = 5

  /* ── Effects (unchanged logic) ───────────────────────────────────── */

  useEffect(() => {
    getLastPlayedSettings().then((last) => {
      if (!last.gameType) return
      if (last.gameType === 'memory') {
        setActiveGame('memory'); setType('memory')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setMemoryDifficulty(last.difficulty as Difficulty); setDifficulty(last.difficulty as Difficulty)
        }
        return
      }
      if (last.gameType === 'true_false') {
        setActiveGame('truefalse'); setType('true_false')
        if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
          setTfDifficulty(last.difficulty as Difficulty); setDifficulty(last.difficulty as Difficulty)
        }
        return
      }
      setActiveGame('math'); setType('math')
      if (
        last.operation === 'addition' || last.operation === 'subtraction' ||
        last.operation === 'multiplication' || last.operation === 'division' ||
        last.operation === 'mixture' || last.operation === 'custom'
      ) {
        const label =
          last.operation === 'addition' ? 'Addition'
            : last.operation === 'subtraction' ? 'Subtraction'
              : last.operation === 'multiplication' ? 'Multiplication'
                : last.operation === 'division' ? 'Division'
                  : last.operation === 'mixture' ? 'Mixture' : 'Custom'
        setActiveMode(label as ModeLabel)
        setOperation(last.operation as OperationMode)
      }
      if (last.difficulty === 'easy' || last.difficulty === 'medium' || last.difficulty === 'hard') {
        setMathDifficulty(last.difficulty as Difficulty); setDifficulty(last.difficulty as Difficulty)
      }
    })
    getSelectedGameCount().then(saved => {
      const count = saved ?? DEFAULT_GAME_COUNT
      setMathGamesCount(count); setMemoryGamesCount(count); setTfGamesCount(count)
    })
  }, [setDifficulty, setOperation, setType])

  function hydrateSessions() {
    Promise.all([
      getMathSessionMax().then(m => setMathSessionMaxState(m)),
      getMathSessionPlayed().then(p => setMathSessionPlayedState(p)),
    ]).then(() => setMathSessionHydrated(true))
    Promise.all([
      getMemorySessionMax().then(m => setMemorySessionMaxState(m)),
      getMemorySessionPlayed().then(p => setMemorySessionPlayedState(p)),
    ]).then(() => setMemorySessionHydrated(true))
    Promise.all([
      getTrueFalseSessionMax().then(m => setTfSessionMaxState(m)),
      getTrueFalseSessionPlayed().then(p => setTfSessionPlayedState(p)),
    ]).then(() => setTfSessionHydrated(true))
  }

  useEffect(() => { hydrateSessions(); setMounted(true) }, [isSessionExpired])

  useEffect(() => {
    if (!mathDifficulty) return
    const op = MODE_TO_OPERATION[activeMode]
    getVariantProgress(op, mathDifficulty).then(p => {
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
    const onVisibility = () => { if (document.visibilityState === 'visible') hydrateSessions() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  /* ── Handlers (unchanged logic) ──────────────────────────────────── */

  async function handleReloadNewGames() {
    if (isReloadingGames) return
    setIsReloadingGames(true)
    try {
      await clearGameCache()
      await resetAllProgress()
      const now = await fetchAndCacheAllGames()
      setLastFetchAt(now)
      setMathSessionMaxState(DEFAULT_GAME_COUNT); setMathSessionPlayedState(0); setMathGamesCount(DEFAULT_GAME_COUNT)
      setMemorySessionMaxState(DEFAULT_GAME_COUNT); setMemorySessionPlayedState(0); setMemoryGamesCount(DEFAULT_GAME_COUNT)
      setMathVariantPlayed(0); setMathVariantRemaining(20)
      setMemoryVariantPlayed(0); setMemoryVariantRemaining(20)
      setTfSessionMaxState(DEFAULT_GAME_COUNT); setTfSessionPlayedState(0); setTfGamesCount(DEFAULT_GAME_COUNT)
      setTfVariantPlayed(0); setTfVariantRemaining(20)
      await setSelectedGameCount(DEFAULT_GAME_COUNT)
    } catch {
      // Even on failure, stop the spinner
    } finally {
      setIsReloadingGames(false)
    }
  }

  async function play(operationMode?: ModeLabel) {
    if (isNavigating) return
    setIsNavigating(true)
    await recordActivity()
    setType('math'); setDifficulty(mathDifficulty ?? 'medium')
    const op = operationMode ? MODE_TO_OPERATION[operationMode] : 'mixture'
    setOperation(op)
    await setLastPlayedSettings({ gameType: 'math', operation: op, difficulty: (mathDifficulty ?? 'medium') as Difficulty })
    await setSelectedGameCount(mathGamesCount)
    await resetMathSession(mathGamesCount)
    setMathSessionMaxState(mathGamesCount); setMathSessionPlayedState(0)
    router.push(`/game?op=${op}`)
  }

  async function playMemoryGrid() {
    if (isNavigating || memoryDifficulty === null) return
    setIsNavigating(true)
    await recordActivity()
    setType('memory'); setDifficulty(memoryDifficulty)
    await setLastPlayedSettings({ gameType: 'memory', operation: null, difficulty: memoryDifficulty })
    if (memoryGamesCount !== memorySessionMax) {
      await resetMemorySession(memoryGamesCount)
      setMemorySessionMaxState(memoryGamesCount); setMemorySessionPlayedState(0)
    }
    router.push('/game?mode=memory')
  }

  async function playTrueFalse() {
    if (isNavigating || tfDifficulty === null) return
    setIsNavigating(true)
    await recordActivity()
    setType('true_false'); setDifficulty(tfDifficulty)
    await setLastPlayedSettings({ gameType: 'true_false', operation: null, difficulty: tfDifficulty })
    await setSelectedGameCount(tfGamesCount)
    await resetTrueFalseSession(tfGamesCount)
    setTfSessionMaxState(tfGamesCount); setTfSessionPlayedState(0)
    router.push('/game?mode=truefalse')
  }

  function handlePlay() {
    if (isLocked || isRefreshing || isSessionExpired) return
    if (activeGame === 'math') {
      if (mathDifficulty === null || mathVariantRemaining <= 0) return
      play(activeMode)
    } else if (activeGame === 'truefalse') {
      if (tfDifficulty === null || tfVariantRemaining <= 0) return
      playTrueFalse()
    } else {
      if (memoryDifficulty === null || memoryVariantRemaining <= 0) return
      playMemoryGrid()
    }
  }

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

  const playDisabled =
    isNavigating || isLocked || isRefreshing || isSessionExpired ||
    (activeGame === 'math' && !canPlayMath) ||
    (activeGame === 'memory' && !canPlayMemory) ||
    (activeGame === 'truefalse' && !canPlayTf)

  const playLabel = isLocked
    ? 'Limit reached'
    : mounted && isSessionExpired
      ? 'Reset progress to play'
      : mounted && isRefreshing
        ? 'Reload to play'
        : (activeGame === 'math' && !canPlayMath) || (activeGame === 'memory' && !canPlayMemory) || (activeGame === 'truefalse' && !canPlayTf)
          ? 'Choose difficulty'
          : isNavigating
            ? 'Starting…'
            : `Play ${activeGame === 'math' ? 'math' : activeGame === 'truefalse' ? 'true/false' : 'memory'}`

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border-subtle)] py-5 sm:py-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Mathy</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Train your brain daily</p>
          </div>
          {isLocked && (
            <span className="text-[10px] font-mono text-amber-400">
              Limit {used}/{maxAttempts} · resets {timeToReset}
            </span>
          )}
        </div>
      </header>

      {/* ── Status banners (session expiry / reload) ────────────────── */}
      {mounted && (isSessionExpired || isRefreshing) && (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
          {isSessionExpired ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] text-amber-400">Session expired. Reset to continue.</p>
              <button
                type="button"
                onClick={async () => {
                  await resetAndResume()
                  setMathSessionMaxState(DEFAULT_GAME_COUNT); setMathSessionPlayedState(0); setMathGamesCount(DEFAULT_GAME_COUNT)
                  setMemorySessionMaxState(DEFAULT_GAME_COUNT); setMemorySessionPlayedState(0); setMemoryGamesCount(DEFAULT_GAME_COUNT)
                  setMathVariantPlayed(0); setMathVariantRemaining(20)
                  setMemoryVariantPlayed(0); setMemoryVariantRemaining(20)
                  setTfSessionMaxState(DEFAULT_GAME_COUNT); setTfSessionPlayedState(0); setTfGamesCount(DEFAULT_GAME_COUNT)
                  setTfVariantPlayed(0); setTfVariantRemaining(20)
                  await setSelectedGameCount(DEFAULT_GAME_COUNT)
                }}
                disabled={isExpiryResetting}
                className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
              >
                {isExpiryResetting ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-2.5">
              <span className="text-[11px] text-slate-400">Games expired. Reload for new questions.</span>
              <button
                type="button"
                onClick={handleReloadNewGames}
                disabled={isReloadingGames}
                className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
              >
                {isReloadingGames ? 'Loading…' : 'Reload'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Refresh countdown banner ────────────────────────────────── */}
      {mounted && (mathVariantExhausted || memoryVariantExhausted || tfVariantExhausted) && (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
          <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />
        </div>
      )}

      {/* ── Game cards ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 space-y-3">

        {/* ─── Math Game Card ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 transition-colors"
          style={{
            borderColor: activeGame === 'math' ? 'var(--accent-orange)' : 'var(--border-subtle)',
            backgroundColor: activeGame === 'math' ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveGame('math')}
        >
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={16} style={{ color: 'var(--accent-orange)' }} />
            <span className="text-sm font-semibold text-white">Math Challenge</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Solve equations. Pick an operation and difficulty, then play.
          </p>

          {/* Operation selector */}
          <div className="flex flex-wrap gap-1 mb-3">
            {([
              { symbol: '+', label: 'Addition' as ModeLabel },
              { symbol: '−', label: 'Subtraction' as ModeLabel },
              { symbol: '×', label: 'Multiplication' as ModeLabel },
              { symbol: '÷', label: 'Division' as ModeLabel },
              { symbol: 'Mix', label: 'Mixture' as ModeLabel },
              { symbol: '⚙', label: 'Custom' as ModeLabel },
            ]).map(item => {
              const active = activeMode === item.label && activeGame === 'math'
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveMode(item.label); setActiveGame('math') }}
                  className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: active ? 'var(--accent-orange-muted)' : 'rgba(39,39,42,0.5)',
                    border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    color: active ? 'var(--accent-orange)' : '#a1a1aa',
                  }}
                >
                  {item.symbol}
                </button>
              )
            })}
          </div>

          {/* Custom ops */}
          {activeMode === 'Custom' && activeGame === 'math' && (
            <div className="flex flex-wrap gap-1 mb-3">
              {CUSTOM_OP_CHOICES.map(({ label, value }) => {
                const on = customOperations.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCustomOp(value) }}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                      on
                        ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)] text-[var(--accent-orange)]'
                        : 'border-zinc-700 bg-zinc-800/50 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
              <span className="text-[9px] text-slate-600 self-center ml-1">Include</span>
            </div>
          )}

          {/* Difficulty */}
          <DifficultyPills
            value={mathDifficulty}
            onChange={(d) => { setMathDifficulty(d); setDifficulty(d); setActiveGame('math') }}
          />

          {/* Controls row: stepper */}
          {activeGame === 'math' && mathDifficulty !== null && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <GameStepper
                count={mathGamesCount}
                onDecrement={() => { if (!mathVariantExhausted) setMathGamesCount(v => Math.max(1, Math.min(v - 1, mathVariantRemaining))) }}
                onIncrement={() => { if (!mathVariantExhausted) setMathGamesCount(v => Math.min(Math.max(v + 1, 1), mathVariantRemaining)) }}
                disabled={mathVariantExhausted}
              />
              {mathSessionHydrated && (
                <ProgressLine
                  played={mathVariantPlayed} total={mathVariantTotal} remaining={mathVariantRemaining}
                  exhausted={mathVariantExhausted} refreshReady={refreshReady} refreshFormatted={refreshFormatted}
                />
              )}
            </div>
          )}
        </div>

        {/* ─── Memory Grid Card ───────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 transition-colors"
          style={{
            borderColor: activeGame === 'memory' ? 'var(--accent-orange)' : 'var(--border-subtle)',
            backgroundColor: activeGame === 'memory' ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveGame('memory')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Grid3X3 size={16} style={{ color: 'var(--accent-orange)' }} />
            <span className="text-sm font-semibold text-white">Memory Grid</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Remember highlighted blocks, then tap them in order.
          </p>

          <DifficultyPills
            value={memoryDifficulty}
            onChange={(d) => { setMemoryDifficulty(d); setActiveGame('memory') }}
            gridSizes={{ easy: '3×3', medium: '4×4', hard: '5×5' }}
          />

          {activeGame === 'memory' && memoryDifficulty !== null && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <GameStepper
                count={memoryGamesCount}
                onDecrement={() => { if (!memoryVariantExhausted) setMemoryGamesCount(v => Math.max(1, Math.min(v - 1, memoryVariantRemaining))) }}
                onIncrement={() => { if (!memoryVariantExhausted) setMemoryGamesCount(v => Math.min(Math.max(v + 1, 1), memoryVariantRemaining)) }}
                disabled={memoryVariantExhausted}
              />
              {memorySessionHydrated && (
                <ProgressLine
                  played={memoryVariantPlayed} total={memoryVariantTotal} remaining={memoryVariantRemaining}
                  exhausted={memoryVariantExhausted} refreshReady={refreshReady} refreshFormatted={refreshFormatted}
                />
              )}
            </div>
          )}
        </div>

        {/* ─── True / False Card ──────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 transition-colors"
          style={{
            borderColor: activeGame === 'truefalse' ? 'var(--accent-orange)' : 'var(--border-subtle)',
            backgroundColor: activeGame === 'truefalse' ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveGame('truefalse')}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} style={{ color: 'var(--accent-orange)' }} />
            <span className="text-sm font-semibold text-white">True / False Math</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Is the equation correct? Answer TRUE or FALSE.
          </p>

          <DifficultyPills
            value={tfDifficulty}
            onChange={(d) => { setTfDifficulty(d); setActiveGame('truefalse') }}
          />

          {activeGame === 'truefalse' && tfDifficulty !== null && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <GameStepper
                count={tfGamesCount}
                onDecrement={() => { if (!tfVariantExhausted) setTfGamesCount(v => Math.max(1, Math.min(v - 1, tfVariantRemaining))) }}
                onIncrement={() => { if (!tfVariantExhausted) setTfGamesCount(v => Math.min(Math.max(v + 1, 1), tfVariantRemaining)) }}
                disabled={tfVariantExhausted}
              />
              {tfSessionHydrated && (
                <ProgressLine
                  played={tfVariantPlayed} total={tfVariantTotal} remaining={tfVariantRemaining}
                  exhausted={tfVariantExhausted} refreshReady={refreshReady} refreshFormatted={refreshFormatted}
                />
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Floating sticky Play button ─────────────────────────────── */}
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
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 sm:py-4 flex justify-center">
            <button
              type="button"
              onClick={handlePlay}
              disabled={playDisabled}
              className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-10 py-3.5 sm:px-12 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                backgroundColor: isLocked ? 'var(--border-subtle)' : 'var(--accent-orange)',
                color: isLocked ? '#64748b' : '#111827',
                border: `1px solid ${isLocked ? 'var(--border-subtle)' : 'var(--accent-orange-hover)'}`,
                boxShadow: isLocked ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {playLabel}
              {!isLocked && !isNavigating && !isRefreshing && !isSessionExpired && canPlayActive && ' →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
