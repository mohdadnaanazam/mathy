'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useScore } from '@/hooks/useScore'
import type { Difficulty } from '@/types'

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

const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 }
const LS_KEY = 'ssc_cgl_progress'

interface SavedProgress {
  completed: number[]
  lastIndex: number
}

function loadProgress(diff: Difficulty): SavedProgress {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${diff}`)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && Array.isArray(p.completed)) return { completed: p.completed, lastIndex: p.lastIndex ?? 0 }
    }
  } catch {}
  return { completed: [], lastIndex: 0 }
}

function saveProgress(diff: Difficulty, completed: number[], lastIndex: number) {
  try {
    localStorage.setItem(`${LS_KEY}_${diff}`, JSON.stringify({ completed, lastIndex }))
  } catch {}
}

type YearFilter = 'all' | number
type StatusFilter = 'all' | 'completed' | 'uncompleted'

export default function SscCglGame() {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty) as Difficulty
  const { addPoints } = useScore()

  const questions = useMemo(() => DATA_MAP[difficulty] ?? DATA_MAP.easy, [difficulty])
  const years = useMemo(() => {
    const set = new Set<number>()
    questions.forEach(q => { if (q.year) set.add(q.year) })
    return Array.from(set).sort()
  }, [questions])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const [yearFilter, setYearFilter] = useState<YearFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const saved = loadProgress(difficulty)
    setCompleted(new Set(saved.completed))
    setCurrentIndex(saved.lastIndex)
    setSelectedAnswer(null)
    setFeedback(null)
    setSearchQuery('')
    setYearFilter('all')
    setStatusFilter('all')
    setShowPanel(false)
    setShowFilters(false)
  }, [difficulty])

  useEffect(() => {
    saveProgress(difficulty, Array.from(completed), currentIndex)
  }, [completed, currentIndex, difficulty])

  const filteredIndices = useMemo(() => {
    return questions.map((_, i) => i).filter(i => {
      const q = questions[i]
      if (yearFilter !== 'all' && q.year !== yearFilter) return false
      if (statusFilter === 'completed' && !completed.has(i)) return false
      if (statusFilter === 'uncompleted' && completed.has(i)) return false
      if (searchQuery.trim()) {
        if (!q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false
      }
      return true
    })
  }, [questions, yearFilter, statusFilter, searchQuery, completed])

  const posInFiltered = filteredIndices.indexOf(currentIndex)
  const currentQ = questions[currentIndex]

  function handleAnswer(option: string) {
    if (feedback) return
    setSelectedAnswer(option)
    const isCorrect = option === currentQ.answer
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) addPoints(POINTS[difficulty])
    setCompleted(prev => new Set(prev).add(currentIndex))
  }

  function goNext() {
    setSelectedAnswer(null); setFeedback(null)
    if (filteredIndices.length === 0) return
    const curPos = filteredIndices.indexOf(currentIndex)
    if (curPos >= 0 && curPos < filteredIndices.length - 1) setCurrentIndex(filteredIndices[curPos + 1])
    else setCurrentIndex(filteredIndices[0])
  }

  function goPrev() {
    setSelectedAnswer(null); setFeedback(null)
    if (filteredIndices.length === 0) return
    const curPos = filteredIndices.indexOf(currentIndex)
    if (curPos > 0) setCurrentIndex(filteredIndices[curPos - 1])
    else setCurrentIndex(filteredIndices[filteredIndices.length - 1])
  }

  function jumpTo(idx: number) {
    setCurrentIndex(idx); setSelectedAnswer(null); setFeedback(null); setShowPanel(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!currentQ) {
    return <div className="text-center text-slate-400 text-sm py-6">No questions available.</div>
  }

  const completedCount = completed.size
  const hasActiveFilters = yearFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== ''

  return (
    <div className="w-full space-y-2.5 sm:space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={() => router.push('/')}
          className="text-[10px] py-1 px-1.5 text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Home
        </button>
        <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">
          {completedCount}/{questions.length} · {difficulty}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowFilters(f => !f); setShowPanel(false) }}
            className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg border transition-colors"
            style={{
              borderColor: hasActiveFilters ? 'var(--accent-orange)' : 'rgba(63,63,70,0.6)',
              color: hasActiveFilters ? 'var(--accent-orange)' : '#a1a1aa',
              backgroundColor: hasActiveFilters ? 'rgba(249,115,22,0.08)' : 'transparent',
            }}
          >
            Filter{hasActiveFilters ? ' ●' : ''}
          </button>
          <button
            onClick={() => { setShowPanel(p => !p); setShowFilters(false) }}
            className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg border border-zinc-700/60 text-slate-400 hover:text-white transition-colors"
          >
            {showPanel ? '✕' : '#'}
          </button>
        </div>
      </div>

      {/* Collapsible filter bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 items-center pb-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 min-w-[80px] text-[10px] px-2 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-white placeholder-slate-600 outline-none focus:border-orange-500/50"
              />
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-[10px] px-1.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-slate-300 outline-none"
              >
                <option value="all">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="text-[10px] px-1.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-slate-300 outline-none"
              >
                <option value="all">All</option>
                <option value="completed">Done</option>
                <option value="uncompleted">Left</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearchQuery(''); setYearFilter('all'); setStatusFilter('all') }}
                  className="text-[9px] text-orange-400 hover:text-orange-300"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question selection panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-1.5 rounded-xl bg-zinc-800/40 border border-zinc-700/30 max-h-[160px] overflow-y-auto">
              {filteredIndices.map(idx => (
                <button
                  key={idx}
                  onClick={() => jumpTo(idx)}
                  className="text-[8px] sm:text-[9px] py-1 rounded-md font-mono transition-all min-h-[28px]"
                  style={{
                    backgroundColor: idx === currentIndex
                      ? 'var(--accent-orange)'
                      : completed.has(idx) ? 'rgba(34,197,94,0.15)' : 'rgba(39,39,42,0.6)',
                    color: idx === currentIndex
                      ? '#000'
                      : completed.has(idx) ? '#4ade80' : '#a1a1aa',
                    border: idx === currentIndex
                      ? 'none'
                      : completed.has(idx) ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(63,63,70,0.4)',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
              {filteredIndices.length === 0 && (
                <p className="col-span-full text-center text-[10px] text-slate-600 py-2">No match</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="space-y-2.5 sm:space-y-4"
        >
          {/* Badge row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50 text-slate-400">
              Q{currentIndex + 1}{currentQ.year ? ` · ${currentQ.year}` : ''}
            </span>
            {completed.has(currentIndex) && (
              <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                ✓
              </span>
            )}
          </div>

          {/* Question */}
          <p className="text-[13px] sm:text-base text-white leading-snug sm:leading-relaxed">{currentQ.question}</p>

          {/* Options */}
          <div className="grid gap-1.5 sm:gap-2">
            {currentQ.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              let bg = 'rgba(39,39,42,0.5)'
              let border = 'var(--border-subtle)'
              let textColor = '#e4e4e7'

              if (feedback) {
                if (opt === currentQ.answer) {
                  bg = 'rgba(34,197,94,0.12)'; border = 'rgba(34,197,94,0.5)'; textColor = '#4ade80'
                } else if (opt === selectedAnswer && feedback === 'wrong') {
                  bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.5)'; textColor = '#f87171'
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className="w-full text-left px-3 py-2 sm:py-2.5 rounded-xl text-[12px] sm:text-sm transition-all active:scale-[0.98] disabled:cursor-default min-h-[40px]"
                  style={{ backgroundColor: bg, border: `1.5px solid ${border}`, color: textColor }}
                >
                  <span className="font-semibold mr-1.5 opacity-50">{letter}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-2.5 py-2 sm:p-3 text-[11px] sm:text-xs leading-snug sm:leading-relaxed"
              style={{
                backgroundColor: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${feedback === 'correct' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: feedback === 'correct' ? '#86efac' : '#fca5a5',
              }}
            >
              <span className="font-semibold">{feedback === 'correct' ? '✓' : '✗'}</span>
              <span className="mx-1 opacity-30">|</span>
              {currentQ.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1 sm:pt-2">
        <button
          onClick={goPrev}
          className="text-[11px] px-3 py-2 rounded-xl border border-zinc-700/50 text-slate-400 hover:text-white hover:border-zinc-600 transition-all active:scale-[0.97] min-h-[36px]"
        >
          ← Prev
        </button>
        <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono">
          {posInFiltered >= 0 ? posInFiltered + 1 : '–'}/{filteredIndices.length}
        </span>
        <button
          onClick={goNext}
          className="text-[11px] px-3 py-2 rounded-xl border border-zinc-700/50 text-slate-400 hover:text-white hover:border-zinc-600 transition-all active:scale-[0.97] min-h-[36px]"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
