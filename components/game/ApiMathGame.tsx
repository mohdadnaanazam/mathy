'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameLoader } from '@/hooks/useGameLoader'
import { useGameTimer } from '@/hooks/useGameTimer'
import Timer from './Timer'
import type { BackendGame } from '@/src/services/gameService'
import { API_BASE_URL } from '@/src/api/apiClient'

export default function ApiMathGame() {
  const operation = useGameStore(s => s.operation)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { games, loading, error, refresh } = useGameLoader(operation)
  const { secondsRemaining, hasTimer } = useGameTimer()
  const prevSecondsRef = useRef(secondsRemaining)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const current = games[currentIndex]

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
  }, [currentIndex, games.length])

  const goNext = useCallback(() => {
    setTyped('')
    setFeedback(null)
    setTimerKey(k => k + 1)
    setCurrentIndex(i => (i + 1 < games.length ? i + 1 : 0))
  }, [games.length])

  const handleSubmit = useCallback(() => {
    if (!current || !typed.trim() || feedback !== null) return
    const correctValue = Number(current.correct_answer)
    const given = Number(typed)
    if (Number.isNaN(correctValue) || Number.isNaN(given)) return
    const isCorrect = given === correctValue
    setFeedback(isCorrect ? 'correct' : 'wrong')
    recordHourlyAttempt()
    setTimeout(goNext, 800)
  }, [current, typed, feedback, goNext, recordHourlyAttempt])

  // Auto-submit: when typed answer matches correct answer (or wrong when same length after delay)
  useEffect(() => {
    if (!current || feedback !== null) return
    const correctStr = String(current.correct_answer)
    if (typed === correctStr) {
      const t = setTimeout(handleSubmit, 150)
      return () => clearTimeout(t)
    }
    if (typed.length === correctStr.length && typed !== correctStr) {
      const t = setTimeout(handleSubmit, 600)
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
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
          Loading games…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
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
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-sm text-slate-300">No games loaded.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full flex flex-col items-center mx-auto px-2 py-3 sm:px-4 sm:py-5 gap-4 sm:gap-6">
      {/* Timer Header Row */}
      <div className="api-game-item w-full" style={{ marginBottom: '8px' }}>
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
      </div>

      {/* Question presentation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="api-game-item relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center px-4 py-5 sm:px-5 sm:py-6"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="absolute right-4 top-4 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider"
            style={{ color: '#94a3b8' }}
          >
            {current.game_type}
          </div>
          <p className="section-label mb-4 text-slate-400">
            Calculate the result
          </p>
          <div className="text-[clamp(28px,7vw,56px)] font-bold leading-none text-white">
            {current.question}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Typed answer input + keypad */}
      <div className="api-game-item w-full space-y-3">
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(148,163,184,0.9)',
          }}
        >
          Type out your answer
        </div>
        <div className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-center font-mono text-sm text-zinc-300">
          {typed || 'Enter answer'}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 sm:gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => (key === '⌫' ? handleBackspace() : handleDigit(key))}
              className="rounded-xl bg-zinc-900/80 border border-zinc-800 py-2.5 sm:py-3 text-center text-sm font-semibold text-zinc-100 active:bg-zinc-800 min-h-[44px] sm:min-h-0"
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
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{
              color: feedback === 'correct' ? '#22c55e' : '#94a3b8',
              borderColor: feedback === 'correct' ? 'rgba(34,197,94,0.3)' : '#27272a',
              background: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : '#18181b',
            }}
          >
            {feedback === 'correct'
              ? '✓ Correct!'
              : `✕ Incorrect. The answer was ${current.correct_answer}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

