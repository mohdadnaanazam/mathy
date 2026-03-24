'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import { useLeaderboardSubmit } from '@/hooks/useLeaderboardSubmit'
import UsernameModal from '@/components/ui/UsernameModal'
import ShareScoreButton from './ShareScoreButton'
import type { Difficulty } from '@/types'
import { difficultyLabel } from '@/lib/gameProgression'
import {
  getGenericSessionMax,
  getGenericSessionPlayed,
  incrementGenericSessionPlayed,
  incrementVariantPlayed,
  getVariantProgress,
  resetGenericSession,
  setSelectedGameCount,
  setLastPlayedSettings,
} from '@/lib/db'
import {
  emptyBoard,
  checkWinner,
  getResult,
  getAiMove,
  getEmptyCells,
  POINTS,
  type Board,
  type Result,
  type Difficulty as TttDifficulty,
} from '@/lib/tictactoe'

const GAME_TYPE = 'tictactoe'
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

export default function TicTacToeGame() {
  const router = useRouter()
  const difficulty = useGameStore(s => s.difficulty) as TttDifficulty
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const { userUuid, loading: userLoading } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { promptAndSubmit, needsUsername, submitWithUsername, dismiss } = useLeaderboardSubmit(userUuid)

  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  // Session state
  const [sessionMax, setSessionMax] = useState(10)
  const [sessionPlayed, setSessionPlayed] = useState(0)
  const [sessionHydrated, setSessionHydrated] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)

  // Next-session picker
  const [nextDifficulty, setNextDifficulty] = useState<Difficulty>(difficulty)
  const [nextVariantPlayed, setNextVariantPlayed] = useState(0)
  const [nextVariantRemaining, setNextVariantRemaining] = useState(20)
  const [nextGamesCount, setNextGamesCount] = useState(10)

  // Board state
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [result, setResult] = useState<Result>(null)
  const [winLine, setWinLine] = useState<number[] | null>(null)
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate session
  useEffect(() => {
    Promise.all([
      getGenericSessionMax(GAME_TYPE).then(setSessionMax),
      getGenericSessionPlayed(GAME_TYPE).then(setSessionPlayed),
    ]).then(() => setSessionHydrated(true))
  }, [])

  // Keep next difficulty in sync while playing
  useEffect(() => {
    if (!sessionComplete) setNextDifficulty(difficulty)
  }, [difficulty, sessionComplete])

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
    const currentDiff = difficultyRef.current as Difficulty
    if (!currentDiff) return

    // Submit to leaderboard
    promptAndSubmit(sessionScore, GAME_TYPE, currentDiff)

    const diffIdx = DIFFICULTY_ORDER.indexOf(currentDiff)
    const nextIdx = diffIdx === -1 ? 0 : (diffIdx + 1) % DIFFICULTY_ORDER.length
    const newDiff = DIFFICULTY_ORDER[nextIdx]
    setNextDifficulty(newDiff)
    getVariantProgress(GAME_TYPE, newDiff).then(p => {
      setNextVariantPlayed(p.played)
      setNextVariantRemaining(p.remaining)
      setNextGamesCount(prev => p.remaining <= 0 ? 0 : Math.min(Math.max(prev, 1), p.remaining))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionComplete])

  // AI move
  useEffect(() => {
    if (result || isPlayerTurn || sessionComplete) return
    if (getEmptyCells(board).length === 0) return

    aiTimeoutRef.current = setTimeout(() => {
      const move = getAiMove(board, difficulty)
      if (move === -1) return
      const next = [...board]
      next[move] = 'O'
      setBoard(next)

      const { winner, line } = checkWinner(next)
      if (winner || next.every(c => c !== null)) {
        setWinLine(line)
        const r = getResult(next)
        setResult(r)
        if (r) finishRound(r)
      } else {
        setIsPlayerTurn(true)
      }
    }, 400)

    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isPlayerTurn, result, sessionComplete])

  const finishRound = useCallback(async (r: 'win' | 'draw' | 'lose') => {
    const pts = POINTS[r]
    if (pts > 0) {
      await addScore(pts)
      syncNow()
    }
    setSessionScore(prev => prev + pts)

    const currentDiff = difficultyRef.current as Difficulty
    if (currentDiff) {
      await incrementVariantPlayed(GAME_TYPE, currentDiff)
    }

    const next = await incrementGenericSessionPlayed(GAME_TYPE)
    setSessionPlayed(next)

    // Auto-advance to next round or session complete after delay
    autoAdvanceRef.current = setTimeout(() => {
      if (next >= sessionMax) {
        setSessionComplete(true)
      } else {
        // Start new round
        setBoard(emptyBoard())
        setIsPlayerTurn(true)
        setResult(null)
        setWinLine(null)
      }
    }, 1800)
  }, [addScore, syncNow, sessionMax])

  useEffect(() => {
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current) }
  }, [])

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || result || board[index] || sessionComplete) return
    const next = [...board]
    next[index] = 'X'
    setBoard(next)

    const { winner, line } = checkWinner(next)
    if (winner || next.every(c => c !== null)) {
      setWinLine(line)
      const r = getResult(next)
      setResult(r)
      if (r) finishRound(r)
    } else {
      setIsPlayerTurn(false)
    }
  }

  const nextVariantExhausted = nextVariantRemaining <= 0

  // ── Loading ──
  if (userLoading || !sessionHydrated) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-[0.16em]">Loading…</p>
      </div>
    )
  }

  // ── Session Complete ──
  if (sessionComplete) {
    return (
      <div className="w-full flex flex-col items-center mx-auto gap-4 sm:gap-5">
        <UsernameModal open={needsUsername} onSubmit={submitWithUsername} onClose={dismiss} />

        <div className="api-game-item w-full flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
            Tic Tac Toe
          </span>
        </div>

        <div className="api-game-item w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 sm:px-6 sm:py-8 space-y-5">
          <div className="text-center space-y-2">
            <p className="section-label justify-center text-xs text-slate-400">Session complete</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{sessionScore}</p>
            <p className="text-xs text-slate-500">points earned this session</p>
            <p className="text-xs sm:text-sm text-[var(--accent-orange)]">
              Next up: {difficultyLabel(nextDifficulty)}
            </p>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2">
            <p className="section-label text-xs text-slate-400">Choose difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map(d => {
                const active = nextDifficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNextDifficulty(d)}
                    className="rounded-xl px-3 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
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

          {/* Game count */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-3">
            <div className="flex flex-col gap-1">
              <span className="section-label text-xs">Number of games</span>
              <span className="text-[11px] font-mono text-slate-500">
                {nextVariantPlayed} / 20 played · {nextVariantRemaining} remaining
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { if (!nextVariantExhausted) setNextGamesCount(v => Math.max(1, Math.min(v - 1, nextVariantRemaining))) }}
                disabled={nextVariantExhausted}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
              >−</button>
              <div className="min-w-[2.5rem] text-center font-mono text-base text-white font-semibold">{nextGamesCount}</div>
              <button
                type="button"
                onClick={() => { if (!nextVariantExhausted) setNextGamesCount(v => Math.min(Math.max(v + 1, 1), nextVariantRemaining)) }}
                disabled={nextVariantExhausted}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm text-slate-200 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-40"
              >+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={nextVariantExhausted || nextGamesCount <= 0}
              onClick={async () => {
                if (nextVariantExhausted || nextGamesCount <= 0) return
                await resetGenericSession(GAME_TYPE, nextGamesCount)
                await setSelectedGameCount(nextGamesCount)
                await setLastPlayedSettings({ gameType: GAME_TYPE, difficulty: nextDifficulty })
                setDifficulty(nextDifficulty)
                setSessionMax(nextGamesCount)
                setSessionPlayed(0)
                setSessionComplete(false)
                setSessionScore(0)
                setBoard(emptyBoard())
                setIsPlayerTurn(true)
                setResult(null)
                setWinLine(null)
              }}
              className="w-full sm:w-auto rounded-full border border-[var(--accent-orange-hover)] bg-[var(--accent-orange)] px-8 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              Play game
            </button>
            <ShareScoreButton score={score} gameType="Tic Tac Toe" difficulty={difficultyLabel(difficulty)} />
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
    )
  }

  // ── Active Gameplay ──
  const currentRound = Math.min(sessionPlayed + 1, sessionMax)

  return (
    <div className="w-full flex flex-col items-center mx-auto gap-3 sm:gap-4">
      {/* Title */}
      <div className="api-game-item w-full flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[var(--accent-orange)]">
          Tic Tac Toe
        </span>
      </div>

      {/* Round + Score row */}
      <div className="api-game-item w-full flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center gap-2">
          <span className="section-label text-slate-400 text-xs">
            Round {currentRound} / {sessionMax}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 capitalize">{difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="section-label text-slate-400 text-xs">Session</span>
          <span className="text-xs font-semibold text-[var(--accent-orange)]">{sessionScore}</span>
          <span className="text-zinc-600">·</span>
          <span className="section-label text-slate-400 text-xs">Total</span>
          <span className="text-xs sm:text-sm font-semibold text-white">{score}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="min-h-[36px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={`result-${result}`}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border px-6 py-2 text-sm sm:text-base font-bold text-center"
              style={{
                color: result === 'win' ? '#22c55e' : result === 'draw' ? '#fbbf24' : '#f87171',
                borderColor: result === 'win' ? 'rgba(34,197,94,0.4)' : result === 'draw' ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)',
                background: result === 'win' ? 'rgba(34,197,94,0.12)' : result === 'draw' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
              }}
            >
              {result === 'win' ? '✓ You win! +10' : result === 'draw' ? '— Draw +5' : '✗ AI wins'}
            </motion.div>
          ) : (
            <motion.p
              key={`turn-${isPlayerTurn}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="section-label text-slate-400 text-xs"
            >
              {isPlayerTurn ? 'Your turn — tap a cell' : 'AI is thinking…'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Board */}
      <div className="flex justify-center w-full">
        <div
          className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-[260px] sm:max-w-[300px]"
          role="grid"
          aria-label="Tic Tac Toe board"
        >
          {board.map((cell, i) => {
            const isWinCell = winLine?.includes(i)
            const canClick = !cell && !result && isPlayerTurn
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => handleCellClick(i)}
                disabled={!canClick}
                whileTap={canClick ? { scale: 0.92 } : undefined}
                className={`
                  aspect-square rounded-xl border-2 text-2xl sm:text-3xl font-bold
                  flex items-center justify-center transition-all duration-200
                  ${canClick ? 'hover:border-zinc-500 hover:bg-zinc-800/80 cursor-pointer' : 'cursor-default'}
                  ${isWinCell
                    ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/15 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                    : 'border-zinc-700/60 bg-zinc-900/60'}
                `}
                style={{ boxShadow: isWinCell ? undefined : '0 2px 8px rgba(0,0,0,0.3)' }}
                aria-label={`Cell ${i + 1}: ${cell || 'empty'}`}
              >
                <AnimatePresence mode="wait">
                  {cell && (
                    <motion.span
                      key={`${i}-${cell}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={
                        cell === 'X'
                          ? isWinCell ? 'text-[var(--accent-orange)]' : 'text-white'
                          : isWinCell ? 'text-[var(--accent-orange)]' : 'text-zinc-400'
                      }
                    >
                      {cell === 'X' ? '✕' : '○'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="text-white text-sm">✕</span> You</span>
        <span className="flex items-center gap-1"><span className="text-zinc-400 text-sm">○</span> AI</span>
        <span>Win +10 · Draw +5</span>
      </div>
    </div>
  )
}
