'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { GameType } from '@/types'
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

  const [activeChallenge, setActiveChallenge] = useState<'Puzzle' | 'Math'>('Puzzle')
  const [activeMode, setActiveMode] = useState<'Math' | 'Memory' | 'Puzzle' | 'Classical'>('Memory')

  function play(type: GameType) {
    setType(type)
    router.push('/game')
  }

  return (
    <main className="min-h-screen overflow-x-hidden relative pb-80">

      {/* DUELS SECTION (from phone UI) */}
      <section className="border-t border-slate-800 bg-background py-10">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-label mb-1">/ Today's challenge</div>
              <p className="text-xs text-slate-400">
                Pick a mode and jump into a quick duel.
              </p>
            </div>
            <Link
              href="/game"
              className="text-xs font-mono uppercase tracking-[0.18em] text-slate-300"
            >
              Open game &rarr;
            </Link>
          </div>

          {/* Challenge pills */}
          <div className="flex gap-3">
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
                  className="flex-1 px-4 py-3 flex items-center justify-between text-sm font-semibold"
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
          <div className="flex gap-3 pt-4">
            {[
              { icon: '▶', label: 'Math' },
              { icon: '🧠', label: 'Memory' },
              { icon: '▦', label: 'Puzzle' },
              { icon: '♛', label: 'Classical' },
            ].map(item => {
              const active = activeMode === item.label
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setActiveMode(item.label as 'Math' | 'Memory' | 'Puzzle' | 'Classical')
                  }
                  className="flex flex-1 flex-col items-center justify-center rounded-lg px-3 py-3"
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: 14,
                    border: active ? '1px solid #22d3ee' : '1px solid #27272a',
                    boxShadow: active ? '0 0 0 1px rgba(34,211,238,0.5)' : 'none',
                  }}
                >
                  <span
                    className="text-lg"
                    style={{ color: active ? '#22d3ee' : '#e5e7eb' }}
                  >
                    {item.icon}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Duels tabs row */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="section-label">/ Duels</div>
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
          <div className="space-y-4">
            {/* Primary duel card */}
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
                <span>{activeMode === 'Memory' ? 'Memory' : 'Math'}</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] text-zinc-100">
                  Just played
                </span>
              </div>
              <h3 className="mb-1 text-xl font-semibold text-white">
                Sprint Duels
              </h3>
              <p className="mb-3 text-sm text-slate-300">
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
              <div key={card.title} className="card p-5">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
                  {card.tag}
                </div>
                <h3 className="mb-1 text-xl font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mb-3 text-sm text-slate-300">
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

      {/* Mobile arena footer (same as game screen) */}
      <MobileArenaFooter />
    </main>
  )
}
