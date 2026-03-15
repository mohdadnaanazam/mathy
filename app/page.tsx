'use client'

import { useState } from 'react'
import { Plus, Minus, X, Divide, Sparkles, Settings2, Grid3X3, LayoutGrid } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { OperationMode, type Difficulty } from '@/types'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import { formatTime } from '@/lib/utils'

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
  const { formatted: gamesRefreshFormatted, hasTimer } = useGameTimer()
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')
  const [memoryDifficulty, setMemoryDifficulty] = useState<Difficulty>('medium')
  const [memoryDefault, setMemoryDefault] = useState<number>(6)
  const [memoryDifficultyTouched, setMemoryDifficultyTouched] = useState(false)
  const [mathDifficulty, setMathDifficulty] = useState<Difficulty | null>(null)
  const [activeGame, setActiveGame] = useState<'math' | 'memory'>('math')
  const [isNavigating, setIsNavigating] = useState(false)
  const showMathOperations = mathDifficulty !== null

  function play(operationMode?: ModeLabel) {
    if (isNavigating) return
    setIsNavigating(true)
    setType('math')
    setDifficulty(mathDifficulty ?? 'medium')
    const op = operationMode ? MODE_TO_OPERATION[operationMode] : 'mixture'
    setOperation(op)
    router.push(`/game?op=${op}`)
  }

  function playMemoryGrid() {
    if (isNavigating) return
    setIsNavigating(true)
    setType('memory')
    setDifficulty(memoryDifficulty)
    router.push('/game?mode=memory')
  }

  function handlePlay() {
    if (isLocked) return
    if (activeGame === 'math') play(activeMode)
    else playMemoryGrid()
  }

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

      {/* Math game section – difficulty first, then operations */}
      <section
        className={`border-b border-[var(--border-subtle)] py-5 sm:py-6 md:py-8 transition-opacity duration-200 ${activeGame !== 'math' ? 'opacity-60' : ''}`}
      >
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 space-y-4 sm:space-y-5">
          {/* 1. Choose difficulty (Easy / Medium / Hard) – default: Medium */}
          <div className="flex flex-col gap-2">
            <div className={`rounded-xl border p-3 transition-colors ${activeGame === 'math' ? 'border-[var(--border-subtle)]' : 'border-[var(--border-subtle)]'}`}>
              <div className="section-label mb-0.5 text-xs">Choose difficulty</div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Pick Easy, Medium, or Hard. Then choose an operation below.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                const active = mathDifficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setMathDifficulty(d); setDifficulty(d); setActiveGame('math') }}
                    className="flex flex-col items-center justify-center rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-200 capitalize"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                      color: active ? 'var(--accent-orange)' : '#e5e7eb',
                    }}
                  >
                    <span className="text-xs sm:text-sm font-semibold tracking-[0.06em]">{d}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Operation icons – only visible after user has chosen Easy / Medium / Hard */}
          {showMathOperations && (
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
          )}

          {/* Custom: choose which operations to include */}
          {showMathOperations && activeMode === 'Custom' && (
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

          {/* Difficulty options – clicking sets active game to memory */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = memoryDifficulty === d
              const gridSize = d === 'easy' ? '3×3' : d === 'medium' ? '4×4' : '5×5'
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setMemoryDifficulty(d); setMemoryDifficultyTouched(true); setActiveGame('memory') }}
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

          {/* Default value control – only visible after user picks a difficulty */}
          {memoryDifficultyTouched && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex flex-col">
                <span className="section-label text-xs mb-0.5">Default value</span>
                <span className="text-[11px] sm:text-xs text-slate-400">
                  Starts at 6. Tap − or + to adjust.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMemoryDefault(v => Math.max(1, v - 1))}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200"
                >
                  −
                </button>
                <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
                  {memoryDefault}
                </div>
                <button
                  type="button"
                  onClick={() => setMemoryDefault(v => Math.min(12, v + 1))}
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
          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
            Plays this hour: <span className="text-white font-semibold tabular-nums">{used} / {maxAttempts}</span>
          </div>
          <button
            type="button"
            onClick={handlePlay}
            disabled={isNavigating || isLocked}
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
              : isNavigating
                ? 'Starting…'
                : `Play ${activeGame === 'math' ? 'math' : 'memory'} game`}
            {!isLocked && !isNavigating && ' →'}
          </button>
        </div>
      </section>

      {/* Refresh timing only – no duplicate; formatted already includes "Games refresh in" when hasTimer */}
      <section
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-3 py-3 sm:px-6 sm:py-4">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.14em] text-slate-400">
            {hasTimer && gamesRefreshFormatted
              ? gamesRefreshFormatted
              : `Plays reset in ${formatTime(timeToReset)}`}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-slate-500">
            (15 plays per hour max)
          </span>
        </div>
      </section>
    </main>
  )
}
