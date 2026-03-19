'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Radical, PieChart, Percent, Variable, Zap, LayoutGrid, BookOpen } from 'lucide-react'
import type { Difficulty } from '@/types'
import { useGameStore } from '@/store/gameStore'
import {
  setLastPlayedSettings,
  setSelectedGameCount,
  resetGenericSession,
  getVariantProgress,
} from '@/lib/db'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import DifficultyPills from '@/components/home/DifficultyPills'
import GameStepper from '@/components/home/GameStepper'
import ProgressLine from '@/components/home/ProgressLine'

interface MoreGameDef {
  id: string
  title: string
  desc: string
  icon: typeof Radical
  operation: string
}

const MORE_GAMES: MoreGameDef[] = [
  { id: 'square_root',  title: 'Square Root',  desc: 'Estimate and solve square roots.',       icon: Radical,     operation: 'square_root' },
  { id: 'fractions',    title: 'Fractions',     desc: 'Add, subtract and compare fractions.',   icon: PieChart,    operation: 'fractions' },
  { id: 'percentage',   title: 'Percentages',   desc: 'Calculate real-world percentages.',      icon: Percent,     operation: 'percentage' },
  { id: 'algebra',      title: 'Algebra',       desc: 'Solve for x in simple equations.',       icon: Variable,    operation: 'algebra' },
  { id: 'speed_math',   title: 'Speed Math',    desc: 'Rapid-fire chain calculations.',         icon: Zap,         operation: 'speed_math' },
  { id: 'logic_puzzle', title: 'Logic Grid',    desc: 'Find the next number in the sequence.',  icon: LayoutGrid,  operation: 'logic_puzzle' },
  { id: 'ssc_cgl',     title: 'SSC CGL Math',  desc: 'Practice previous year SSC questions.',  icon: BookOpen,    operation: 'ssc_cgl' },
]

const DEFAULT_COUNT = 5

export default function MoreGamesPage() {
  const router = useRouter()
  const setStoreDifficulty = useGameStore(s => s.setDifficulty)
  const { recordActivity } = useSessionExpiry()
  const { formatted: refreshFormatted, isReady: refreshReady } = useRefreshCountdown()

  const [selected, setSelected] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [gamesCount, setGamesCount] = useState(DEFAULT_COUNT)
  const [isNavigating, setIsNavigating] = useState(false)

  const [variantPlayed, setVariantPlayed] = useState(0)
  const [variantTotal, setVariantTotal] = useState(20)
  const [variantRemaining, setVariantRemaining] = useState(20)

  const game = MORE_GAMES.find(g => g.id === selected)
  const variantExhausted = variantRemaining <= 0

  // Load variant progress when game or difficulty changes
  useEffect(() => {
    if (!selected || !difficulty) return
    getVariantProgress(selected, difficulty).then(p => {
      setVariantPlayed(p.played)
      setVariantTotal(p.total)
      setVariantRemaining(p.remaining)
      setGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [selected, difficulty])

  const handleSelect = (id: string) => {
    setSelected(selected === id ? null : id)
    setGamesCount(DEFAULT_COUNT)
  }

  const handlePlay = useCallback(async () => {
    if (!game || !difficulty || isNavigating || variantExhausted || gamesCount <= 0) return
    setIsNavigating(true)
    try {
      setStoreDifficulty(difficulty)
      await Promise.all([
        recordActivity(),
        setLastPlayedSettings({ gameType: game.id, operation: game.operation, difficulty }),
        setSelectedGameCount(gamesCount),
        resetGenericSession(game.id, gamesCount),
      ])
      router.push(`/game?mode=more&type=${game.operation}`)
    } catch {
      setIsNavigating(false)
    }
  }, [game, difficulty, isNavigating, variantExhausted, gamesCount, setStoreDifficulty, recordActivity, router])

  const canPlay = game && difficulty && !variantExhausted && gamesCount > 0

  return (
    <main
      className="min-h-screen bg-[var(--bg-surface)] overflow-x-hidden"
      style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))' }}
    >
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-4 sm:py-5">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 flex items-center gap-3">
          <button type="button" onClick={() => router.push('/')}
            className="p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            aria-label="Back to home">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">More Games</h1>
            <p className="text-[11px] text-slate-500">Pick a game, choose difficulty, and play</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 space-y-4">
        {/* Global difficulty selector */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Difficulty</p>
          <DifficultyPills value={difficulty} onChange={d => { setDifficulty(d); setGamesCount(DEFAULT_COUNT) }} />
        </div>

        {/* Game list */}
        <div className="space-y-2">
          {MORE_GAMES.map(({ id, title, desc, icon: Icon }) => {
            const active = selected === id
            return (
              <div
                key={id}
                className="rounded-2xl border p-4 transition-colors cursor-pointer"
                style={{
                  borderColor: active ? 'var(--accent-orange)' : 'var(--border-subtle)',
                  backgroundColor: active ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
                }}
                onClick={() => handleSelect(id)}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon size={16} style={{ color: active ? 'var(--accent-orange)' : '#71717a' }} />
                  <span className="text-sm font-semibold text-white">{title}</span>
                </div>
                <p className="text-[11px] text-slate-500">{desc}</p>

                {/* Stepper + progress — only when this card is selected AND difficulty is chosen */}
                {active && difficulty !== null && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]" onClick={e => e.stopPropagation()}>
                    <GameStepper
                      count={gamesCount}
                      onDecrement={() => { if (!variantExhausted) setGamesCount(v => Math.max(1, Math.min(v - 1, variantRemaining))) }}
                      onIncrement={() => { if (!variantExhausted) setGamesCount(v => Math.min(Math.max(v + 1, 1), variantRemaining)) }}
                      disabled={variantExhausted}
                    />
                    <ProgressLine
                      played={variantPlayed}
                      total={variantTotal}
                      remaining={variantRemaining}
                      exhausted={variantExhausted}
                      refreshReady={refreshReady}
                      refreshFormatted={refreshFormatted}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
              disabled={!canPlay || isNavigating}
              onClick={handlePlay}
              className="w-full rounded-2xl px-8 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-40"
              style={{
                background: canPlay
                  ? 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)'
                  : 'rgba(39,39,42,0.55)',
                color: canPlay ? '#111827' : '#71717a',
                border: canPlay
                  ? '1px solid rgba(249,115,22,0.5)'
                  : '1px solid rgba(63,63,70,0.4)',
                boxShadow: canPlay
                  ? '0 8px 32px rgba(249,115,22,0.35), 0 2px 12px rgba(249,115,22,0.2)'
                  : 'none',
              }}
            >
              {isNavigating ? 'Starting…' : canPlay ? `Play ${game!.title}` : variantExhausted ? 'All played — wait for refresh' : 'Select a game'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
