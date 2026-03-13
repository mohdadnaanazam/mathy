'use client'
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { generateMathQuestion } from '@/lib/mathGenerator'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { MathQuestion } from '@/types'
import Timer from './Timer'

export default function MathGame() {
  const [question, setQuestion] = useState<MathQuestion>(() => generateMathQuestion('medium'))
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [streak,   setStreak]   = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const addScore      = useGameStore(s => s.addScore)
  const recordAttempt = useGameStore(s => s.recordAttempt)
  const difficulty    = useGameStore(s => s.difficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.g-item'), {
      y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out',
    })
  }, [])

  function nextQuestion() {
    setQuestion(generateMathQuestion(difficulty))
    setSelected(null)
    setFeedback(null)
    setTimerKey(k => k + 1)
  }

  const handleAnswer = useCallback((opt: number) => {
    if (selected !== null || feedback !== null) return
    setSelected(opt)
    const correct = opt === question.answer
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      addScore(streak >= 2 ? 150 : 100)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
    recordAttempt()
    setTimeout(nextQuestion, 1000)
  }, [selected, feedback, question, streak, addScore, difficulty])

  function handleTimeUp() {
    recordHourlyAttempt()
    setStreak(0)
    nextQuestion()
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', width: '100%', maxWidth: '520px', margin: '0 auto' }}>

      {/* Timer Header Row */}
      <div className='g-item' style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
        
        {/* Streak badge */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.8, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: 20 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '100px',
                border: '1px solid var(--accent-cyan)',
                background: 'rgba(0, 240, 255, 0.1)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)'
              }}
            >
              <span style={{ fontSize: '18px' }}>⚡</span>
              <span style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{streak}× COMBO</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question presentation */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={question.expression}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: -20, scale: 0.95  }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className='g-item bg-[var(--bg-card)] border border-[rgba(0,240,255,0.15)] rounded-3xl relative w-full text-center px-6 py-12 sm:px-10 sm:py-16'
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{
            position: 'absolute', top: '24px', right: '24px',
            fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
            color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700,
            background: 'rgba(0, 240, 255, 0.08)', padding: '6px 14px', borderRadius: '100px'
          }}>
            {question.operation === '+' ? 'Addition' : question.operation === '-' ? 'Subtract' : question.operation === '×' ? 'Multiply' : 'Divide'}
          </div>
          <p style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '24px' }}>
            Calculate the result
          </p>
          <div className="text-[clamp(40px,10vw,88px)] font-bold text-white tracking-tight leading-none">
            {question.expression}
            <span style={{ color: 'var(--accent-cyan)' }}> = ?</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer grid */}
      <div className='g-item grid grid-cols-2 gap-4 w-full'>
        {question.options.map((opt, i) => {
          const isSelected = selected === opt
          const isCorrect  = opt === question.answer
          const showCorrect = !isSelected && selected !== null && isCorrect

          let bg      = 'rgba(255,255,255,0.02)'
          let border  = 'rgba(255,255,255,0.1)'
          let color   = '#fff'
          let transform = 'scale(1)'
          let boxShadow = 'none'

          if (isSelected && isCorrect)  { 
            bg = 'rgba(0, 240, 255, 0.1)'
            border = 'var(--accent-cyan)'
            transform = 'scale(1.02)'
            boxShadow = '0 0 20px rgba(0, 240, 255, 0.3)'
          }
          if (isSelected && !isCorrect) { 
            bg = 'rgba(255, 0, 127, 0.1)'
            border = 'var(--accent-pink)'
            color = 'rgba(255,255,255,0.5)' 
            boxShadow = '0 0 20px rgba(255, 0, 127, 0.2)'
          }
          if (showCorrect) { 
            border = 'rgba(0, 240, 255, 0.5)' 
            color = 'var(--accent-cyan)'
          }

          return (
            <motion.button
              key={`${question.expression}-${i}`}
              whileHover={selected === null ? { scale: 1.02, y: -4, backgroundColor: 'rgba(255,255,255,0.06)' } : {}}
              whileTap={selected === null ? { scale: 0.98 } : {}}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
              className="relative rounded-2xl border-2 py-6 px-4 sm:py-8 sm:px-6 font-mono font-bold text-2xl sm:text-4xl transition-all duration-300"
              style={{
                borderColor: border, background: bg, color, textShadow: isSelected && isCorrect ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none',
                cursor: selected === null ? 'pointer' : 'not-allowed',
                transform, boxShadow,
              }}
            >
              {opt}
              {isSelected && isCorrect && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '16px', color: 'var(--accent-cyan)' }}>
                  ✓
                </motion.span>
              )}
              {isSelected && !isCorrect && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '16px', color: 'var(--accent-pink)' }}>
                  ✕
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback text */}
      <AnimatePresence>
        {feedback && (
          <motion.p key={feedback}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ 
              fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: feedback === 'correct' ? 'var(--accent-cyan)' : 'var(--accent-pink)',
              background: feedback === 'correct' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 0, 127, 0.1)',
              padding: '12px 24px', borderRadius: '100px',
              border: `1px solid ${feedback === 'correct' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)'}`
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
