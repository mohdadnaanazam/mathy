'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import Timer from './Timer'
import type { Difficulty } from '@/types'

const GRID_SIZE: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
}

const HIGHLIGHT_DURATION_MS = 2500
const POINTS_PER_CORRECT = 10
const WRONG_PENALTY = 0

type Phase = 'highlight' | 'recall' | 'result'

export default function MemoryGridGame() {
  const difficulty = useGameStore(s => s.difficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)

  const size = GRID_SIZE[difficulty]
  const total = size * size

  const [phase, setPhase] = useState<Phase>('highlight')
  const [pattern, setPattern] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [roundScore, setRoundScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  const cells = useMemo(() => Array.from({ length: total }, (_, i) => i), [total])

  const generatePattern = useCallback(() => {
    const count = Math.max(2, Math.ceil(total * 0.35))
    const shuffled = [...cells].sort(() => Math.random() - 0.5)
    setPattern(shuffled.slice(0, count))
  }, [cells, total])

  const startRound = useCallback(() => {
    setPhase('highlight')
    setSelected([])
    setRoundScore(0)
    setGameOver(false)
    generatePattern()
  }, [generatePattern])

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
        const points = POINTS_PER_CORRECT
        setRoundScore(s => s + points)
        addScore(points)
        if (next.length === pattern.length) {
          setGameOver(true)
          setTimeout(() => syncNow(), 300)
        }
      } else {
        if (WRONG_PENALTY > 0) addScore(-WRONG_PENALTY)
        setGameOver(true)
        setTimeout(() => syncNow(), 300)
      }
    },
    [phase, gameOver, selected, pattern, addScore, syncNow],
  )

  const handleTimeUp = useCallback(() => {
    recordHourlyAttempt()
    syncNow()
    setPhase('result')
  }, [recordHourlyAttempt, syncNow])

  useEffect(() => {
    startRound()
  }, [difficulty])

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-xs text-slate-400 uppercase tracking-wider">Loading…</p>
      </div>
    )
  }

  const isHighlighted = (index: number) => phase === 'highlight' && pattern.includes(index)
  const isSelected = (index: number) => selected.includes(index)
  const isCorrect = (index: number) => pattern.includes(index)
  const showAsWrong = (index: number) => gameOver && selected.includes(index) && !pattern.includes(index)

  return (
    <div className="w-full max-w-full flex flex-col items-center mx-auto px-2 py-3 sm:px-4 sm:py-5 gap-4 sm:gap-6">
      <div className="api-game-item w-full flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: '8px' }}>
        <Timer key={timerKey} seconds={60} onTimeUp={handleTimeUp} type="memory" />
        <div className="flex items-center gap-4">
          <span className="section-label text-slate-400">
            Round: {roundScore} pts
          </span>
          <span className="text-sm font-semibold text-white">
            Total: {score}
          </span>
        </div>
      </div>

      <p className="section-label mb-4 text-slate-400">
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
        className="api-game-item grid gap-1.5 sm:gap-2 w-full max-w-[320px] sm:max-w-[400px]"
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
              className="rounded-xl border-2 min-h-[44px] sm:min-h-0 aspect-square touch-manipulative"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              onClick={() => handleCellClick(index)}
              disabled={phase !== 'recall' || gameOver}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="api-game-item w-full flex justify-center">
        <button
          type="button"
          onClick={() => {
            setTimerKey(k => k + 1)
            startRound()
          }}
          className="btn-secondary rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Next round
        </button>
      </div>
    </div>
  )
}
