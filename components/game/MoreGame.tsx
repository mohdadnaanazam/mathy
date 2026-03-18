'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameLoader } from '@/hooks/useGameLoader'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import Timer from './Timer'
import ShareScoreButton from './ShareScoreButton'
import RefreshBanner from '@/components/ui/RefreshBanner'
import type { BackendGame } from '@/src/services/gameService'
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

const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 }

export default function MoreGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameType = searchParams.get('type') ?? 'square_root'
  const label = moreGameLabel(gameType)

  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { games, loading, error, refresh } = useGameLoader(gameType)
  useGameTimer()
  const { userUuid } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  const [sessionMax, setSessionMax] = useState(5)
  const [sessionPlayed, setSessionPlayed] = useState(0)
  const [sessionHydrated, setSessionHydrated] = useState(false)
  const [questionOrder, setQuestionOrder] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)
  const [sessionScore, setSessionScore] = useState(0)
  const pointsPerCorrect = POINTS[difficulty as Difficulty] ?? 10

  // Refs for stable access in async callbacks
  const gameTypeRef = useRef(gameType)
  gameTypeRef.current = gameType
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  // ── Next-session picker state ──
  const [nextGame, setNextGame] = useState(gameType)
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty | null>(difficulty as Difficulty)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(sessionMax)

  // Hydrate session from IndexedDB
  useEffect(() => {
    Promise.all([
      getGenericSessionMax(gameType).then(setSessionMax),
      getGenericSessionPlayed(gameType).then(setSessionPlayed),
    ]).then(() => setSessionHydrated(true))
  }, [gameType])

  // Keep next-session game in sync while playing
  useEffect(() => {
    if (!sessionComplete) setNextGame(gameType)
  }, [gameType, sessionComplete])

  // Load variant progress for next-session picker
  useEffect(() => {
    if (!nextDifficulty) return
    getVariantProgress(nextGame, nextDifficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [nextGame, nextDifficulty])

  // Auto-progression on session complete
  useEffect(() => {
    if (!sessionComplete) return
    const currentDiff = difficultyRef.current as Difficulty
    if (!currentDiff) return
    const next = getNextMoreGameConfig(gameTypeRef.current, currentDiff)
    setNextGame(next.game)
    setNextDifficulty(next.difficulty)
  }, [sessionComplete])

  // Filter games by difficulty and type
  const effectiveGames = useMemo(() => {
    return games.filter(
      (g: BackendGame) => g.difficulty === difficulty && g.game_type === gameType,
    )
  }, [games, difficulty, gameType])

  const effectiveGameIds = useMemo(
    () => effectiveGames.map(g => g.id).join(','),
    [effectiveGames],
  )

  // Build shuffled question order
  useEffect(() => {
    if (!sessionHydrated) return
    const len = effectiveGames.length
    if (len === 0) { setQuestionOrder([]); return }
    const indices = Array.from({ length: len }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setQuestionOrder(indices.slice(0, Math.max(1, sessionMax)))
    setCurrentIndex(0)
    setAnswer('')
    setFeedback(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGameIds, sessionHydrated, shuffleKey])

  const current =
    questionOrder.length && currentIndex < questionOrder.length
      ? effectiveGames[questionOrder[currentIndex]]
      : undefined

  const goNext = useCallback(() => {
    setAnswer('')
    setFeedback(null)
    setTimerKey(k => k + 1)

    const gt = gameTypeRef.current
    const diff = difficultyRef.current as Difficulty

    incrementVariantPlayed(gt, diff).then(() => {
      const isLast = sessionPlayed + 1 >= sessionMax
      if (!isLast) {
        getVariantProgress(gt, diff).then(p => {
          setNextVariantPlayed(p.played)
          setNextVariantRemaining(p.remaining)
        })
      }
    })

    incrementGenericSessionPlayed(gt).then(next => {
      setSessionPlayed(next)
      if (next >= sessionMax) setSessionComplete(true)
    })

    setCurrentIndex(i => {
      const next = i + 1
      return next < questionOrder.length ? next : i
    })
  }, [questionOrder.length, sessionMax, sessionPlayed])

  const validateAnswer = useCallback(
    (value: string) => {
      if (!current || !value.trim() || feedback !== null) return
      const trimmed = value.trim()
      const correctStr = String(current.correct_answer).trim()
      const correctNum = Number(correctStr)
      const userNum = Number(trimmed)

      const isCorrect = !Number.isNaN(correctNum) && !Number.isNaN(userNum)
        ? userNum === correctNum
        : trimmed === correctStr

      if (isCorrect) {
        setFeedback('correct')
        recordHourlyAttempt()
        setSessionScore(s => s + pointsPerCorrect)
        addScore(pointsPerCorrect).then(() => syncNow())
        setTimeout(goNext, 800)
        return
      }

      if (trimmed.length >= correctStr.length) {
        setFeedback('wrong')
        recordHourlyAttempt()
        setTimeout(() => { setAnswer(''); setFeedback(null); goNext() }, 1200)
      }
    },
    [current, feedback, recordHourlyAttempt, addScore, pointsPerCorrect, syncNow, goNext],
  )

  const handleDigit = (d: string) => {
    if (feedback !== null) return
    const next = answer + d
    if (next.length > 10) return
    setAnswer(next)
    validateAnswer(next)
  }

  const handleBackspace = () => {
    if (feedback !== null) return
    setAnswer(prev => prev.slice(0, -1))
  }

  const handleTimeUp = () => { recordHourlyAttempt(); goNext() }

  // ── Loading ──
  if (loading || !sessionHydrated) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.16em]">Loading games…</p>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center px-3">
        <p className="text-sm text-rose-400">{error}</p>
        <button type="button" onClick={() => refresh()}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
          Retry
        </button>
      </div>
    )
  }

  // ── Session complete with next-session picker ──
  if (sessionComplete) {
    return (
      <div className="w-full flex flex-col items-center mx-auto gap-5 sm:gap-6">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          {label}
        </span>

        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Completion copy */}
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-400">Session complete</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{sessionScore}</p>
            <p className="text-xs text-slate-500">points earned this session</p>
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">
              Next up: {moreGameLabel(nextGame)} → {difficultyLabel(nextDifficulty as Difficulty)}
            </p>
          </div>

          {/* Game type selector */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Choose game</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MORE_GAMES_ORDER.map(g => {
                const active = nextGame === g
                return (
                  <button key={g} type="button" onClick={() => setNextGame(g)}
                    className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      color: active ? 'var(--accent-orange)' : '#d1d5db',
                    }}>
                    {moreGameLabel(g)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Choose difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map(d => {
                const active = nextDifficulty === d
                return (
                  <button key={d} type="button" onClick={() => setNextDifficulty(d)}
                    className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      color: active ? 'var(--accent-orange)' : '#d1d5db',
                    }}>
                    {difficultyLabel(d)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Game count + variant progress */}
          {nextDifficulty && (
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
          )}

          {nextVariantRemaining <= 0 && (
            <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button type="button"
              disabled={!nextDifficulty || nextVariantRemaining <= 0 || nextGamesCount <= 0}
              onClick={async () => {
                if (!nextDifficulty || nextVariantRemaining <= 0 || nextGamesCount <= 0) return
                await resetGenericSession(nextGame, nextGamesCount)
                await setSelectedGameCount(nextGamesCount)
                await setLastPlayedSettings({ gameType: nextGame, operation: nextGame, difficulty: nextDifficulty })
                setDifficulty(nextDifficulty)
                router.replace(`/game?mode=more&type=${nextGame}`, { scroll: false })
                setSessionMax(nextGamesCount)
                setSessionPlayed(0)
                setSessionComplete(false)
                setSessionScore(0)
                setShuffleKey(k => k + 1)
                setCurrentIndex(0)
                setAnswer('')
                setFeedback(null)
                setTimerKey(k => k + 1)
              }}
              className="w-full sm:w-auto rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-8 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
              Play game
            </button>
            <ShareScoreButton score={sessionScore} gameType={label} difficulty={difficulty} />
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

  // ── No questions available ──
  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <p className="text-xs text-slate-400">No questions available for this game type yet.</p>
        <button type="button" onClick={() => refresh()}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
          Retry
        </button>
      </div>
    )
  }

  // ── Active gameplay ──
  return (
    <div className="w-full flex flex-col items-center mx-auto gap-4 sm:gap-5">
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          {label}
        </span>
      </div>

      <div className="w-full flex items-center justify-between gap-3">
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-sm sm:text-base font-semibold text-white tabular-nums">{score}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
          className="relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center px-4 py-5 sm:px-6 sm:py-8">
          <p className="text-[10px] text-slate-500 mb-2">
            Question {currentIndex + 1} of {Math.min(questionOrder.length, sessionMax)}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
            {current.question}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer display */}
      <div className="w-full rounded-xl border px-4 py-3 text-center text-lg sm:text-xl font-mono min-h-[3rem] flex items-center justify-center"
        style={{
          borderColor: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : 'var(--border-subtle)',
          backgroundColor: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : feedback === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(24,24,27,0.4)',
          color: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : '#fff',
        }}>
        {answer || <span className="text-zinc-600 text-sm">Enter answer</span>}
      </div>

      {/* Numpad */}
      <div className="w-full grid grid-cols-3 gap-1.5">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} type="button" onClick={() => handleDigit(d)}
            className="rounded-xl py-3 text-base font-semibold text-white transition-colors active:bg-zinc-700"
            style={{ backgroundColor: 'rgba(39,39,42,0.6)', border: '1px solid var(--border-subtle)' }}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => handleDigit('-')}
          className="rounded-xl py-3 text-base font-semibold text-white transition-colors active:bg-zinc-700"
          style={{ backgroundColor: 'rgba(39,39,42,0.6)', border: '1px solid var(--border-subtle)' }}>−</button>
        <button type="button" onClick={() => handleDigit('0')}
          className="rounded-xl py-3 text-base font-semibold text-white transition-colors active:bg-zinc-700"
          style={{ backgroundColor: 'rgba(39,39,42,0.6)', border: '1px solid var(--border-subtle)' }}>0</button>
        <button type="button" onClick={() => handleDigit('/')}
          className="rounded-xl py-3 text-base font-semibold text-white transition-colors active:bg-zinc-700"
          style={{ backgroundColor: 'rgba(39,39,42,0.6)', border: '1px solid var(--border-subtle)' }}>/</button>
        <button type="button" onClick={handleBackspace}
          className="col-span-3 rounded-xl py-2.5 text-sm font-semibold text-slate-400 transition-colors active:bg-zinc-700"
          style={{ backgroundColor: 'rgba(39,39,42,0.4)', border: '1px solid var(--border-subtle)' }}>← Delete</button>
      </div>

      <p className="text-[10px] text-slate-500 font-mono">
        {sessionPlayed} / {sessionMax} answered
      </p>
    </div>
  )
}
