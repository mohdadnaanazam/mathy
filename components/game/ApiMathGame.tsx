'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { getMathSessionMax, getMathSessionPlayed, incrementMathSessionPlayed } from '@/lib/db'

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty as Difficulty] ?? 10

  useEffect(() => {
    getMathSessionMax().then(setSessionMax)
  }, [])

  const gamesForDifficulty = games.filter(
    (g: BackendGame) => g.difficulty === (difficulty as Difficulty),
  )
  const maxQuestions = Math.min(
    Math.max(1, sessionMax),
    Math.max(1, gamesForDifficulty.length),
  )
  const effectiveGames = gamesForDifficulty.slice(0, maxQuestions)
  const current = effectiveGames[currentIndex]

  useEffect(() => {
    setCurrentIndex(0)
    setTyped('')
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
    setTyped('')
    setFeedback(null)
    setTimerKey(k => k + 1)
    getMathSessionPlayed().then(played => {
      if (played < sessionMax) incrementMathSessionPlayed()
    })
    setCurrentIndex(i => {
      const next = i + 1
      return next < maxQuestions ? next : i
    })
  }, [maxQuestions])

  const handleSubmit = useCallback(() => {
    if (!current || !typed.trim() || feedback !== null) return
    const correctValue = Number(current.correct_answer)
    const given = Number(typed)
    if (Number.isNaN(correctValue) && Number.isNaN(given)) return
    const isCorrect = !Number.isNaN(correctValue) && !Number.isNaN(given) && given === correctValue
    setFeedback(isCorrect ? 'correct' : 'wrong')
    recordHourlyAttempt()
    if (isCorrect) {
      addScore(pointsPerCorrect).then(() => syncNow())
      setTimeout(goNext, 800)
    } else {
      // Wrong: show right answer, then clear input so user can type the correct answer; do not advance
      setTimeout(() => {
        setTyped('')
        setFeedback(null)
      }, 1800)
    }
  }, [current, typed, feedback, goNext, recordHourlyAttempt, addScore, syncNow, pointsPerCorrect])

  // Validate when input length equals answer length (correct or wrong)
  useEffect(() => {
    if (!current || feedback !== null || !typed.trim()) return
    const correctNum = Number(current.correct_answer)
    const correctStr = Number.isNaN(correctNum)
      ? String(current.correct_answer).trim()
      : String(correctNum)
    const inputLen = typed.trim().length
    const answerLen = correctStr.length
    if (inputLen < answerLen) return
    // Same length or user typed more digits → validate
    if (inputLen === answerLen) {
      const isCorrect = typed.trim() === correctStr || Number(typed) === correctNum
      const delay = isCorrect ? 120 : 280
      const t = setTimeout(handleSubmit, delay)
      return () => clearTimeout(t)
    }
    // Optional: if they typed one more char than answer, validate immediately (e.g. extra digit)
    if (inputLen > answerLen) {
      const t = setTimeout(handleSubmit, 150)
      return () => clearTimeout(t)
    }
  }, [typed, current, feedback, handleSubmit])

  const handleDigit = (d: string) => {
    if (feedback !== null) return
    if (typed.length >= 6) return
    setTyped(prev => (prev === '0' && d !== '.' ? d : prev + d))
  }

  const handleBackspace = () => {
    if (feedback !== null) return
    setTyped(prev => prev.slice(0, -1))
  }

  function handleTimeUp() {
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
              {currentIndex + 1} of {effectiveGames.length}
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
        <div className="w-full rounded-lg sm:rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-center font-mono text-sm text-zinc-300">
          {typed || 'Enter answer'}
        </div>
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

