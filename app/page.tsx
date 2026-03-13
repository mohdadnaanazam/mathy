'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, X, Divide, Sparkles } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { GameType, OperationMode } from '@/types'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'
import MobileArenaFooter from '@/components/layout/MobileArenaFooter'

type ModeLabel = 'Addition' | 'Subtraction' | 'Multiplication' | 'Division' | 'Mixture'

const MODE_TO_OPERATION: Record<ModeLabel, OperationMode> = {
  Addition: 'addition',
  Subtraction: 'subtraction',
  Multiplication: 'multiplication',
  Division: 'division',
  Mixture: 'mixture',
}

export default function LandingPage() {
  const router = useRouter()
  const setType = useGameStore(s => s.setGameType)
  const setOperation = useGameStore(s => s.setOperation)
  const { timeToReset } = useAttempts()

  const [activeChallenge, setActiveChallenge] = useState<'Puzzle' | 'Math'>('Puzzle')
  const [activeMode, setActiveMode] = useState<ModeLabel>('Mixture')

  function play(type: GameType, operationMode?: ModeLabel) {
    setType(type)
    if (type === 'math' && operationMode) {
      setOperation(MODE_TO_OPERATION[operationMode])
    }
    router.push('/game')
  }

  return (
    <main className="min-h-screen overflow-x-hidden relative pb-24 pt-20 md:pt-24 bg-[var(--bg-surface)]">

      {/* Hero / intro */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Train your brain
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg">
            Quick math duels. No signup. Sharpen your skills in under a minute.
          </p>
        </div>
      </section>

      {/* DUELS SECTION (from phone UI) */}
      <section className="border-b border-[var(--border-subtle)] bg-background py-8 md:py-10">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-4 space-y-5 md:space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-label mb-1">Today's challenge</div>
              <p className="text-xs text-slate-400">
                Pick a mode and jump into a quick duel.
              </p>
            </div>
            <Link
              href="/game"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: '#111827',
                border: '1px solid var(--accent-orange-hover)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Open game &rarr;
            </Link>
          </div>

          {/* Challenge pills */}
          <div className="flex gap-2 sm:gap-3">
            {['Puzzle', 'Math'].map(label => {
              const isActive = activeChallenge === label
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActiveChallenge(label as 'Puzzle' | 'Math')
                    setActiveMode(label === 'Puzzle' ? 'Mixture' : 'Addition')
                  }}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between text-xs sm:text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 999,
                    border: isActive ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="uppercase tracking-[0.16em] text-xs"
                    style={{ color: '#f9fafb' }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      color: isActive ? 'var(--accent-orange)' : '#9ca3af',
                      fontSize: '14px',
                    }}
                  >
                    ›
                  </span>
                </button>
              )
            })}
          </div>

          {/* Icon row for duels (operation modes) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-4 mb-3 sm:mb-4">
            {[
              { icon: Plus, label: 'Addition' as ModeLabel },
              { icon: Minus, label: 'Subtraction' as ModeLabel },
              { icon: X, label: 'Multiplication' as ModeLabel },
              { icon: Divide, label: 'Division' as ModeLabel },
              { icon: Sparkles, label: 'Mixture' as ModeLabel },
            ].map(item => {
              const active = activeMode === item.label
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveMode(item.label)}
                  className="flex flex-1 flex-col items-center justify-center rounded-xl px-3 py-2.5 sm:py-3 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 12,
                    border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                  }}
                >
                  <item.icon
                    size={16}
                    strokeWidth={active ? 2.4 : 2}
                    className="mb-0.5"
                    style={{ color: active ? 'var(--accent-orange)' : '#e5e7eb' }}
                  />
                  <span className="mt-0.5 text-[9px] sm:text-[10px] font-semibold tracking-[0.08em] text-slate-300">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Duels tabs row */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="section-label">Duels</div>
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 w-full">
                {(['Addition', 'Subtraction', 'Multiplication', 'Division', 'Mixture'] as ModeLabel[]).map(mode => {
                  const active = activeMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                  onClick={() => setActiveMode(mode)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition-colors duration-200 shrink-0 ${
                        active
                          ? 'bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] border border-[rgba(249,115,22,0.4)]'
                          : 'bg-zinc-900/80 text-zinc-400 border border-transparent hover:text-zinc-300'
                      }`}
                    >
                      {mode}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Duels cards list */}
          <div className="space-y-3 md:space-y-4">
            {/* Primary duel card */}
            <div className="card px-4 py-4 sm:px-5 sm:py-5">
              <div className="mb-4 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
                <span>{activeMode}</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] text-zinc-100">
                  Just played
                </span>
              </div>
              <h3 className="mb-1 text-lg sm:text-xl font-semibold text-white">
                Sprint Duels
              </h3>
              <p className="mb-3 text-xs sm:text-sm text-slate-300">
                Race to solve the most in 1 minute.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-success)] hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => play('math', activeMode)}
              >
                Tap to enter live game &rarr;
              </button>
            </div>

            {/* Memory duel cards */}
            {[
              {
                tag: 'Addition',
                title: 'Speed Add Duels',
                body: 'Quick-fire addition battles.',
              },
              {
                tag: 'Multiplication',
                title: 'Grid Multiply Duels',
                body: 'Race on multiplication grids.',
              },
            ].map(card => (
              <div key={card.title} className="card px-4 py-4 sm:px-5 sm:py-5">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
                  {card.tag}
                </div>
                <h3 className="mb-1 text-lg sm:text-xl font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mb-3 text-xs sm:text-sm text-slate-300">
                  {card.body}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-success)] hover:opacity-90 transition-opacity cursor-pointer"
                  onClick={() => play('math', 'Mixture')}
                >
                  Tap to enter live game &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact status strip above footer */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-4">
          <div className="flex items-center gap-3 text-xs font-mono tracking-[0.16em] text-slate-300">
            <span className="uppercase text-[10px] text-slate-400">Energy</span>
            <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
              0 / 15
            </span>
            <span className="hidden text-[10px] text-slate-500 sm:inline">•</span>
            <span className="hidden text-[10px] text-slate-300 sm:inline">
              Resets in {formatTime(timeToReset)}
            </span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
            Energy online
          </div>
        </div>
      </section>

      {/* Mobile arena footer (same as game screen) */}
      <MobileArenaFooter />
    </main>
  )
}
