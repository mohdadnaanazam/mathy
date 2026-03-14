'use client'
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { generateMathQuestion } from '@/lib/mathGenerator'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { MathQuestion, OperationMode } from '@/types'
import Timer from './Timer'

export default function MathGame() {
  const operation        = useGameStore(s => s.operation)
  const difficulty       = useGameStore(s => s.difficulty)
  const customOperations = useGameStore(s => s.customOperations)
  const addScore         = useGameStore(s => s.addScore)
  const recordAttempt    = useGameStore(s => s.recordAttempt)
  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateMathQuestion(difficulty, operation, operation === 'custom' ? customOperations : undefined),
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [typed, setTyped] = useState('')
  const [streak,   setStreak]   = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.g-item'), {
      y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out',
    })
  }, [])

  function nextQuestion(currentMode?: OperationMode) {
    const mode = currentMode ?? operation
    const customOps = mode === 'custom' ? customOperations : undefined
    setQuestion(generateMathQuestion(difficulty, mode, customOps))
    setSelected(null)
    setFeedback(null)
    setTyped('')
    setTimerKey(k => k + 1)
  }

  const handleAnswer = useCallback((answer: number) => {
    if (feedback !== null) return
    const correct = answer === question.answer
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      addScore(streak >= 2 ? 150 : 100)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
    recordAttempt()
    setTimeout(() => nextQuestion(), 800)
  }, [feedback, question, streak, addScore, difficulty, operation])

  const handleDigit = (d: string) => {
    if (feedback !== null) return
    if (typed.length >= 6) return
    setTyped(prev => (prev === '0' && d !== '.' ? d : prev + d))
  }

  const handleBackspace = () => {
    if (feedback !== null) return
    setTyped(prev => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    if (!typed.trim() || feedback !== null) return
    const value = Number(typed)
    if (Number.isNaN(value)) return
    handleAnswer(value)
  }

  function handleTimeUp() {
    recordHourlyAttempt()
    setStreak(0)
    nextQuestion()
  }

  // Keep questions in sync when operation mode changes from outside
  const lastOpRef = useRef<OperationMode>(operation)
  if (lastOpRef.current !== operation) {
    lastOpRef.current = operation
    nextQuestion(operation)
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-w-full flex flex-col items-center mx-auto px-2 py-3 sm:px-4 sm:py-5 gap-4 sm:gap-6"
    >

      {/* Timer Header Row */}
      <div className="g-item w-full" style={{ marginBottom: '8px' }}>
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.8, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: 20 }}
              className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: '#27272a',
                background: '#18181b',
                color: '#94a3b8',
              }}
            >
              <span>⚡</span>
              {streak}× COMBO
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question presentation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.expression}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="g-item relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center px-4 py-5 sm:px-5 sm:py-6"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="absolute right-4 top-4 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider"
            style={{ color: '#94a3b8' }}
          >
            {question.operation === '+' ? 'Addition' : question.operation === '-' ? 'Subtract' : question.operation === '×' ? 'Multiply' : 'Divide'}
          </div>
          <p className="section-label mb-4 text-slate-400">
            Calculate the result
          </p>
          <div className="text-[clamp(28px,7vw,56px)] font-bold leading-none text-white">
            {question.expression}
            <span className="text-slate-400"> = ?</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Typed answer input + keypad */}
      <div className="g-item w-full space-y-3">
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
        <div
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-center font-mono text-sm text-zinc-300"
        >
          {typed || 'Enter answer'}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 sm:gap-2">
          {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(key => (
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
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
        >
          Check answer
        </button>
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
              ? streak > 2 ? `🔥 ${streak}× COMBO ACTIVE!` : '✓ BRILLIANT'
              : `✕ INCORRECT. THE ANSWER WAS ${question.answer}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
