'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import {
  getMemorySessionMax,
  getMemorySessionPlayed,
  incrementMemorySessionPlayed,
  addToVariantPlayed,
  getVariantProgress,
  resetMemorySession,
} from '@/lib/db'
import Timer from './Timer'
import type { Difficulty } from '@/types'

const GRID_SIZE: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
}

const HIGHLIGHT_DURATION_MS = 2500
const WRONG_PENALTY = 0

type Phase = 'highlight' | 'recall' | 'result'

export default function MemoryGridGame() {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)

  const size = GRID_SIZE[difficulty]
  const total = size * size

  const [sessionMax, setSessionMax] = useState(10)
  const [roundIndex, setRoundIndex] = useState(0) // 1-based round counter
  const [phase, setPhase] = useState<Phase>('highlight')
  const [pattern, setPattern] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [roundScore, setRoundScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(5)

  const pointsPerCorrect = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 50

  useEffect(() => {
    getMemorySessionMax().then(setSessionMax)
  }, [])

  const cells = useMemo(() => Array.from({ length: total }, (_, i) => i), [total])

  const generatePattern = useCallback(() => {
    const count = Math.max(2, Math.ceil(total * 0.35))
    const shuffled = [...cells].sort(() => Math.random() - 0.5)
    setPattern(shuffled.slice(0, count))
  }, [cells, total])

  const startRound = useCallback(() => {
    if (sessionComplete) return
    setRoundIndex(prev => prev + 1)
    setPhase('highlight')
    setSelected([])
    setRoundScore(0)
    setGameOver(false)
    generatePattern()
  }, [generatePattern, sessionComplete])

  useEffect(() => {
    if (phase !== 'highlight' || pattern.length === 0) return
    const t = setTimeout(() => {
      setPhase('recall')
    }, HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(t)
  }, [phase, pattern.length])

  const handleCellClick = useCallback(
    (index: number) => {
      if (phase !== 'recall' || gameOver) return
      if (selected.includes(index)) return

      const next = [...selected, index]
      setSelected(next)

      if (pattern.includes(index)) {
        const points = pointsPerCorrect
        setRoundScore(s => s + points)
        addScore(points)
        if (next.length === pattern.length) {
          setGameOver(true)
          getMemorySessionPlayed().then(played => {
            if (played < sessionMax) {
              incrementMemorySessionPlayed().then(next => {
                // Track per-difficulty cumulative progress for memory game
                addToVariantPlayed('memory', difficulty, 1)
                if (next >= sessionMax) {
                  setSessionComplete(true)
                }
              })
            } else {
              setSessionComplete(true)
            }
          })
          setTimeout(() => syncNow(), 300)
        }
      } else {
        if (WRONG_PENALTY > 0) addScore(-WRONG_PENALTY)
        setGameOver(true)
        getMemorySessionPlayed().then(played => {
          if (played < sessionMax) {
            incrementMemorySessionPlayed().then(next => {
              addToVariantPlayed('memory', difficulty, 1)
              if (next >= sessionMax) {
                setSessionComplete(true)
              }
            })
          } else {
            setSessionComplete(true)
          }
        })
        setTimeout(() => syncNow(), 300)
      }
    },
    [phase, gameOver, selected, pattern, addScore, syncNow, sessionMax, pointsPerCorrect],
  )

  const handleTimeUp = useCallback(() => {
    recordHourlyAttempt()
    syncNow()
    setPhase('result')
  }, [recordHourlyAttempt, syncNow])

  // When difficulty changes and we're not on the session-complete panel, reset and start a new session.
  // When on the panel, changing difficulty only updates the panel (remaining count); do not start a round.
  useEffect(() => {
    if (sessionComplete) return
    setRoundIndex(0)
    setSessionComplete(false)
    const t = setTimeout(() => startRound(), 0)
    return () => clearTimeout(t)
  }, [difficulty, sessionComplete])

  // Load per-difficulty progress for the Session Complete panel (remaining games).
  useEffect(() => {
    if (!sessionComplete || !difficulty) return
    getVariantProgress('memory', difficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev =>
        p.remaining <= 0 ? 0 : Math.min(Math.max(prev || 5, 1), p.remaining),
      )
    })
  }, [sessionComplete, difficulty])

  const currentRoundDisplay = Math.min(Math.max(roundIndex || 1, 1), sessionMax || 1)
  const nextVariantExhausted = nextVariantRemaining <= 0

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-[0.16em]">Loading…</p>
      </div>
    )
  }

  const isHighlighted = (index: number) => phase === 'highlight' && pattern.includes(index)
  const isSelected = (index: number) => selected.includes(index)
  const isCorrect = (index: number) => pattern.includes(index)
  const showAsWrong = (index: number) => gameOver && selected.includes(index) && !pattern.includes(index)

  if (sessionComplete) {
    return (
      <div className="w-full max-w-full flex flex-col items-center mx-auto px-0 py-2 sm:px-2 sm:py-4 gap-3 sm:gap-5">
        <div className="api-game-item w-full flex items-center gap-2 mb-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
            Memory Grid Game
          </span>
        </div>

        <div className="api-game-item w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-4 sm:px-4 sm:py-5 space-y-4">
          <div className="text-center space-y-2">
            <p className="section-label text-xs text-slate-400">
              Session complete
            </p>
            <p className="text-sm sm:text-base text-slate-200">
              You finished this set of rounds for Memory Grid.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Choose your next difficulty and number of games, or go back to the home screen.
            </p>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-1.5">
            <p className="section-label text-[11px] text-slate-400">
              Choose difficulty
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                const active = difficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 text-[11px] sm:text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of games: show remaining for current difficulty, clamp stepper */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex flex-col">
              <span className="section-label text-xs mb-0.5">Number of games</span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Max 20 per difficulty. Tap − or + to adjust.
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
              </span>
              {nextVariantExhausted && (
                <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">
                  You finished Memory Grid ({difficulty}). Try{' '}
                  {difficulty === 'easy'
                    ? 'Medium or Hard'
                    : difficulty === 'medium'
                      ? 'Hard'
                      : 'another game'}
                  .
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (nextVariantExhausted) return
                  setNextGamesCount(v => Math.max(1, Math.min(v - 1, nextVariantRemaining)))
                }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                disabled={nextVariantExhausted}
              >
                −
              </button>
              <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
                {nextGamesCount}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (nextVariantExhausted) return
                  setNextGamesCount(v =>
                    Math.min(Math.max(v + 1, 1), nextVariantRemaining),
                  )
                }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                disabled={nextVariantExhausted}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              disabled={nextVariantExhausted || nextGamesCount <= 0}
              onClick={async () => {
                if (nextVariantExhausted || nextGamesCount <= 0) return
                await resetMemorySession(nextGamesCount)
                setSessionComplete(false)
                setRoundIndex(0)
                setTimeout(() => startRound(), 0)
              }}
              className="rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-5 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 disabled:opacity-60"
            >
              Play game
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full flex flex-col items-center mx-auto px-0 py-1 sm:px-2 sm:py-3 gap-2 sm:gap-4">
      {/* Section title: Memory Grid Game (matches Math Game label) */}
      <div className="api-game-item w-full flex items-center gap-2 mb-0.5">
        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Memory Grid Game
        </span>
      </div>

      <div className="api-game-item w-full flex items-center justify-between flex-wrap gap-1.5 mb-1">
        <Timer key={timerKey} seconds={60} onTimeUp={handleTimeUp} type="memory" />
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="section-label text-slate-400 text-xs">
            Round {currentRoundDisplay} / {sessionMax} · {roundScore} pts
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white">
            Total: {score}
          </span>
        </div>
      </div>

      <p className="section-label mb-2 sm:mb-3 text-slate-400 text-xs">
        {phase === 'highlight'
          ? 'Remember the blocks…'
          : phase === 'recall'
            ? 'Click the blocks you saw'
            : gameOver
              ? (selected.length === pattern.length && selected.every(i => pattern.includes(i))
                  ? 'Correct!'
                  : 'Wrong block — round over')
              : ''}
      </p>

      <div
        className="api-game-item grid gap-1 sm:gap-1.5 w-full max-w-[280px] sm:max-w-[360px]"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          aspectRatio: '1',
        }}
      >
        <AnimatePresence mode="sync">
          {cells.map(index => (
            <motion.button
              key={index}
              type="button"
              initial={false}
              animate={{
                scale: 1,
                opacity: 1,
                backgroundColor: showAsWrong(index)
                  ? 'rgba(239, 68, 68, 0.4)'
                  : isHighlighted(index)
                    ? 'var(--accent-orange)'
                    : isSelected(index) && isCorrect(index)
                      ? 'rgba(34, 197, 94, 0.5)'
                      : 'rgba(39, 39, 42, 0.9)',
                borderColor: isHighlighted(index)
                  ? 'var(--accent-orange)'
                  : showAsWrong(index)
                    ? '#ef4444'
                    : 'rgba(63, 63, 70, 0.8)',
              }}
              transition={{ duration: 0.25 }}
              className="rounded-lg sm:rounded-xl border-2 min-h-[40px] sm:min-h-0 aspect-square touch-manipulative"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              onClick={() => handleCellClick(index)}
              disabled={phase !== 'recall' || gameOver}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="api-game-item w-full flex justify-center pt-0.5">
        <button
          type="button"
          onClick={() => {
            setTimerKey(k => k + 1)
            startRound()
          }}
          className="rounded-full px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all min-h-[40px] sm:min-h-[44px] touch-manipulative"
          style={{
            background: 'var(--accent-orange)',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
          }}
        >
          Next round →
        </button>
      </div>
    </div>
  )
}
