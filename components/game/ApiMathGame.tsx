// test commit

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
  getSelectedGameCount,
  setSelectedGameCount,
  setLastPlayedSettings,
} from '@/lib/db'
import { getNextGameConfig, operationLabel, difficultyLabel } from '@/lib/gameProgression'
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown'
import RefreshBanner from '@/components/ui/RefreshBanner'
import ShareScoreButton from './ShareScoreButton'
import { useLeaderboardSubmit } from '@/hooks/useLeaderboardSubmit'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'
import ConfettiOverlay from './ConfettiOverlay'
import AutoShareModal from './AutoShareModal'

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

export default function ApiMathGame({
  onFirstGameComplete,
}: {
  onFirstGameComplete?: () => void
  onPerfectScore?: (gameLabel: string) => void
} = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeOperation = useGameStore(s => s.operation)
  const setOperation = useGameStore(s => s.setOperation)
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const customOperations = useGameStore(s => s.customOperations)
  const toggleCustomOp = useGameStore(s => s.toggleCustomOp)
  const setCustomOperations = useGameStore(s => s.setCustomOperations)
  const opFromUrl = operationFromUrl(searchParams.get('op'))
  const operation = opFromUrl ?? storeOperation
  const { recordAttempt: recordHourlyAttempt } = useAttempts()
  const { games, loading, error, refresh } = useGameLoader(operation)

  // Refs to always hold the latest operation and difficulty so that
  // async callbacks (goNext via setTimeout, progression useEffect)
  // never read stale closure values.
  const operationRef = useRef(operation)
  operationRef.current = operation
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  useEffect(() => {
    if (opFromUrl) setOperation(opFromUrl)
  }, [opFromUrl, setOperation])
  useGameTimer()
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { promptAndSubmit, lastSubmitStatus } = useLeaderboardSubmit(userUuid)
  const { isFirstTime, hydrated: firstTimeHydrated, markPlayed } = useFirstTimeUser()
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAutoShare, setShowAutoShare] = useState(false)

  const [sessionMax, setSessionMax] = useState<number>(20)
  const [sessionPlayed, setSessionPlayed] = useState<number>(0)
  const [sessionHydrated, setSessionHydrated] = useState(false)
  const [questionOrder, setQuestionOrder] = useState<number[]>([])
  const sessionDone = sessionPlayed >= sessionMax
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timerKey, setTimerKey] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  // Incremented when a new session starts to force effectiveGames to reshuffle
  const [shuffleKey, setShuffleKey] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0) // tracks correct answers for achievement
  const sessionCorrectRef = useRef(0)
  // Keep ref in sync
  useEffect(() => { sessionCorrectRef.current = sessionCorrect }, [sessionCorrect])
  const pointsPerCorrect = POINTS_BY_DIFFICULTY[difficulty as Difficulty] ?? 10
  const { formatted: refreshFormatted, tier: refreshTier, isReady: refreshReady } = useRefreshCountdown()

  // Next-session picker state (used on the Session Complete screen)
  const [nextOperation, setNextOperation] = useState<OperationMode>(operation)
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty | null>(
    (difficulty as Difficulty) ?? null,
  )
  const [nextCustomOperations, setNextCustomOperations] = useState<OperationMode[]>(customOperations)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(sessionMax)

  const toggleNextCustomOp = useCallback((op: OperationMode) => {
    setNextCustomOperations(prev =>
      prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op],
    )
  }, [])

  // Hydrate nextGamesCount from persisted selection on mount
  useEffect(() => {
    getSelectedGameCount().then(saved => {
      if (saved != null && saved > 0) setNextGamesCount(saved)
    })
  }, [])

  useEffect(() => {
    Promise.all([
      getMathSessionMax().then(setSessionMax),
      getMathSessionPlayed().then(setSessionPlayed),
    ]).then(() => setSessionHydrated(true))
  }, [])

  // Keep the next-session operation in sync with the current one,
  // but only while the session is still in progress. Once the session
  // completes, the progression logic takes over and we must not
  // overwrite its selection.
  useEffect(() => {
    if (!sessionComplete) {
      setNextOperation(operation)
    }
  }, [operation, sessionComplete])

  // Load per-variant progress for the "next session" picker
  useEffect(() => {
    if (!nextDifficulty) return
    getVariantProgress(nextOperation, nextDifficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      // Clamp to remaining without replacing the user's chosen count
      setNextGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  }, [nextOperation, nextDifficulty])

  // When a session completes, auto-advance to the next operation/difficulty
  // in the progression sequence. Shows the user what's next while still
  // allowing them to manually override from the picker.
  useEffect(() => {
    if (!sessionComplete) return
    const currentOp = operationRef.current
    const currentDiff = difficultyRef.current as Difficulty
    if (!currentDiff) return

    // Submit score to leaderboard (async, silent failure)
    promptAndSubmit(score, currentOp)

    // Notify parent that first game has been completed (for signup banner)
    onFirstGameComplete?.()

    // First-time user: trigger confetti → auto-share flow
    if (isFirstTime && firstTimeHydrated) {
      setShowConfetti(true)
    }

    const next = getNextGameConfig(currentOp, currentDiff)
    setNextOperation(next.operation)
    setNextDifficulty(next.difficulty)

    getVariantProgress(next.operation, next.difficulty).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => {
        if (p.remaining <= 0) return 0
        return Math.min(Math.max(prev, 1), p.remaining)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionComplete])

  // Check for perfect score achievement when session completes
  useEffect(() => {
    if (!sessionComplete) return
    if (sessionCorrectRef.current >= sessionMax && sessionMax >= 20) {
      const currentOp = operationRef.current
      const currentDiff = difficultyRef.current as Difficulty
      const label = `${operationLabel(currentOp)} ${difficultyLabel(currentDiff)}`
      onPerfectScore?.(label)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionComplete])

  // Auto-retry: if we have no current question but aren't loading, trigger a refresh.
  const hasTriedRefresh = useRef(false)
  useEffect(() => {
    if (!loading && !error && games.length === 0 && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true
      refresh()
    }
  }, [loading, error, games.length, refresh])

  // Compute the pool of questions for this session once per
  // (games, operation, difficulty, customOperations, sessionMax) change.
  // This avoids reshuffling on every render (e.g. every timer tick),
  // which previously caused the visible question to jump.
  //
  // IMPORTANT: We use a stable reference for the games array to avoid
  // recomputing when the background refresh replaces the array with
  // equivalent data. Only update the ref when the actual game IDs change.
  const gamesRef = useRef(games)
  const prevGameIds = useRef<string>('')
  const currentGameIds = useMemo(
    () => games.map(g => g.id).sort().join(','),
    [games],
  )
  if (currentGameIds !== prevGameIds.current) {
    prevGameIds.current = currentGameIds
    gamesRef.current = games
  }

  const effectiveGames = useMemo(() => {
    const source = gamesRef.current
    const gamesForDifficulty = source.filter((g: BackendGame) => {
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
      // mixture (and any fallback) — only include standard math operations,
      // never true/false questions.
      return g.game_type !== 'true_false_math'
    })

    // De-duplicate questions so the same prompt (e.g. "20 + 10 = ?") only appears once per batch.
    // Don't slice here — for custom/mixture modes the pool contains multiple
    // operation types and a naive slice from the front would only grab one type.
    // The questionOrder effect shuffles indices and sessionMax limits how many
    // questions the user actually plays.
    return Array.from(
      new Map(gamesForDifficulty.map(g => [g.question, g])).values(),
    )
  }, [currentGameIds, difficulty, operation, customOperations, sessionMax])

  // Build question order only when the effective pool actually changes
  // (new game IDs) or when we explicitly request a reshuffle via shuffleKey.
  // This prevents the flicker caused by background refreshes producing a
  // new effectiveGames array reference with the same underlying data.
  const effectiveGameIds = useMemo(
    () => effectiveGames.map(g => g.id).join(','),
    [effectiveGames],
  )

  useEffect(() => {
    if (!sessionHydrated) return

    const len = effectiveGames.length
    if (len === 0) {
      setQuestionOrder([])
      setCurrentIndex(0)
      setAnswer('')
      setFeedback(null)
      return
    }
    // Build indices for the full pool, shuffle, then take at most sessionMax.
    // This ensures custom/mixture modes draw from all operation types evenly
    // rather than slicing from the front (which would favour one type).
    const indices = Array.from({ length: len }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setQuestionOrder(indices.slice(0, Math.max(1, sessionMax)))
    setCurrentIndex(0)
    setAnswer('')
    setFeedback(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGameIds, sessionHydrated, shuffleKey])

  const current =
    questionOrder.length && currentIndex < questionOrder.length
      ? effectiveGames[questionOrder[currentIndex]]
      : undefined

  // Reset game state when operation changes mid-session (not on mount).
  const prevOperationRef = useRef(operation)
  useEffect(() => {
    if (prevOperationRef.current !== operation) {
      prevOperationRef.current = operation
      setCurrentIndex(0)
      setAnswer('')
      setFeedback(null)
    }
  }, [operation])



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
  }, [currentIndex, effectiveGames])

  const goNext = useCallback(() => {
    setAnswer('')
    setFeedback(null)
    setTimerKey(k => k + 1)

    // Read latest values from refs to avoid stale closures
    // (goNext can be called from setTimeout inside validateAnswer).
    const currentOp = operationRef.current
    const currentDiff = difficultyRef.current as Difficulty

    // Update persisted session count up to the configured max
    getMathSessionPlayed().then(played => {
      const willBe = Math.min(sessionMax, played + 1)

      // Track per-variant progress one question at a time and
      // immediately refresh the played / remaining counters so
      // the game UI stays in sync with the home screen.
      // IMPORTANT: Do NOT call setNextOperation here — when this is
      // the last question, the progression useEffect is the sole
      // authority for choosing the next operation/difficulty.
      if (currentDiff) {
        const isLastQuestion = willBe >= sessionMax
        incrementVariantPlayed(currentOp, currentDiff).then(() => {
          // Only update the "next session" counters for non-last questions.
          // On the last question, the progression effect will set the next
          // operation/difficulty, and the variant progress effect will load
          // the correct played/remaining for that new combo. Updating here
          // on the last question would overwrite those values with the OLD
          // variant's data (e.g. 20/20 played, 0 remaining for easy) and
          // cause the Play button to appear disabled.
          if (!isLastQuestion) {
            getVariantProgress(currentOp, currentDiff).then(p => {
              setNextOperation(currentOp)
              setNextVariantPlayed(p.played)
              setNextVariantRemaining(p.remaining)
            })
          }
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
        setSessionCorrect(c => c + 1)
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

  if (loading || !sessionHydrated) {
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
      <div className="w-full flex flex-col items-center mx-auto gap-5 sm:gap-6">

        {/* First-time user: confetti → auto-share */}
        {showConfetti && (
          <ConfettiOverlay
            onComplete={() => {
              setShowConfetti(false)
              setShowAutoShare(true)
              markPlayed()
            }}
          />
        )}
        {showAutoShare && (
          <AutoShareModal
            score={score}
            gameType={operationLabel(operation)}
            difficulty={difficultyLabel(difficulty as Difficulty)}
            onClose={() => setShowAutoShare(false)}
          />
        )}

        <div className="api-game-item w-full flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
            Math Game
          </span>
        </div>

        <div className="api-game-item w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Completion copy */}
          <div className="text-center space-y-2">
            <p className="section-label justify-center text-xs text-slate-400">
              Session complete
            </p>
            <p className="text-base sm:text-lg text-slate-200 font-medium">
              You finished this set of questions for {operationLabel(operation)}.
            </p>
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">
              Next up: {operationLabel(nextOperation)} → {difficultyLabel(nextDifficulty as Difficulty)}
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Or choose a different game below.
            </p>
            {/* Debug: leaderboard sync status */}
            {lastSubmitStatus && (
              <p className="text-[10px] font-mono text-zinc-500 mt-1">
                Leaderboard: {lastSubmitStatus}
              </p>
            )}
          </div>

          {/* Next game picker */}
          <div className="space-y-5">
            {/* Operation selector */}
            <div className="space-y-2.5">
              <p className="section-label text-xs text-slate-400">
                Choose operation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VALID_OPS.map(op => {
                  const active = nextOperation === op
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setNextOperation(op)}
                      className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                      style={{
                        backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                        borderRadius: 12,
                        border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        color: active ? 'var(--accent-orange)' : '#d1d5db',
                      }}
                    >
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom operation toggles — shown when Custom is selected */}
            {nextOperation === 'custom' && (
              <div className="space-y-2.5">
                <p className="section-label text-xs text-slate-400">
                  Include operations
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: '+', value: 'addition' as OperationMode },
                    { label: '−', value: 'subtraction' as OperationMode },
                    { label: '×', value: 'multiplication' as OperationMode },
                    { label: '÷', value: 'division' as OperationMode },
                  ]).map(({ label, value }) => {
                    const on = customOperations.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleCustomOp(value)}
                        className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                        style={{
                          backgroundColor: on ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                          border: on ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                          color: on ? 'var(--accent-orange)' : '#a1a1aa',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Difficulty selector */}
            <div className="space-y-2.5">
              <p className="section-label text-xs text-slate-400">
                Choose difficulty
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                  const active = nextDifficulty === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNextDifficulty(d)}
                      className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all duration-150 hover:border-zinc-600 active:scale-[0.97]"
                      style={{
                        backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                        borderRadius: 12,
                        border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        color: active ? 'var(--accent-orange)' : '#d1d5db',
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
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-1">
                  <span className="section-label text-xs">Number of games</span>
                  <span className="text-xs text-slate-400">
                    Max 20 per type and level.
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
                  </span>
                  {nextVariantRemaining <= 0 && (
                    <span className="text-[11px] font-mono text-amber-400">
                      {refreshReady
                        ? '🎉 New games available! Go home and tap Reload.'
                        : `Next games unlock in ${refreshFormatted}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (nextVariantRemaining <= 0) return
                      setNextGamesCount(v => Math.max(1, Math.min((v || 1) - 1, nextVariantRemaining)))
                    }}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                    disabled={nextVariantRemaining <= 0}
                  >
                    −
                  </button>
                  <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">
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
                    className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
                    disabled={nextVariantRemaining <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Refresh countdown banner */}
            {nextVariantRemaining <= 0 && (
              <RefreshBanner tier={refreshTier} formatted={refreshFormatted} />
            )}

            {/* Primary: Play next game; Secondary: Share, Go home */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
                  await setSelectedGameCount(nextGamesCount)
                  await setLastPlayedSettings({
                    gameType: 'math',
                    operation: nextOperation,
                    difficulty: nextDifficulty,
                  })
                  setOperation(nextOperation)
                  setDifficulty(nextDifficulty)
                  // Update the URL so opFromUrl reflects the new operation.
                  // Without this, the derived `operation` (opFromUrl ?? storeOperation)
                  // would still return the old URL param, causing the progression
                  // logic to read stale values on the next session completion.
                  router.replace(`/game?op=${nextOperation}`, { scroll: false })
                  setSessionMax(nextGamesCount)
                  setSessionPlayed(0)
                  setSessionComplete(false)
                  setSessionCorrect(0)
                  setShuffleKey(k => k + 1)
                  setCurrentIndex(0)
                  setAnswer('')
                  setFeedback(null)
                  setTimerKey(k => k + 1)
                }}
                className="w-full sm:w-auto rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-8 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                Play game
              </button>

              <ShareScoreButton
                score={score}
                gameType={operationLabel(operation)}
                difficulty={difficultyLabel(difficulty as Difficulty)}
              />

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98]"
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
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-xs sm:text-sm text-slate-400">Loading questions…</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center mx-auto gap-4 sm:gap-5">
      {/* Section title: Math Game */}
      <div className="api-game-item w-full flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Math Game
        </span>
      </div>

      {/* Timer + Score row */}
      <div className="api-game-item w-full flex items-center justify-between gap-3">
        <Timer key={timerKey} seconds={90} onTimeUp={handleTimeUp} type="math" />
        <div className="flex items-center gap-2.5">
          <span className="section-label text-slate-400 text-xs">
            Total
          </span>
          <span className="text-sm sm:text-base font-semibold text-white tabular-nums">
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
          className="api-game-item relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center px-4 py-5 sm:px-6 sm:py-8"
          style={{
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <span className="text-[10px] sm:text-xs font-mono text-slate-500">
              {Math.min(currentIndex + 1, sessionMax)} / {sessionMax}
            </span>
            <span
              className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400"
            >
              {current.game_type}
            </span>
          </div>
          <p className="section-label justify-center mb-3 sm:mb-4 text-slate-400 text-xs">
            Calculate the result
          </p>
          <div className="text-[clamp(28px,7vw,56px)] font-bold leading-tight text-white">
            {current.question}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Typed answer input + keypad */}
      <div className="api-game-item w-full space-y-3">
        <div className="text-center font-mono uppercase text-[10px] sm:text-xs tracking-widest text-slate-500">
          Type your answer
        </div>
        <input
          value={answer}
          readOnly
          placeholder="Enter answer"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-center font-mono text-base sm:text-lg text-zinc-200 focus:outline-none"
        />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => (key === '⌫' ? handleBackspace() : handleDigit(key))}
              className="rounded-xl bg-zinc-900/80 border border-zinc-800 py-3 sm:py-3.5 text-center text-base sm:text-lg font-semibold text-zinc-100 transition-colors hover:bg-zinc-800 active:bg-zinc-700 min-h-[48px] sm:min-h-[52px]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
            className="rounded-full border px-5 py-2 text-sm font-semibold"
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

