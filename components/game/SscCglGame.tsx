'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useScore } from '@/hooks/useScore'
import { useUserUUID } from '@/hooks/useUserUUID'
import type { Difficulty } from '@/types'
import PlayWithFriendButton from './PlayWithFriendButton'

import easyData from '@/src/data/ssc-cgl/easy.json'
import mediumData from '@/src/data/ssc-cgl/medium.json'
import hardData from '@/src/data/ssc-cgl/hard.json'

interface SscQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
  year?: number
  difficulty: Difficulty
}

const ALL_QUESTIONS: SscQuestion[] = [
  ...(easyData as Omit<SscQuestion, 'difficulty'>[]).map(q => ({ ...q, difficulty: 'easy' as Difficulty })),
  ...(mediumData as Omit<SscQuestion, 'difficulty'>[]).map(q => ({ ...q, difficulty: 'medium' as Difficulty })),
  ...(hardData as Omit<SscQuestion, 'difficulty'>[]).map(q => ({ ...q, difficulty: 'hard' as Difficulty })),
]

const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 }
const LS_KEY = 'ssc_cgl_bank_progress'
const DIFF_COLORS: Record<Difficulty, string> = { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' }

interface SavedProgress { completed: number[]; lastIndex: number }

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.completed)) return { completed: p.completed, lastIndex: p.lastIndex ?? 0 } }
  } catch {}
  return { completed: [], lastIndex: 0 }
}

function saveProgress(completed: number[], lastIndex: number) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ completed, lastIndex })) } catch {}
}

type YearFilter = 'all' | number
type DifficultyFilter = 'all' | Difficulty
type StatusFilter = 'all' | 'completed' | 'uncompleted'
type View = 'list' | 'question'

