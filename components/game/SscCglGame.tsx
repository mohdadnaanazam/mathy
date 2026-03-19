'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
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
  getSelectedGameCount,
  setSelectedGameCount,
  setLastPlayedSettings,
} from '@/lib/db'
import { difficultyLabel } from '@/lib/gameProgression'

import easyData from '@/src/data/ssc-cgl/easy.json'
import mediumData from '@/src/data/ssc-cgl/medium.json'
import hardData from '@/src/data/ssc-cgl/hard.json'

interface SscQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
  year?: number
}

const DATA_MAP: Record<Difficulty, SscQuestion[]> = {
  easy: easyData as SscQuestion[],
  medium: mediumData as SscQuestion[],
  hard: hardData as SscQuestion[],
}

const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 }
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']
const GAME_TYPE = 'ssc_cgl'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SscCglGame() {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty) as Difficulty
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  const [sessionMax, setSessionMax] = useState(5)
  const [sessionPlayed, setSessionPlayed] = useState(0)
  const [sessionHydrated, setSessionHydrated] = useState(false)
  const [questions, setQuestions] = useState<SscQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)
  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty] ?? 10

  // Session-complete picker state
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty>(difficulty)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(sessionMax)

  // Hydrate session
  useEffect(() => {
    Promise.all([
      getGenericSessionMax(GAME_TYPE).then(setSessionMax),
      getGenericSessionPlayed(GAME_TYPE).then(setSessionPlayed),
    ]).then(() => setSessionHydrated(true))
  }, [])

  useEffect(() => {
    getSelectedGameCount().then(saved => { if (saved != null && saved > 0) setNextGamesCount(saved) })
  }, [])

  useEffect(() => { if (!sessionComplete) setNextDifficulty(difficulty) }, [difficulty, sessionComplete])

  // Load variant progress for next-session picker
  useEffect(() => {
    if (!nextDifficulty) return
    getVariantProgress(GAME_TYPE, nextDifficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [nextDifficulty])

  // Auto-advance difficulty on session complete
  useEffect(() => {
    if (!sessionComplete) return
    const cur = difficultyRef.current
    const idx = DIFFICULTY_ORDER.indexOf(cur)
    const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length]
    setNextDifficulty(next)
    getVariantProgress(GAME_TYPE, next).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
  }, [sessionComplete])

  // Shuffle questions when difficulty or session changes
  useEffect(() => {
    if (!sessionHydrated) return
    const pool = DATA_MAP[difficulty] ?? []
    if (pool.length === 0) { setQuestions([]); return }
    setQuestions(shuffle(pool).slice(0, Math.max(1, sessionMax)))
    setCurrentIndex(0)
    setFeedback(null)
    setSelectedAnswer(null)
  }, [difficulty, sessionHydrated, shuffleKey, sessionMax])

  const current = questions.length > 0 && currentIndex < questions.length ? questions[currentIndex] : undefined

  const goNext = useCallback(() => {
    setFeedback(null)
    setSelectedAnswer(null)
    setTimerKey(k => k + 1)
    const curDiff = difficultyRef.current

    getGenericSessionPlayed(GAME_TYPE).then(played => {
      const willBe = Math.min(sessionMax, played + 1)
      if (curDiff) incrementVariantPlayed(GAME_TYPE, curDiff)
      if (willBe >= sessionMax) setSessionComplete(true)
      if (played < sessionMax) incrementGenericSessionPlayed(GAME_TYPE).then(next => setSessionPlayed(next))
    })

    setCurrentIndex(i => {
      const next = i + 1
      return next < questions.length ? next : i
    })
  }, [questions.length, sessionMax])

  const handleAnswer = useCallback((option: string) => {
    if (!current || feedback !== null) return
    setSelectedAnswer(option)
    const isCorrect = option === current.answer

    if (isCorrect) {
      setFeedback('correct')
      recordHourlyAttempt()
      addScore(pointsPerCorrect).then(() => syncNow())
      setTimeout(goNext, 1000)
    } else {
      setFeedback('wrong')
      recordHourlyAttempt()
      setTimeout(goNext, 2500)
    }
  }, [current, feedback, recordHourlyAttempt, addScore, pointsPerCorrect, syncNow, goNext])

  function handleTimeUp() {
    if (sessionPlayed >= sessionMax) return
    recordHourlyAttempt()
    goNext()
  }

  if (userLoading || !sessionHydrated) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-[0.16em]">Loading…</p>
      </div>
    )
  }

  const nextVariantExhausted = nextVariantRemaining <= 0

  if (sessionComplete) {
    return (
      <div className="w-full flex flex-col items-center mx-auto gap-5 sm:gap-6">
        <div className="api-game-item w-full flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">SSC CGL Math</span>
        </div>
        <div className="api-game-item w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="section-label justify-center text-xs text-slate-400">Session complete</p>
            <p className="text-base sm:text-lg text-slate-200 font-medium">You finished this set of SSC CGL questions.</p>
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">Next up: {difficultyLabel(nextDifficulty)}</p>
            <p className="text-xs sm:text-sm text-slate-500">Or choose a different difficulty below.</p>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2.5">
            <p className="section-label text-xs text-slate-400">Choose difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map(d => {
                const active = nextDifficulty === d
                return (
                  <button key={d} type="button" onClick={() => setNextDifficulty(d)}
                    className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                      borderRadius: 12,
                      border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                      color: active ? 'var(--accent-orange)' : '#d1d5db',
                    }}>
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of games + remaining */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-1">
              <span className="section-label text-xs">Number of games</span>
              <span className="text-xs text-slate-400">Max 20 per difficulty.</span>
              <span className="text-[11px] font-mono text-slate-500">{nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining</span>
              {nextVariantExhausted && (() => {
                const urgent = !refreshReady && /^(\d+)m/.test(refreshFormatted) && parseInt(refreshFormatted.match(/^(\d+)m/)![1], 10) < 2
                return (
                  <span className={`text-[11px] font-mono inline-flex items-center gap-1 ${urgent ? 'progress-urgent' : ''}`}
                    style={{ color: refreshReady ? '#22c55e' : urgent ? '#f87171' : '#fbbf24' }}>
                    {refreshReady ? '🎉 New games available! Go home and tap Reload.' : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0" style={{ opacity: 0.8 }}>
                          <circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 1.5" />
                        </svg>
                        Next games unlock in {refreshFormatted}
                      </>
                    )}
                  </span>
                )
              })()}
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" disabled={nextVariantExhausted}
                onClick={() => setNextGamesCount(v => Math.max(1, Math.min(v - 1, nextVariantRemaining)))}
                className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40">−</button>
              <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">{nextGamesCount}</div>
              <button type="button" disabled={nextVariantExhausted}
                onClick={() => setNextGamesCount(v => Math.min(Math.max(v + 1, 1), nextVariantRemaining))}
                className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 disabled:opacity-40">+</button>
            </div>
          </div>

          {nextVariantExhausted && <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button type="button"
              disabled={!nextDifficulty || nextVariantExhausted || nextGamesCount <= 0}
              onClick={async () => {
                if (!nextDifficulty || nextVariantExhausted || nextGamesCount <= 0) return
                await resetGenericSession(GAME_TYPE, nextGamesCount)
                await setSelectedGameCount(nextGamesCount)
                await setLastPlayedSettings({ gameType: GAME_TYPE, difficulty: nextDifficulty })
                setDifficulty(nextDifficulty)
                setSessionMax(nextGamesCount)
                setSessionPlayed(0)
                setSessionComplete(false)
                setShuffleKey(k => k + 1)
                setCurrentIndex(0)
                setFeedback(null)
                setSelectedAnswer(null)
                setTimerKey(k => k + 1)
              }}
              className="w-full sm:w-auto rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-8 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
              Play game
            </button>
            <ShareScoreButton score={score} gameType="SSC CGL Math" difficulty={difficultyLabel(difficulty)} />
            <button type="button" onClick={() => router.push('/')}
              className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98]">
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
        <p className="text-xs sm:text-sm text-slate-300">No questions available for this difficulty.</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center mx-auto gap-4 sm:gap-5">
      <div className="api-game-item w-full flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">SSC CGL Math</span>
      </div>

      {/* Timer + Score */}
      <div className="api-game-item w-full flex items-center justify-between gap-3">
        <Timer key={timerKey} seconds={60} onTimeUp={handleTimeUp} type="math" />
        <div className="flex items-center gap-2.5">
          <span className="section-label text-slate-400 text-xs">Total</span>
          <span className="text-sm sm:text-base font-semibold text-white tabular-nums">{score}</span>
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="api-game-item relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-5 sm:px-6 sm:py-8"
          style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <span className="text-[10px] sm:text-xs font-mono text-slate-500">
              {Math.min(currentIndex + 1, sessionMax)} / {sessionMax}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400">
              ssc cgl{current.year ? ` · ${current.year}` : ''}
            </span>
          </div>
          <p className="text-sm sm:text-base text-white leading-relaxed text-center">{current.question}</p>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="api-game-item w-full grid grid-cols-1 gap-2">
        {current.options.map((opt, i) => {
          const isSelected = selectedAnswer === opt
          const isCorrectOpt = opt === current.answer
          let bg = 'rgba(39,39,42,0.5)'
          let border = '1px solid var(--border-subtle)'
          let color = '#e2e8f0'

          if (feedback !== null && isCorrectOpt) {
            bg = 'rgba(34, 197, 94, 0.15)'; border = '1.5px solid rgba(34, 197, 94, 0.5)'; color = '#22c55e'
          } else if (feedback === 'wrong' && isSelected) {
            bg = 'rgba(239, 68, 68, 0.15)'; border = '1.5px solid rgba(239, 68, 68, 0.5)'; color = '#f87171'
          }

          return (
            <button key={i} type="button" onClick={() => handleAnswer(opt)} disabled={feedback !== null}
              className="rounded-xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-left transition-all active:scale-[0.98] disabled:cursor-default"
              style={{ backgroundColor: bg, border, color }}>
              <span className="font-semibold mr-2 text-slate-500">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Feedback + explanation */}
      <AnimatePresence>
        {feedback && (
          <motion.div key={feedback} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full rounded-xl border px-4 py-3 text-sm space-y-1"
            style={{
              color: feedback === 'correct' ? '#22c55e' : '#94a3b8',
              borderColor: feedback === 'correct' ? 'rgba(34,197,94,0.3)' : '#27272a',
              background: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : '#18181b',
            }}>
            <p className="font-semibold">{feedback === 'correct' ? '✓ Correct!' : '✗ Wrong answer'}</p>
            {(feedback === 'wrong' || feedback === 'correct') && current.explanation && (
              <p className="text-xs text-slate-400">{current.explanation}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
