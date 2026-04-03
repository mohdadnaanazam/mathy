'use client'

/**
 * SpeedSortGame
 *
 * Drag-and-drop number sorting game. Uses the same session tracking,
 * scoring, and progression system as all other Mathy games.
 * gameType = "speed_sort"
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import { useLeaderboardSubmit } from '@/hooks/useLeaderboardSubmit'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import RefreshBanner from '@/components/ui/RefreshBanner'
import ShareScoreButton from './ShareScoreButton'
import Timer from './Timer'
import type { Difficulty } from '@/types'
import {
  getGenericSessionMax,
  getGenericSessionPlayed,
  incrementGenericSessionPlayed,
  incrementVariantPlayed,
  getVariantProgress,
  resetGenericSession,
  setSelectedGameCount,
  setLastPlayedSettings,
} from '@/lib/db'
import {
  getNextMoreGameConfig,
  moreGameLabel,
  difficultyLabel,
  MORE_GAMES_ORDER,
  DIFFICULTY_ORDER,
} from '@/lib/gameProgression'

const GAME_TYPE = 'speed_sort'
const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 }
const NUM_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 }
const TIMER_SECONDS: Record<Difficulty, number> = { easy: 30, medium: 20, hard: 15 }
const NUM_RANGE: Record<Difficulty, [number, number]> = {
  easy: [1, 50],
  medium: [1, 200],
  hard: [-100, 500],
}

function generateNumbers(difficulty: Difficulty): number[] {
  const count = NUM_COUNT[difficulty]
  const [min, max] = NUM_RANGE[difficulty]
  const nums = new Set<number>()
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(nums)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SpeedSortGame({
  onFirstGameComplete,
  onPerfectScore,
}: {
  onFirstGameComplete?: () => void
  onPerfectScore?: (gameLabel: string) => void
} = {}) {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { userUuid } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { promptAndSubmit } = useLeaderboardSubmit(userUuid)
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty
  const pointsPerCorrect = POINTS[difficulty as Difficulty] ?? 10

  // Session state
  const [sessionMax, setSessionMax] = useState(10)
  const [sessionPlayed, setSessionPlayed] = useState(0)
  const [sessionHydrated, setSessionHydrated] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const sessionCorrectRef = useRef(0)
  useEffect(() => { sessionCorrectRef.current = sessionCorrect }, [sessionCorrect])
  const [timerKey, setTimerKey] = useState(0)

  // Round state
  const [numbers, setNumbers] = useState<number[]>([])
  const [userOrder, setUserOrder] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Next-session picker
  const [nextGame, setNextGame] = useState(GAME_TYPE)
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty>(difficulty as Difficulty)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(10)

  // Hydrate session
  useEffect(() => {
    Promise.all([
      getGenericSessionMax(GAME_TYPE).then(setSessionMax),
      getGenericSessionPlayed(GAME_TYPE).then(setSessionPlayed),
    ]).then(() => setSessionHydrated(true))
  }, [])

  // Generate first round
  useEffect(() => {
    if (!sessionHydrated || sessionComplete) return
    startNewRound()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionHydrated, difficulty])

  function startNewRound() {
    const nums = generateNumbers(difficultyRef.current as Difficulty)
    setNumbers(nums)
    setUserOrder(shuffle(nums))
    setFeedback(null)
    setSortDirection(Math.random() > 0.5 ? 'asc' : 'desc')
  }

  // Session complete effects
  useEffect(() => {
    if (!sessionComplete) return
    const currentDiff = difficultyRef.current as Difficulty
    if (!currentDiff) return
    promptAndSubmit(score, GAME_TYPE)
    onFirstGameComplete?.()
    const next = getNextMoreGameConfig(GAME_TYPE, currentDiff)
    setNextGame(next.game)
    setNextDifficulty(next.difficulty)
  }, [sessionComplete])

  // Report game completion for achievement
  useEffect(() => {
    if (!sessionComplete) return
    const currentDiff = difficultyRef.current as Difficulty
    onPerfectScore?.(`Speed Sort ${difficultyLabel(currentDiff)}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionComplete])

  // Load variant progress for picker
  useEffect(() => {
    if (!nextDifficulty) return
    getVariantProgress(nextGame, nextDifficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [nextGame, nextDifficulty])

  const goNext = useCallback(() => {
    setTimerKey(k => k + 1)
    const diff = difficultyRef.current as Difficulty
    incrementVariantPlayed(GAME_TYPE, diff)
    incrementGenericSessionPlayed(GAME_TYPE).then(next => {
      setSessionPlayed(next)
      if (next >= sessionMax) {
        setSessionComplete(true)
      } else {
        startNewRound()
      }
    })
  }, [sessionMax])

  const handleSubmit = useCallback(() => {
    if (feedback !== null) return
    const sorted = [...numbers].sort((a, b) => sortDirection === 'asc' ? a - b : b - a)
    const isCorrect = userOrder.every((n, i) => n === sorted[i])

    if (isCorrect) {
      setFeedback('correct')
      setSessionCorrect(c => c + 1)
      setSessionScore(s => s + pointsPerCorrect)
      recordHourlyAttempt()
      addScore(pointsPerCorrect).then(() => syncNow())
      setTimeout(goNext, 800)
    } else {
      setFeedback('wrong')
      recordHourlyAttempt()
      setTimeout(goNext, 1200)
    }
  }, [feedback, numbers, userOrder, sortDirection, pointsPerCorrect, recordHourlyAttempt, addScore, syncNow, goNext])

  const handleTimeUp = () => { recordHourlyAttempt(); goNext() }

  // Drag handlers (touch + mouse)
  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (index: number) => {
    if (dragIndex === null || dragIndex === index || feedback !== null) return
    setUserOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => setDragIndex(null)

  // Tap-to-swap: tap two items to swap them
  const [tapIndex, setTapIndex] = useState<number | null>(null)

  const handleTap = (index: number) => {
    if (feedback !== null) return
    if (tapIndex === null) {
      setTapIndex(index)
    } else {
      if (tapIndex !== index) {
        setUserOrder(prev => {
          const next = [...prev]
          ;[next[tapIndex], next[index]] = [next[index], next[tapIndex]]
          return next
        })
      }
      setTapIndex(null)
    }
  }

  // Loading
  if (!sessionHydrated) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.16em]">Loading…</p>
      </div>
    )
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="w-full flex flex-col items-center mx-auto gap-5 sm:gap-6">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Speed Sort
        </span>
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-400">Session complete</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{sessionScore}</p>
            <p className="text-xs text-slate-500">points earned this session</p>
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">
              Next up: {moreGameLabel(nextGame)} → {difficultyLabel(nextDifficulty)}
            </p>
          </div>

          {/* Game type selector */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Choose game</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MORE_GAMES_ORDER.map(g => (
                <button key={g} type="button" onClick={() => setNextGame(g)}
                  className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: nextGame === g ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                    border: nextGame === g ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    color: nextGame === g ? 'var(--accent-orange)' : '#d1d5db',
                  }}>
                  {moreGameLabel(g)}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Choose difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map(d => (
                <button key={d} type="button" onClick={() => setNextDifficulty(d)}
                  className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: nextDifficulty === d ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                    border: nextDifficulty === d ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    color: nextDifficulty === d ? 'var(--accent-orange)' : '#d1d5db',
                  }}>
                  {difficultyLabel(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Game count + variant progress */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Number of games</span>
              <span className="text-[11px] font-mono text-slate-500">
                {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
              </span>
              {nextVariantRemaining <= 0 && (
                <span className="text-[11px] font-mono text-amber-400">
                  {refreshReady ? '🎉 New games available! Go home and tap Reload.' : `Next games unlock in ${refreshFormatted}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button"
                onClick={() => { if (nextVariantRemaining > 0) setNextGamesCount(v => Math.max(1, Math.min(v - 1, nextVariantRemaining))) }}
                disabled={nextVariantRemaining <= 0}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40">
                −
              </button>
              <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">{nextGamesCount}</div>
              <button type="button"
                onClick={() => { if (nextVariantRemaining > 0) setNextGamesCount(v => Math.min(Math.max(v + 1, 1), nextVariantRemaining)) }}
                disabled={nextVariantRemaining <= 0}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40">
                +
              </button>
            </div>
          </div>

          {nextVariantRemaining <= 0 && <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button type="button"
              disabled={nextVariantRemaining <= 0 || nextGamesCount <= 0}
              onClick={async () => {
                if (nextVariantRemaining <= 0 || nextGamesCount <= 0) return
                if (nextGame !== GAME_TYPE) {
                  await resetGenericSession(nextGame, nextGamesCount)
                  await setSelectedGameCount(nextGamesCount)
                  await setLastPlayedSettings({ gameType: nextGame, operation: nextGame, difficulty: nextDifficulty })
                  setDifficulty(nextDifficulty)
                  router.replace(`/game?mode=more&type=${nextGame}`, { scroll: false })
                  return
                }
                await resetGenericSession(GAME_TYPE, nextGamesCount)
                await setSelectedGameCount(nextGamesCount)
                await setLastPlayedSettings({ gameType: GAME_TYPE, operation: GAME_TYPE, difficulty: nextDifficulty })
                setDifficulty(nextDifficulty)
                setSessionMax(nextGamesCount)
                setSessionPlayed(0)
                setSessionComplete(false)
                setSessionScore(0)
                setSessionCorrect(0)
                setTimerKey(k => k + 1)
                startNewRound()
              }}
              className="w-full sm:w-auto rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-8 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
              Play game
            </button>
            <ShareScoreButton score={sessionScore} gameType="Speed Sort" difficulty={difficulty} />
            <button type="button" onClick={() => router.push('/game/more')}
              className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98]">
              More games
            </button>
            <button type="button" onClick={() => router.push('/')}
              className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98]">
              Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active gameplay
  return (
    <div className="w-full flex flex-col items-center mx-auto gap-4 sm:gap-5">
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Speed Sort
        </span>
      </div>

      <div className="w-full flex items-center justify-between gap-3">
        <Timer key={timerKey} seconds={TIMER_SECONDS[difficulty as Difficulty] ?? 30} onTimeUp={handleTimeUp} type="math" />
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-sm sm:text-base font-semibold text-white tabular-nums">{score}</span>
        </div>
      </div>

      {/* Instruction */}
      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
        <p className="text-xs text-slate-400 mb-1">
          Sort {sortDirection === 'asc' ? 'ascending ↑' : 'descending ↓'}
        </p>
        <p className="text-[10px] text-slate-500">
          Tap two numbers to swap them, then hit Check
        </p>
      </div>

      {/* Sortable numbers */}
      <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-3">
        {userOrder.map((num, i) => (
          <motion.button
            key={`${num}-${i}`}
            type="button"
            layout
            onClick={() => handleTap(i)}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => { e.preventDefault(); handleDragOver(i) }}
            onDragEnd={handleDragEnd}
            className="rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg font-bold transition-all select-none cursor-grab active:cursor-grabbing"
            style={{
              backgroundColor: tapIndex === i
                ? 'rgba(249,115,22,0.2)'
                : feedback === 'correct'
                  ? 'rgba(34,197,94,0.15)'
                  : feedback === 'wrong'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(39,39,42,0.6)',
              border: tapIndex === i
                ? '2px solid var(--accent-orange)'
                : feedback === 'correct'
                  ? '1px solid #22c55e'
                  : feedback === 'wrong'
                    ? '1px solid #ef4444'
                    : '1px solid var(--border-subtle)',
              color: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : '#fff',
              minWidth: '3.5rem',
              textAlign: 'center',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Check button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={feedback !== null}
        className="w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)',
          color: '#111827',
          border: '1px solid rgba(249,115,22,0.5)',
        }}
      >
        Check Order
      </button>

      <p className="text-[10px] text-slate-500 font-mono">
        {sessionPlayed} / {sessionMax} answered
      </p>
    </div>
  )
}
