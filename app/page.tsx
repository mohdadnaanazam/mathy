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
  const { timeToReset } = useAttempts()
  const { formatted: gamesRefreshFormatted, hasTimer } = useGameTimer()
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')
  const [memoryDifficulty, setMemoryDifficulty] = useState<Difficulty>('medium')

  function play(operationMode?: ModeLabel) {
    setType('math')
    if (operationMode) setOperation(MODE_TO_OPERATION[operationMode])
    router.push('/game')
  }

  function playMemoryGrid() {
    setType('memory')
    setDifficulty(memoryDifficulty)
    router.push('/game?mode=memory')
  }

  return (
    <main className="min-h-screen overflow-x-hidden relative pb-20 pt-16 sm:pt-20 md:pt-24 bg-[var(--bg-surface)]">
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

      {/* Pick mode + Play */}
      <section className="border-b border-[var(--border-subtle)] py-5 sm:py-6 md:py-8">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="section-label mb-0.5 text-xs">Choose operation</div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Addition, subtraction, multiplication, division, mixture, or custom.
              </p>
            </div>
            <button
              type="button"
              onClick={() => play(activeMode)}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: '#111827',
                border: '1px solid var(--accent-orange-hover)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Play game &rarr;
            </button>
          </div>

          {/* Operation icons */}
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
                  onClick={() => setActiveMode(item.label)}
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
                      onClick={() => toggleCustomOp(value)}
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

      {/* Memory Grid Game - same layout as math: label + Play on top row, then option grid */}
      <section className="border-b border-[var(--border-subtle)] py-5 sm:py-6 md:py-8">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="section-label mb-0.5 text-xs flex items-center gap-1.5">
                <Grid3X3 size={14} style={{ color: 'var(--accent-orange)' }} />
                Memory Grid Game
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Remember the highlighted blocks, then tap them in order. Grid size depends on difficulty.
              </p>
            </div>
            <button
              type="button"
              onClick={playMemoryGrid}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: '#111827',
                border: '1px solid var(--accent-orange-hover)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Play game &rarr;
            </button>
          </div>

          {/* Difficulty options - same card style as math operation buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = memoryDifficulty === d
              const gridSize = d === 'easy' ? '3×3' : d === 'medium' ? '4×4' : '5×5'
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMemoryDifficulty(d)}
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
        </div>
      </section>

      {/* Refresh timing only (energy/plays removed) */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-3 py-2.5 sm:px-6 lg:px-4">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.14em] text-slate-400">
            {hasTimer && gamesRefreshFormatted
              ? `Games refresh in ${gamesRefreshFormatted}`
              : `Plays reset in ${formatTime(timeToReset)}`}
          </span>
        </div>
      </section>
    </main>
  )
}
