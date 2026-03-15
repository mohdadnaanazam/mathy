'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  addToVariantPlayed,
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
  const [sessionProgressApplied, setSessionProgressApplied] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty as Difficulty] ?? 10

  useEffect(() => {
    getMathSessionMax().then(setSessionMax)
    getMathSessionPlayed().then(setSessionPlayed)
  }, [])

  const gamesForDifficulty = games.filter(
    (g: BackendGame) => g.difficulty === (difficulty as Difficulty),
  )
  // De-duplicate questions so the same prompt (e.g. "20 + 10 = ?") only appears once per batch
  const uniqueGamesForDifficulty = Array.from(
    new Map(gamesForDifficulty.map(g => [g.question, g])).values(),
  )
  const maxQuestions = Math.min(
    Math.max(1, sessionMax),
    Math.max(1, uniqueGamesForDifficulty.length),
  )
  const effectiveGames = uniqueGamesForDifficulty.slice(0, maxQuestions)

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
  }, [questionOrder.length, sessionMax])

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
        }, 1800)
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

  // When the persisted session counter reaches the selected max for this session,
  // mark the session as complete and add the whole session count to the per-variant progress.
  useEffect(() => {
    if (sessionProgressApplied) return
    if (sessionPlayed < sessionMax || sessionMax <= 0) return

    addToVariantPlayed(operation, difficulty ?? 'easy', sessionMax).then(() => {
      setSessionProgressApplied(true)
    })
  }, [sessionPlayed, sessionMax, sessionProgressApplied, operation, difficulty])

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

        <div className="api-game-item w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-4 sm:px-4 sm:py-5 text-center space-y-3">
          <p className="section-label text-xs text-slate-400 mb-1">
            Session complete
          </p>
          <p className="text-sm sm:text-base text-slate-200">
            You finished this set of questions for {operation}.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Go back to the home screen to pick a difficulty and choose how many of the remaining questions you want to play next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-1">
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
              : `Wrong. Right answer: ${current.correct_answer} — type it to continue`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

