'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  getVariantProgress,
  resetMemorySession,
  getSelectedGameCount,
  setSelectedGameCount,
  setLastPlayedSettings,
  incrementVariantPlayed,
} from '@/lib/db'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import RefreshBanner from '@/components/ui/RefreshBanner'
import ShareScoreButton from './ShareScoreButton'
import Timer from './Timer'
import type { Difficulty } from '@/types'
import { difficultyLabel } from '@/lib/gameProgression'

const GRID_SIZE: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
}

const HIGHLIGHT_DURATION_MS = 2500
const AUTO_ADVANCE_CORRECT_MS = 1800
const AUTO_ADVANCE_WRONG_MS = 2200

const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 50,
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

type Phase = 'highlight' | 'recall' | 'result'

export default function MemoryGridGame() {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)

  // Keep a ref so async callbacks never read stale difficulty
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  const size = GRID_SIZE[difficulty]
  const total = size * size

  const [sessionMax, setSessionMax] = useState(5)
  const [roundIndex, setRoundIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('highlight')
  const [pattern, setPattern] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [roundScore, setRoundScore] = useState(0)
  const [roundResult, setRoundResult] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(5)
  // Track whether we've hydrated the game count from IndexedDB so we don't
  // let the progression effect overwrite it with a clamped default.
  const gameCountHydrated = useRef(false)

  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty] ?? 10
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  // --- Hydration effects ---
  useEffect(() => {
    getMemorySessionMax().then(max => {
      setSessionMax(max)
      // Seed nextGamesCount from the session max the user actually played with,
      // so it doesn't reset to 5 on session complete.
      if (!gameCountHydrated.current) {
        setNextGamesCount(max)
      }
    })
  }, [])

  // Hydrate nextGamesCount from persisted selection on mount (overrides sessionMax seed)
  useEffect(() => {
    getSelectedGameCount().then(saved => {
      if (saved != null && saved > 0) {
        setNextGamesCount(saved)
        gameCountHydrated.current = true
      }
    })
  }, [])

  const cells = useMemo(() => Array.from({ length: total }, (_, i) => i), [total])

  const generatePattern = useCallback(() => {
    const count = Math.max(2, Math.ceil(total * 0.35))
    const shuffled = [...cells].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }, [cells, total])

  const startRound = useCallback(() => {
    if (sessionComplete) return
    setRoundIndex(prev => prev + 1)
    setPhase('highlight')
    setSelected([])
    setRoundScore(0)
    setRoundResult(null)
    setPattern(generatePattern())
  }, [generatePattern, sessionComplete])

  // Auto-transition from highlight → recall
  useEffect(() => {
    if (phase !== 'highlight' || pattern.length === 0) return
    const t = setTimeout(() => setPhase('recall'), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(t)
  }, [phase, pattern.length])

  // --- Round completion handler (shared by correct & wrong) ---
  // Sets roundResult for feedback, does DB bookkeeping, then schedules
  // the next round (or session complete) after a visible delay.
  const finishRound = useCallback(
    async (wasCorrect: boolean) => {
      const currentDiff = difficultyRef.current as Difficulty

      // Record attempt
      recordHourlyAttempt()

      // Increment per-variant progress (1 question at a time, like math game)
      await incrementVariantPlayed('memory', currentDiff)

      // Increment session played
      const played = await getMemorySessionPlayed()
      if (played < sessionMax) {
        const next = await incrementMemorySessionPlayed()
        if (next >= sessionMax) {
          // Show feedback for a moment, then transition to session complete
          const delay = wasCorrect ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_WRONG_MS
          setTimeout(() => setSessionComplete(true), delay)
        } else {
          // Show feedback, then auto-advance to next round
          const delay = wasCorrect ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_WRONG_MS
          setTimeout(() => {
            setTimerKey(k => k + 1)
            startRound()
          }, delay)
        }
      } else {
        const delay = wasCorrect ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_WRONG_MS
        setTimeout(() => setSessionComplete(true), delay)
      }

      setTimeout(() => syncNow(), 300)
    },
    [sessionMax, recordHourlyAttempt, syncNow, startRound],
  )

  // --- Cell click handler ---
  const handleCellClick = useCallback(
    (index: number) => {
      if (phase !== 'recall' || roundResult !== null) return
      if (selected.includes(index)) return

      const next = [...selected, index]
      setSelected(next)

      if (pattern.includes(index)) {
        // Correct click
        const points = pointsPerCorrect
        setRoundScore(s => s + points)
        addScore(points)

        if (next.length === pattern.length) {
          // All correct blocks found
          setRoundResult('correct')
          setPhase('result')
          finishRound(true)
        }
      } else {
        // Wrong click
        setRoundResult('wrong')
        setPhase('result')
        finishRound(false)
      }
    },
    [phase, roundResult, selected, pattern, addScore, pointsPerCorrect, finishRound],
  )

  const handleTimeUp = useCallback(() => {
    if (roundResult !== null) return
    setRoundResult('wrong')
    setPhase('result')
    finishRound(false)
  }, [roundResult, finishRound])

  // When difficulty changes and we're not on the session-complete panel, reset and start a new round.
  // Use a ref to track whether we've already initialized to avoid double-starts.
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (sessionComplete) return

    // On mount or difficulty change, start a fresh round synchronously.
    // No setTimeout — the pattern must exist before the first paint so
    // the highlight phase is visible immediately.
    hasInitialized.current = true
    setRoundIndex(0)
    setSessionComplete(false)
    // Call startRound inline (can't call the callback because it checks
    // sessionComplete from its closure which may be stale). Replicate
    // the logic directly so the pattern is set in the same batch.
    setRoundIndex(1)
    setPhase('highlight')
    setSelected([])
    setRoundScore(0)
    setRoundResult(null)
    setPattern(generatePattern())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, sessionComplete])

  // Load per-difficulty progress for the Session Complete panel when user manually changes difficulty.
  useEffect(() => {
    if (!sessionComplete || !difficulty) return
    getVariantProgress('memory', difficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [sessionComplete, difficulty])

  // When session completes, auto-advance to next difficulty in sequence
  useEffect(() => {
    if (!sessionComplete) return
    const currentDiff = difficultyRef.current as Difficulty
    if (!currentDiff) return

    const diffIdx = DIFFICULTY_ORDER.indexOf(currentDiff)
    const nextIdx = diffIdx === -1 ? 0 : (diffIdx + 1) % DIFFICULTY_ORDER.length
    const newDiff = DIFFICULTY_ORDER[nextIdx]
    setDifficulty(newDiff)
    getVariantProgress('memory', newDiff).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [sessionComplete])

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
  const showAsWrong = (index: number) => roundResult === 'wrong' && selected.includes(index) && !pattern.includes(index)
  // On result phase, reveal the correct pattern so user can learn
  const showMissed = (index: number) => phase === 'result' && pattern.includes(index) && !selected.includes(index)

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
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">
              Next up: {difficultyLabel(difficulty as Difficulty)}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Or choose a different difficulty below.
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
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      color: active ? 'var(--accent-orange)' : '#d1d5db',
                    }}
                  >
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of games */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex flex-col">
              <span className="section-label text-xs mb-0.5">Number of games</span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Max 20 per difficulty. Tap − or + to adjust.
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
              </span>
              {nextVariantExhausted && (() => {
                const urgent = !refreshReady && /^(\d+)m/.test(refreshFormatted) && parseInt(refreshFormatted.match(/^(\d+)m/)![1], 10) < 2
                return (
                  <span
                    className={`text-[10px] font-mono inline-flex items-center gap-1 mt-0.5 ${urgent ? 'progress-urgent' : ''}`}
                    style={{ color: refreshReady ? '#22c55e' : urgent ? '#f87171' : '#fbbf24' }}
                  >
                    {refreshReady ? '🎉 New games available! Go home and tap Reload.' : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0" style={{ opacity: 0.8 }}>
                          <circle cx="8" cy="8" r="6.5" />
                          <path d="M8 4.5V8l2.5 1.5" />
                        </svg>
                        Next games unlock in {refreshFormatted}
                      </>
                    )}
                  </span>
                )
              })()}
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

          {/* Refresh countdown banner */}
          {nextVariantExhausted && (
            <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              disabled={nextVariantExhausted || nextGamesCount <= 0}
              onClick={async () => {
                if (nextVariantExhausted || nextGamesCount <= 0) return
                await resetMemorySession(nextGamesCount)
                await setSelectedGameCount(nextGamesCount)
                await setLastPlayedSettings({
                  gameType: 'memory',
                  difficulty,
                })
                setSessionMax(nextGamesCount)
                setSessionComplete(false)
                setRoundIndex(0)
                // Start the first round synchronously so the pattern is
                // visible immediately (no setTimeout flicker).
                setRoundIndex(1)
                setPhase('highlight')
                setSelected([])
                setRoundScore(0)
                setRoundResult(null)
                setPattern(generatePattern())
              }}
              className="rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-5 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 disabled:opacity-60"
            >
              Play game
            </button>
            <ShareScoreButton
              score={score}
              gameType="Memory Grid"
              difficulty={difficultyLabel(difficulty as Difficulty)}
            />
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

      {/* Phase instruction + feedback */}
      <div className="min-h-[40px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {roundResult ? (
            <motion.div
              key={`result-${roundIndex}-${roundResult}`}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border px-6 py-2.5 text-sm sm:text-base font-bold text-center"
              style={{
                color: roundResult === 'correct' ? '#22c55e' : '#f87171',
                borderColor: roundResult === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
                background: roundResult === 'correct' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              }}
            >
              {roundResult === 'correct' ? '✓ Correct!' : '✗ Wrong block'}
            </motion.div>
          ) : (
            <motion.p
              key={`phase-${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="section-label text-slate-400 text-xs"
            >
              {phase === 'highlight' ? 'Remember the blocks…' : 'Click the blocks you saw'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
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
                  : isHighlighted(index) || showMissed(index)
                    ? 'var(--accent-orange)'
                    : isSelected(index) && isCorrect(index)
                      ? 'rgba(34, 197, 94, 0.5)'
                      : 'rgba(39, 39, 42, 0.9)',
                borderColor: isHighlighted(index) || showMissed(index)
                  ? 'var(--accent-orange)'
                  : showAsWrong(index)
                    ? '#ef4444'
                    : 'rgba(63, 63, 70, 0.8)',
              }}
              transition={{ duration: 0.25 }}
              className="rounded-lg sm:rounded-xl border-2 min-h-[40px] sm:min-h-0 aspect-square touch-manipulative"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              onClick={() => handleCellClick(index)}
              disabled={phase !== 'recall' || roundResult !== null}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Difficulty badge */}
      <div className="flex items-center justify-center gap-2 mt-1">
        <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-0.5 text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400">
          {difficulty} · {size}×{size}
        </span>
      </div>
    </div>
  )
}