export default function SscCglGame() {
  const router = useRouter()
  const { userUuid } = useUserUUID()
  const { addScore } = useScore(userUuid)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollPosRef = useRef(0)

  const years = useMemo(() => {
    const set = new Set<number>()
    ALL_QUESTIONS.forEach(q => { if (q.year) set.add(q.year) })
    return Array.from(set).sort()
  }, [])

  // View state
  const [view, setView] = useState<View>('list')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [yearFilter, setYearFilter] = useState<YearFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Hydrate
  useEffect(() => {
    const saved = loadProgress()
    setCompleted(new Set(saved.completed))
    setCurrentIndex(saved.lastIndex)
  }, [])

  // Persist
  useEffect(() => {
    saveProgress(Array.from(completed), currentIndex)
  }, [completed, currentIndex])

  // Filtered indices
  const filteredIndices = useMemo(() => {
    return ALL_QUESTIONS.map((_, i) => i).filter(i => {
      const q = ALL_QUESTIONS[i]
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
      if (yearFilter !== 'all' && q.year !== yearFilter) return false
      if (statusFilter === 'completed' && !completed.has(i)) return false
      if (statusFilter === 'uncompleted' && completed.has(i)) return false
      if (searchQuery.trim() && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [difficultyFilter, yearFilter, statusFilter, searchQuery, completed])

  const currentQ = ALL_QUESTIONS[currentIndex]
  const hasActiveFilters = difficultyFilter !== 'all' || yearFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== ''

  // Open question view
  const openQuestion = useCallback((idx: number) => {
    if (listRef.current) scrollPosRef.current = listRef.current.scrollTop
    setCurrentIndex(idx)
    setSelectedAnswer(null)
    setFeedback(null)
    setView('question')
  }, [])

  // Back to list, restore scroll
  const backToList = useCallback(() => {
    setView('list')
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = scrollPosRef.current
    })
  }, [])

  function handleAnswer(option: string) {
    if (feedback || !currentQ) return
    setSelectedAnswer(option)
    const isCorrect = option === currentQ.answer
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) addScore(POINTS[currentQ.difficulty])
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

  // Keyboard nav (only in question view)
  useEffect(() => {
    if (view !== 'question') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') backToList()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const completedCount = Array.from(completed).filter(i => filteredIndices.includes(i)).length

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'list') {
    return (
      <div className="w-full flex flex-col" style={{ minHeight: 0, maxHeight: 'calc(100dvh - 120px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2">
          <button onClick={() => router.push('/')} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors shrink-0">
            ← Home
          </button>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            {completedCount}/{filteredIndices.length} done
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 items-center pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 min-w-[100px] text-[11px] px-2.5 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-white placeholder-slate-600 outline-none focus:border-orange-500/50"
          />
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value as DifficultyFilter)}
            className="text-[10px] px-1.5 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-slate-300 outline-none"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-[10px] px-1.5 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-slate-300 outline-none"
          >
            <option value="all">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="text-[10px] px-1.5 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-slate-300 outline-none"
          >
            <option value="all">Status</option>
            <option value="completed">Done</option>
            <option value="uncompleted">Left</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); setYearFilter('all'); setStatusFilter('all') }}
              className="text-[9px] text-orange-400 hover:text-orange-300 shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Question list */}
        <div ref={listRef} className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1" style={{ scrollbarWidth: 'thin' }}>
          {filteredIndices.length === 0 ? (
            <p className="text-center text-[11px] text-slate-600 py-8">No questions match your filters.</p>
          ) : (
            filteredIndices.map(idx => {
              const q = ALL_QUESTIONS[idx]
              const isDone = completed.has(idx)
              const preview = q.question.length > 65 ? q.question.slice(0, 65) + '…' : q.question
              return (
                <button
                  key={idx}
                  onClick={() => openQuestion(idx)}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-start gap-2.5 group"
                  style={{
                    backgroundColor: idx === currentIndex ? 'rgba(249,115,22,0.06)' : 'rgba(39,39,42,0.3)',
                    border: idx === currentIndex ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(63,63,70,0.3)',
                  }}
                >
                  {/* Left: number + difficulty dot */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0 w-8">
                    <span className="text-[10px] font-mono font-semibold text-slate-400">Q{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DIFF_COLORS[q.difficulty] }} />
                  </div>
                  {/* Middle: question preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] sm:text-[13px] text-slate-200 leading-snug truncate group-hover:text-white transition-colors">
                      {preview}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {q.year && <span className="text-[9px] text-slate-600 font-mono">{q.year}</span>}
                      <span className="text-[9px] font-mono" style={{ color: DIFF_COLORS[q.difficulty], opacity: 0.7 }}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  {/* Right: status */}
                  <div className="shrink-0 pt-1">
                    {isDone ? (
                      <span className="text-[10px] text-green-400">✓</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full border border-zinc-600 block" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // QUESTION VIEW
  // ═══════════════════════════════════════════════════════════════
  if (!currentQ) {
    return <div className="text-center text-slate-400 text-sm py-6">No questions available.</div>
  }

  const diffLabel = currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full space-y-3 sm:space-y-4"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={backToList}
            className="text-[11px] py-1 px-2 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            Q{currentIndex + 1} · {diffLabel}
          </span>
          <div className="w-12" /> {/* spacer for alignment */}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-zinc-700/50 text-slate-400"
            style={{ backgroundColor: 'rgba(39,39,42,0.6)' }}
          >
            Q{currentIndex + 1}{currentQ.year ? ` · ${currentQ.year}` : ''}
          </span>
          <span
            className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: DIFF_COLORS[currentQ.difficulty] + '18', color: DIFF_COLORS[currentQ.difficulty], border: `1px solid ${DIFF_COLORS[currentQ.difficulty]}30` }}
          >
            {diffLabel}
          </span>
          {completed.has(currentIndex) && (
            <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              ✓ Done
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

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <button
            onClick={goPrev}
            className="text-[11px] px-3 py-2 rounded-xl border border-zinc-700/50 text-slate-400 hover:text-white hover:border-zinc-600 transition-all active:scale-[0.97] min-h-[36px]"
          >
            ← Prev
          </button>
          <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono">
            Q{currentIndex + 1}
          </span>
          <button
            onClick={goNext}
            className="text-[11px] px-3 py-2 rounded-xl border border-zinc-700/50 text-slate-400 hover:text-white hover:border-zinc-600 transition-all active:scale-[0.97] min-h-[36px]"
          >
            Next →
          </button>
        </div>

        {/* Play with Friend */}
        <div className="flex justify-center mt-2">
          <PlayWithFriendButton gameType="ssccgl" difficulty={currentQ.difficulty} />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
