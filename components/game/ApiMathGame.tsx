'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameLoader } from '@/hooks/useGameLoader'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import Timer from './Timer'
import type { BackendGame } from '@/src/services/gameService'
import { API_BASE_URL } from '@/src/api/apiClient'
import type { OperationMode, Difficulty } from '@/types'
import {
  getMathSessionMax,
  getMathSessionPlayed,
  incrementMathSessionPlayed,
  incrementVariantPlayed,
  getVariantProgress,
  resetMathSession,
} from '@/lib/db'

const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 50,
}

const VALID_OPS: OperationMode[] = ['addition', 'subtraction', 'multiplication', 'division', 'mixture', 'custom']

function operationFromUrl(opParam: string | null): OperationMode | null {
  if (!opParam || !VALID_OPS.includes(opParam as OperationMode)) return null
  return opParam as OperationMode
}

export default function ApiMathGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeOperation = useGameStore(s => s.operation)
  const setOperation = useGameStore(s => s.setOperation)
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const customOperations = useGameStore(s => s.customOperations)
  const opFromUrl = operationFromUrl(searchParams.get('op'))
  const operation = opFromUrl ?? storeOperation
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { games, loading, error, refresh } = useGameLoader(operation)

  useEffect(() => {
    if (opFromUrl) setOperation(opFromUrl)
  }, [opFromUrl, setOperation])
  const { secondsRemaining, hasTimer } = useGameTimer()
  const prevSecondsRef = useRef(secondsRemaining)
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)

  const [sessionMax, setSessionMax] = useState<number>(20)
  const [sessionPlayed, setSessionPlayed] = useState<number>(0)
  const [questionOrder, setQuestionOrder] = useState<number[]>([])
  const sessionDone = sessionPlayed >= sessionMax
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty as Difficulty] ?? 10

  // Next-session picker state (used on the Session Complete screen)
  const [nextOperation, setNextOperation] = useState<OperationMode>(operation)
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty | null>(
    (difficulty as Difficulty) ?? null,
  )
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(5)

  const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']
  const OPERATION_ORDER: OperationMode[] = [
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'mixture',
    'custom',
  ]

  useEffect(() => {
    getMathSessionMax().then(setSessionMax)
    getMathSessionPlayed().then(setSessionPlayed)
  }, [])

  // Keep the next-session operation in sync with the current one
  useEffect(() => {
    setNextOperation(operation)
  }, [operation])

  // Load per-variant progress for the "next session" picker
  useEffect(() => {
    if (!nextDifficulty) return
    getVariantProgress(nextOperation, nextDifficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => {
        if (p.remaining <= 0) return 0
        const base = prev || 5
        return Math.min(Math.max(base, 1), p.remaining)
      })
    })
  }, [nextOperation, nextDifficulty])

  // After a session completes, automatically advance through
  // difficulties and operations in a strict order:
  // Per operation: easy → medium → hard.
  // Only when all three difficulties for the current operation are completed
  // do we move to the next operation in OPERATION_ORDER.
  // If the user manually skipped a difficulty (e.g. played hard before medium),
  // we backfill the missing difficulties before moving to the next operation.
  useEffect(() => {
    if (!sessionComplete) return
    if (!difficulty) return

    ;(async () => {
      const currentDifficulty = difficulty as Difficulty

      // Helper to check remaining questions for a given (operation, difficulty).
      const hasRemaining = async (op: OperationMode, d: Difficulty) => {
        const progress = await getVariantProgress(op, d)
        return progress.remaining > 0
      }

      // 1. Within the current operation, choose the next difficulty strictly
      // based on what was just completed, without re-selecting the same level.
      if (currentDifficulty === 'easy') {
        // Prefer Medium after Easy; if exhausted, fall through to Hard.
        for (const d of ['medium', 'hard'] as Difficulty[]) {
          if (await hasRemaining(operation, d)) {
            setNextOperation(operation)
            setNextDifficulty(d)
            return
          }
        }
      } else if (currentDifficulty === 'medium') {
        // Prefer Hard after Medium; never re-select Medium here.
        if (await hasRemaining(operation, 'hard')) {
          setNextOperation(operation)
          setNextDifficulty('hard')
          return
        }
        // If Hard is exhausted, we can still offer Easy if it has remaining.
        if (await hasRemaining(operation, 'easy')) {
          setNextOperation(operation)
          setNextDifficulty('easy')
          return
        }
      } else if (currentDifficulty === 'hard') {
        // When finishing Hard, move to the next operation and start from Easy.
        const opIndex = OPERATION_ORDER.indexOf(operation)
        if (opIndex === -1) {
          setNextOperation(operation)
          setNextDifficulty('easy')
          return
        }

        // Only consider operations AFTER the current one for automatic progression.
        // We intentionally do not wrap back to the same operation here so that
        // finishing Hard always advances to the next operation.
        const opCandidates: OperationMode[] = [
          ...OPERATION_ORDER.slice(opIndex + 1),
          ...OPERATION_ORDER.slice(0, opIndex),
        ]

        for (const op of opCandidates) {
          for (const d of DIFFICULTY_ORDER) {
            if (await hasRemaining(op, d)) {
              setNextOperation(op)
              setNextDifficulty(d)
              return
            }
          }
        }
        // If everything is exhausted across all operations, stay on current
        // operation at Easy as a safe fallback.
        setNextOperation(operation)
        setNextDifficulty('easy')
        return
      }

      // 2. Current operation is fully completed (no remaining difficulties).
      // Move to the next operation in OPERATION_ORDER that still has any remaining
      // difficulty, again preferring easy→medium→hard within that operation.
      const opIndex = OPERATION_ORDER.indexOf(operation)
      if (opIndex === -1) {
        // If current operation isn't in our ordered list (e.g. mixture/custom),
        // keep the current selections.
        setNextOperation(operation)
        setNextDifficulty(currentDifficulty)
        return
      }

      const opCandidates: OperationMode[] = [
        ...OPERATION_ORDER.slice(opIndex + 1),
        ...OPERATION_ORDER.slice(0, opIndex + 1),
      ]

      for (const op of opCandidates) {
        for (const d of DIFFICULTY_ORDER) {
          const progress = await getVariantProgress(op, d)
          if (progress.remaining > 0) {
            setNextOperation(op)
            setNextDifficulty(d)
            return
          }
        }
      }

      // 3. All operations and difficulties are completed; keep the current selection.
      setNextOperation(operation)
      setNextDifficulty(currentDifficulty)
    })()
  }, [sessionComplete, operation, difficulty])

  // Compute the pool of questions for this session once per
  // (games, operation, difficulty, customOperations, sessionMax) change.
  // This avoids reshuffling on every render (e.g. every timer tick),
  // which previously caused the visible question to jump.
  const effectiveGames = useMemo(() => {
    const gamesForDifficulty = games.filter((g: BackendGame) => {
      if (g.difficulty !== (difficulty as Difficulty)) return false

      // Ensure loaded questions always match the currently selected operation.
      // For standard operations (addition, subtraction, multiplication, division),
      // restrict by game_type. For mixture, allow all. For custom, restrict to
      // the selected customOperations.
      if (operation === 'custom' && customOperations?.length) {
        return customOperations.includes(g.game_type as OperationMode)
      }
      if (
        operation === 'addition' ||
        operation === 'subtraction' ||
        operation === 'multiplication' ||
        operation === 'division'
      ) {
        return g.game_type === operation
      }
      // mixture (and any fallback) uses whatever the backend returned.
      return true
    })

    // De-duplicate questions so the same prompt (e.g. "20 + 10 = ?") only appears once per batch
    const uniqueGamesForDifficulty = Array.from(
      new Map(gamesForDifficulty.map(g => [g.question, g])).values(),
    )

    const maxQuestions = Math.min(
      Math.max(1, sessionMax),
      Math.max(1, uniqueGamesForDifficulty.length),
    )

    // Randomly sample a subset from the entire pool so sessions draw
    // from a larger question set, even when more than maxQuestions exist.
    const shuffledPool = [...uniqueGamesForDifficulty]
    for (let i = shuffledPool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]]
    }

    return shuffledPool.slice(0, maxQuestions)
  }, [games, difficulty, operation, customOperations, sessionMax])

  useEffect(() => {
    const len = effectiveGames.length
    if (len === 0) {
      setQuestionOrder([])
      setCurrentIndex(0)
      setAnswer('')
      setFeedback(null)
      return
    }
    const indices = Array.from({ length: len }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setQuestionOrder(indices)
    setCurrentIndex(0)
    setAnswer('')
    setFeedback(null)
  }, [effectiveGames.length])

  const current =
    questionOrder.length && currentIndex < questionOrder.length
      ? effectiveGames[questionOrder[currentIndex]]
      : undefined

  useEffect(() => {
    setCurrentIndex(0)
    setAnswer('')
    setFeedback(null)
  }, [operation])

  // When hourly countdown hits 0, auto-fetch new games and reset timer
  useEffect(() => {
    if (hasTimer && secondsRemaining === 0 && prevSecondsRef.current > 0) {
      refresh()
    }
    prevSecondsRef.current = secondsRemaining
  }, [secondsRemaining, hasTimer, refresh])

  // Only run entrance animation when advancing to next question, not on first load.
  useGSAP(() => {
    if (currentIndex === 0) return
    gsap.from('.api-game-item', {
      y: 40,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
    })
  }, [currentIndex, effectiveGames.length])

  const goNext = useCallback(() => {
    setAnswer('')
    setFeedback(null)
    setTimerKey(k => k + 1)

    // Update persisted session count up to the configured max
    getMathSessionPlayed().then(played => {
      const willBe = Math.min(sessionMax, played + 1)

      // Track per-variant progress one question at a time and
      // immediately refresh the played / remaining counters so
      // the game UI stays in sync with the home screen.
      if (difficulty) {
        incrementVariantPlayed(operation, difficulty as Difficulty).then(() => {
          getVariantProgress(operation, difficulty as Difficulty).then(p => {
            setNextOperation(operation)
            setNextVariantPlayed(p.played)
            setNextVariantRemaining(p.remaining)
          })
        })
      }

      if (willBe >= sessionMax) {
        setSessionComplete(true)
      }

      if (played < sessionMax) {
        incrementMathSessionPlayed().then(next => {
          setSessionPlayed(next)
        })
      }
    })

    // Advance to the next question if available; otherwise stay on the last one.
    setCurrentIndex(i => {
      const next = i + 1
      return next < questionOrder.length ? next : i
    })
  }, [questionOrder.length, sessionMax, operation, difficulty])

  const validateAnswer = useCallback(
    (value: string) => {
      if (!current || !value.trim() || feedback !== null) return

      const trimmed = value.trim()
      const correctNum = Number(current.correct_answer)
      const correctStr = Number.isNaN(correctNum)
        ? String(current.correct_answer).trim()
        : String(correctNum)
      const answerLen = correctStr.length
      const userNum = Number(trimmed)

      // Debug logs to confirm validation is running
      // eslint-disable-next-line no-console
      console.log('userAnswer:', trimmed, 'correctAnswer:', current.correct_answer)

      const isCorrect =
        !Number.isNaN(correctNum) &&
        !Number.isNaN(userNum) &&
        userNum === correctNum

      if (isCorrect) {
        setFeedback('correct')
        recordHourlyAttempt()
        addScore(pointsPerCorrect).then(() => syncNow())
        setTimeout(goNext, 800)
        return
      }

      // If user typed at least as many digits as the answer and it's wrong, treat as wrong.
      if (trimmed.length >= answerLen) {
        setFeedback('wrong')
        recordHourlyAttempt()
        setTimeout(() => {
          setAnswer('')
          setFeedback(null)
          goNext()
        }, 1200)
      }
    },
    [current, feedback, recordHourlyAttempt, addScore, pointsPerCorrect, syncNow, goNext],
  )

  const handleDigit = (d: string) => {
    if (feedback !== null) return
    const base = answer === 'Enter answer' ? '' : answer
    if (base.length >= 6) return
    const next = base === '0' && d !== '.' ? d : base + d
    setAnswer(next)
    validateAnswer(next)
  }

  const handleBackspace = () => {
    if (feedback !== null) return
    setAnswer(prev => prev.slice(0, -1))
  }


  function handleTimeUp() {
    if (sessionDone) return
    recordHourlyAttempt()
    goNext()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-[0.16em]">
          Loading games…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center px-3">
        <p className="text-sm text-rose-400">{error}</p>
        <p className="text-xs text-slate-500">
          API: {API_BASE_URL}/games — ensure the backend is running (e.g. <code className="text-slate-400">npm run dev</code> in backend).
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
        >
          Retry
        </button>
      </div>
    )
  }

  // When the session is complete (e.g. 5 of 5), stop showing questions
  // and instead show a simple "Next game" panel so the user can decide what to do next.
  if (sessionComplete) {
    return (
      <div className="w-full max-w-full flex flex-col items-center mx-auto px-0 py-2 sm:px-2 sm:py-4 gap-3 sm:gap-5">
        <div className="api-game-item w-full flex items-center gap-2 mb-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
            Math Game
          </span>
        </div>

        <div className="api-game-item w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-4 sm:px-4 sm:py-5 space-y-4">
          {/* Completion copy */}
          <div className="text-center space-y-2">
            <p className="section-label text-xs text-slate-400">
              Session complete
            </p>
            <p className="text-sm sm:text-base text-slate-200">
              You finished this set of questions for {operation}.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Choose your next game below, or go back to the home screen.
            </p>
          </div>

          {/* Next game picker */}
          <div className="mt-1 space-y-3">
            {/* Operation selector (re-uses same labels as landing page) */}
            <div className="space-y-1.5">
              <p className="section-label text-[11px] text-slate-400">
                Choose operation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {VALID_OPS.map(op => {
                  const active = nextOperation === op
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setNextOperation(op)}
                      className="rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 text-[11px] sm:text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 12,
                        border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="space-y-1.5">
              <p className="section-label text-[11px] text-slate-400">
                Choose difficulty
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                  const active = nextDifficulty === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNextDifficulty(d)}
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

            {/* Number of games + remaining info */}
            {nextDifficulty && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex flex-col">
                  <span className="section-label text-xs mb-0.5">Number of games</span>
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    Max 20 per type and level. Tap − or + to adjust.
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">
                    {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
                  </span>
                  {nextVariantRemaining <= 0 && (
                    <span className="text-[10px] font-mono text-amber-400 mt-0.5">
                      You finished {nextOperation} ({nextDifficulty}). Try another difficulty or operation.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (nextVariantRemaining <= 0) return
                      setNextGamesCount(v => Math.max(1, Math.min((v || 1) - 1, nextVariantRemaining)))
                    }}
                    className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                    disabled={nextVariantRemaining <= 0}
                  >
                    −
                  </button>
                  <div className="min-w-[2.25rem] text-center font-mono text-sm text-white">
                    {nextGamesCount}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (nextVariantRemaining <= 0) return
                      setNextGamesCount(v =>
                        Math.min(Math.max((v || 1) + 1, 1), nextVariantRemaining),
                      )
                    }}
                    className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40"
                    disabled={nextVariantRemaining <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Primary: Play next game; Secondary: Go home */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                disabled={
                  !nextDifficulty ||
                  nextVariantRemaining <= 0 ||
                  nextGamesCount <= 0
                }
                onClick={async () => {
                  if (!nextDifficulty || nextVariantRemaining <= 0 || nextGamesCount <= 0) return
                  await resetMathSession(nextGamesCount)
                  setOperation(nextOperation)
                  setDifficulty(nextDifficulty)
                  // Restart session in-place instead of navigating to the
                  // same route (which is a no-op in the App Router).
                  setSessionMax(nextGamesCount)
                  setSessionPlayed(0)
                  setSessionComplete(false)
                  setCurrentIndex(0)
                  setAnswer('')
                  setFeedback(null)
                  setTimerKey(k => k + 1)
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
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
        <p className="text-xs sm:text-sm text-slate-300">No games loaded.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full flex flex-col items-center mx-auto px-0 py-1 sm:px-2 sm:py-3 gap-2 sm:gap-4">
      {/* Section title: Math Game */}
      <div className="api-game-item w-full flex items-center gap-2 mb-0.5">
        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Math Game
        </span>
      </div>

      {/* Timer + Score row (score persisted in IndexedDB, loads on return) */}
      <div className="api-game-item w-full flex items-center justify-between flex-wrap gap-1.5 mb-1">
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="section-label text-slate-400 text-xs">
            Total
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white tabular-nums">
            {score}
          </span>
        </div>
      </div>

      {/* Question presentation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="api-game-item relative w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center px-3 py-4 sm:px-4 sm:py-5"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex items-center gap-1.5">
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-500">
              {Math.min(currentIndex + 1, sessionMax)} of {sessionMax}
            </span>
            <span
              className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider"
              style={{ color: '#94a3b8' }}
            >
              {current.game_type}
            </span>
          </div>
          <p className="section-label mb-2 sm:mb-3 text-slate-400 text-xs">
            Calculate the result
          </p>
          <div className="text-[clamp(24px,6.5vw,52px)] font-bold leading-none text-white">
            {current.question}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Typed answer input + keypad */}
      <div className="api-game-item w-full space-y-2">
        <div
          className="text-center font-mono uppercase text-[10px] sm:text-[11px] tracking-widest text-slate-400"
        >
          Type your answer
        </div>
        <input
          value={answer}
          readOnly
          placeholder="Enter answer"
          className="w-full rounded-lg sm:rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-center font-mono text-sm text-zinc-300"
        />
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => (key === '⌫' ? handleBackspace() : handleDigit(key))}
              className="rounded-lg sm:rounded-xl bg-zinc-900/80 border border-zinc-800 py-2 sm:py-2.5 text-center text-sm font-semibold text-zinc-100 active:bg-zinc-800 min-h-[40px] sm:min-h-[44px] touch-manipulative"
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback text */}
      <AnimatePresence>
        {feedback && (
          <motion.p
            key={feedback}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold"
            style={{
              color: feedback === 'correct' ? '#22c55e' : '#94a3b8',
              borderColor: feedback === 'correct' ? 'rgba(34,197,94,0.3)' : '#27272a',
              background: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : '#18181b',
            }}
          >
            {feedback === 'correct'
              ? '✓ Correct!'
              : 'Wrong answer'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

