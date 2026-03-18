'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Radical, PieChart, Percent, Variable, Zap, Puzzle, LayoutGrid } from 'lucide-react'
import type { Difficulty } from '@/types'
import { useGameStore } from '@/store/gameStore'
import {
  setLastPlayedSettings,
  setSelectedGameCount,
  resetGenericSession,
} from '@/lib/db'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import DifficultyPills from '@/components/home/DifficultyPills'

interface MoreGameDef {
  id: string
  title: string
  desc: string
  icon: typeof Radical
  /** Maps to the backend game_type / operation used in useGameLoader */
  operation: string
}

const MORE_GAMES: MoreGameDef[] = [
  { id: 'square_root',  title: 'Square Root',  desc: 'Estimate and solve square roots.',       icon: Radical,    operation: 'square_root' },
  { id: 'fractions',    title: 'Fractions',     desc: 'Add, subtract and compare fractions.',   icon: PieChart,   operation: 'fractions' },
  { id: 'percentage',   title: 'Percentages',   desc: 'Calculate real-world percentages.',      icon: Percent,    operation: 'percentage' },
  { id: 'algebra',      title: 'Algebra',       desc: 'Solve for x in simple equations.',       icon: Variable,   operation: 'algebra' },
  { id: 'speed_math',   title: 'Speed Math',    desc: 'Rapid-fire chain calculations.',         icon: Zap,        operation: 'speed_math' },
  { id: 'logic_puzzle', title: 'Logic Grid',    desc: 'Find the next number in the sequence.',  icon: LayoutGrid,  operation: 'logic_puzzle' },
]

const DEFAULT_COUNT = 5

export default function MoreGamesPage() {
  const router = useRouter()
  const setStoreDifficulty = useGameStore(s => s.setDifficulty)
  const { recordActivity } = useSessionExpiry()

  const [selected, setSelected] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const game = MORE_GAMES.find(g => g.id === selected)

  const handlePlay = useCallback(async () => {
    if (!game || !difficulty || isNavigating) return
    setIsNavigating(true)
    try {
      setStoreDifficulty(difficulty)
      await Promise.all([
        recordActivity(),
        setLastPlayedSettings({ gameType: game.id, operation: game.operation, difficulty }),
        setSelectedGameCount(DEFAULT_COUNT),
        resetGenericSession(game.id, DEFAULT_COUNT),
      ])
      router.push(`/game?mode=more&type=${game.operation}`)
    } catch {
      setIsNavigating(false)
    }
  }, [game, difficulty, isNavigating, setStoreDifficulty, recordActivity, router])

  return (
    <main
      className="min-h-screen bg-[var(--bg-surface)] overflow-x-hidden"
      style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))' }}
    >
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-4 sm:py-5">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">More Games</h1>
            <p className="text-[11px] text-slate-500">Pick a game, choose difficulty, and play</p>
          </div>
        </div>
      </header>

      {/* Game list */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 space-y-2">
        {MORE_GAMES.map(({ id, title, desc, icon: Icon }) => {
          const active = selected === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setSelected(active ? null : id); if (!active) setDifficulty(null) }}
              className="w-full rounded-2xl border p-4 text-left transition-colors"
              style={{
                borderColor: active ? 'var(--accent-orange)' : 'var(--border-subtle)',
                backgroundColor: active ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
              }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Icon size={15} style={{ color: active ? 'var(--accent-orange)' : '#71717a' }} />
                <span className="text-sm font-semibold text-white">{title}</span>
              </div>
              <p className="text-[11px] text-slate-500">{desc}</p>

              {/* Difficulty selector — shown when card is selected */}
              {active && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]" onClick={e => e.stopPropagation()}>
                  <DifficultyPills value={difficulty} onChange={setDifficulty} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Play button — fixed at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="pointer-events-auto w-full"
          style={{
            background: 'linear-gradient(to top, var(--bg-surface) 60%, transparent)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            paddingTop: '20px',
          }}
        >
          <div className="mx-auto w-full max-w-md px-5 sm:px-6 pb-4 sm:pb-5 flex justify-center">
            <button
              type="button"
              disabled={!game || !difficulty || isNavigating}
              onClick={handlePlay}
              className="w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-40"
              style={{
                background: game && difficulty
                  ? 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)'
                  : 'rgba(39,39,42,0.55)',
                color: game && difficulty ? '#111827' : '#71717a',
                border: game && difficulty
                  ? '1px solid rgba(249,115,22,0.5)'
                  : '1px solid rgba(63,63,70,0.4)',
                boxShadow: game && difficulty
                  ? '0 8px 32px rgba(249,115,22,0.35), 0 2px 12px rgba(249,115,22,0.2)'
                  : 'none',
              }}
            >
              {isNavigating ? 'Starting…' : game && difficulty ? `Play ${game.title}` : 'Select a game'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
