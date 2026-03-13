'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Brain, Puzzle, Crown } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { GameType } from '@/types'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'
import MobileArenaFooter from '@/components/layout/MobileArenaFooter'

const MODE_TO_GAME_TYPE: Record<string, GameType> = {
  Math: 'math',
  Memory: 'memory',
  Puzzle: 'memory',
  Classical: 'memory',
}

export default function LandingPage() {
  const router = useRouter()
  const setType = useGameStore(s => s.setGameType)
  const { timeToReset } = useAttempts()

  const [activeChallenge, setActiveChallenge] = useState<'Puzzle' | 'Math'>('Puzzle')
  const [activeMode, setActiveMode] = useState<'Math' | 'Memory' | 'Puzzle' | 'Classical'>('Memory')

  function play(type: GameType) {
    setType(type)
    router.push('/game')
  }

  return (
    <main className="min-h-screen overflow-x-hidden relative pb-24 pt-20 md:pt-24">

      {/* DUELS SECTION (from phone UI) */}
      <section className="border-t border-slate-800 bg-background py-8 md:py-10">
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
              className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em]"
              style={{
                backgroundColor: '#f97316',
                color: '#111827',
                border: '1px solid #ea580c',
                boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
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
                    setActiveMode(label as 'Math' | 'Memory' | 'Puzzle' | 'Classical')
                  }}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between text-xs sm:text-sm font-semibold"
                  style={{
                    backgroundColor: '#050816',
                    borderRadius: 999,
                    border: isActive ? '1px solid #f97316' : '1px solid #27272a',
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
                      color: isActive ? '#f97316' : '#9ca3af',
                      fontSize: '14px',
                    }}
                  >
                    ›
                  </span>
                </button>
              )
            })}
          </div>

          {/* Icon row for duels (play, memory, puzzle, classical) */}
          <div className="flex gap-2 sm:gap-3 pt-4 mb-3 sm:mb-4">
            {[
              { icon: Play, label: 'Math' },
              { icon: Brain, label: 'Memory' },
              { icon: Puzzle, label: 'Puzzle' },
              { icon: Crown, label: 'Classical' },
            ].map(item => {
              const active = activeMode === item.label
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setActiveMode(item.label as 'Math' | 'Memory' | 'Puzzle' | 'Classical')
                  }
                  className="flex flex-1 flex-col items-center justify-center rounded-lg px-3 py-2.5 sm:py-3"
                  style={{
                    backgroundColor: '#050816',
                    borderRadius: 12,
                    border: active ? '1px solid #22d3ee' : '1px solid #27272a',
                    boxShadow: active ? '0 0 0 1px rgba(34,211,238,0.5)' : 'none',
                  }}
                >
                  <item.icon
                    size={16}
                    strokeWidth={active ? 2.4 : 2}
                    className="mb-0.5"
                    style={{ color: active ? '#22d3ee' : '#e5e7eb' }}
                  />
                  <span className="mt-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Duels tabs row */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="section-label">Duels</div>
              <div className="flex gap-2">
                {['Math', 'Memory', 'Puzzle', 'Classical'].map(mode => {
                  const active = activeMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setActiveMode(mode as 'Math' | 'Memory' | 'Puzzle' | 'Classical')
                      }
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        active
                          ? 'bg-zinc-100 text-zinc-900'
                          : 'bg-zinc-900 text-zinc-400'
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
                <span>{activeMode === 'Memory' ? 'Memory' : 'Math'}</span>
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
                className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-emerald-300"
                onClick={() => play(MODE_TO_GAME_TYPE[activeMode])}
              >
                Tap to enter live game &rarr;
              </button>
            </div>

            {/* Memory duel cards */}
            {[
              {
                tag: 'Memory',
                title: 'Mind Snap Duels',
                body: 'Who can snap faster?',
              },
              {
                tag: 'Memory',
                title: 'Flash Anzan Duels',
                body: 'Rapid-fire mental math flashes.',
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
                  className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-emerald-300"
                  onClick={() => play('memory')}
                >
                  Tap to enter live game &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact status strip above footer */}
      <section className="border-t border-slate-900 bg-black/90">
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
