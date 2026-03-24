'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useScore } from '@/hooks/useScore'
import { useLeaderboardSubmit } from '@/hooks/useLeaderboardSubmit'
import UsernameModal from '@/components/ui/UsernameModal'
import {
  emptyBoard,
  checkWinner,
  getResult,
  getAiMove,
  getEmptyCells,
  POINTS,
  type Board,
  type Cell,
  type Result,
  type Difficulty,
} from '@/lib/tictactoe'

const DIFFICULTY_LABELS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const RESULT_TEXT: Record<'win' | 'draw' | 'lose', string> = {
  win: 'You win!',
  draw: "It's a draw!",
  lose: 'AI wins!',
}

const RESULT_COLOR: Record<'win' | 'draw' | 'lose', string> = {
  win: 'text-emerald-400',
  draw: 'text-amber-400',
  lose: 'text-rose-400',
}

// Hourly game limit
const LIMIT_KEY = 'ttt_games_played'
const LIMIT_HOUR_KEY = 'ttt_hour_start'
const MAX_GAMES_PER_HOUR = 20

function getHourlyUsage(): { count: number; hourStart: number } {
  const now = Date.now()
  const hourStart = parseInt(localStorage.getItem(LIMIT_HOUR_KEY) || '0')
  const count = parseInt(localStorage.getItem(LIMIT_KEY) || '0')
  if (now - hourStart > 3600000) {
    // Reset
    localStorage.setItem(LIMIT_HOUR_KEY, String(now))
    localStorage.setItem(LIMIT_KEY, '0')
    return { count: 0, hourStart: now }
  }
  return { count, hourStart }
}

function incrementHourlyUsage(): number {
  const { count } = getHourlyUsage()
  const next = count + 1
  localStorage.setItem(LIMIT_KEY, String(next))
  return next
}

export default function TicTacToeGame() {
  const router = useRouter()
  const { userUuid } = useUserUUID()
  const { score, addScore, syncNow } = useScore(userUuid)
  const { promptAndSubmit, needsUsername, submitWithUsername, dismiss } = useLeaderboardSubmit(userUuid)

  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [result, setResult] = useState<Result>(null)
  const [winLine, setWinLine] = useState<number[] | null>(null)
  const [gamesUsed, setGamesUsed] = useState(0)
  const [isLimited, setIsLimited] = useState(false)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate hourly usage
  useEffect(() => {
    const { count } = getHourlyUsage()
    setGamesUsed(count)
    setIsLimited(count >= MAX_GAMES_PER_HOUR)
  }, [])

  // AI move
  useEffect(() => {
    if (result || isPlayerTurn) return
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
        if (r) handleGameEnd(r)
      } else {
        setIsPlayerTurn(true)
      }
    }, 400)

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isPlayerTurn, result])

  const handleGameEnd = useCallback(async (r: 'win' | 'draw' | 'lose') => {
    const pts = POINTS[r]
    if (pts > 0) {
      await addScore(pts)
      syncNow()
    }
    const newCount = incrementHourlyUsage()
    setGamesUsed(newCount)
    setTotalGamesPlayed(prev => prev + 1)
    if (newCount >= MAX_GAMES_PER_HOUR) setIsLimited(true)

    // Leaderboard submission (silent)
    if (pts > 0) {
      promptAndSubmit(score + pts, 'tictactoe', difficulty)
    }
  }, [addScore, syncNow, promptAndSubmit, score, difficulty])

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || result || board[index] || isLimited) return
    const next = [...board]
    next[index] = 'X'
    setBoard(next)

    const { winner, line } = checkWinner(next)
    if (winner || next.every(c => c !== null)) {
      setWinLine(line)
      const r = getResult(next)
      setResult(r)
      if (r) handleGameEnd(r)
    } else {
      setIsPlayerTurn(false)
    }
  }

  const restart = () => {
    if (isLimited) return
    setBoard(emptyBoard())
    setIsPlayerTurn(true)
    setResult(null)
    setWinLine(null)
  }

  const changeDifficulty = (d: Difficulty) => {
    setDifficulty(d)
    setBoard(emptyBoard())
    setIsPlayerTurn(true)
    setResult(null)
    setWinLine(null)
  }

  return (
    <main
      className="min-h-screen bg-[var(--bg-surface)] overflow-x-hidden"
      style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}
    >
      {/* Username modal for leaderboard */}
      <UsernameModal open={needsUsername} onSubmit={submitWithUsername} onClose={dismiss} />

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-3 sm:py-5">
        <div className="mx-auto max-w-md px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">Tic Tac Toe</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Player (X) vs AI (O)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Score</p>
            <p className="text-lg font-bold text-white tabular-nums">{score}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-3 sm:px-6 py-4 space-y-4">
        {/* Difficulty selector */}
        <div className="flex gap-1 p-1 rounded-2xl bg-zinc-900/60 border border-[var(--border-subtle)]">
          {DIFFICULTY_LABELS.map(d => (
            <button
              key={d.value}
              onClick={() => changeDifficulty(d.value)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all ${
                difficulty === d.value
                  ? 'bg-[var(--accent-orange)] text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Game limit indicator */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>{gamesUsed}/{MAX_GAMES_PER_HOUR} games this hour</span>
          {!isPlayerTurn && !result && <span className="text-[var(--accent-orange)] animate-pulse">AI thinking…</span>}
        </div>

        {/* Limit reached */}
        {isLimited && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <p className="text-sm text-amber-400 font-semibold">Game limit reached</p>
            <p className="text-[11px] text-zinc-500 mt-1">You've played {MAX_GAMES_PER_HOUR} games this hour. Try again later.</p>
          </div>
        )}

        {/* Board */}
        {!isLimited && (
          <div className="flex justify-center">
            <div
              className="grid grid-cols-3 gap-2 w-full max-w-[280px] sm:max-w-[320px] aspect-square"
              role="grid"
              aria-label="Tic Tac Toe board"
            >
              {board.map((cell, i) => {
                const isWinCell = winLine?.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCellClick(i)}
                    disabled={!!cell || !!result || !isPlayerTurn}
                    className={`
                      aspect-square rounded-xl border text-2xl sm:text-3xl font-bold
                      flex items-center justify-center transition-all duration-200
                      ${!cell && !result && isPlayerTurn ? 'hover:border-zinc-600 hover:bg-zinc-800/60 cursor-pointer active:scale-95' : ''}
                      ${isWinCell ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/10' : 'border-[var(--border-subtle)] bg-zinc-900/40'}
                      ${cell || result ? 'cursor-default' : ''}
                      disabled:cursor-default
                    `}
                    aria-label={`Cell ${i + 1}: ${cell || 'empty'}`}
                  >
                    {cell === 'X' && (
                      <span className={`${isWinCell ? 'text-[var(--accent-orange)]' : 'text-white'} transition-all`}>✕</span>
                    )}
                    {cell === 'O' && (
                      <span className={`${isWinCell ? 'text-[var(--accent-orange)]' : 'text-zinc-400'} transition-all`}>○</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="text-center space-y-3">
            <p className={`text-lg font-bold ${RESULT_COLOR[result]}`}>
              {RESULT_TEXT[result]}
            </p>
            <p className="text-[11px] text-zinc-500">
              {POINTS[result] > 0 ? `+${POINTS[result]} points` : 'No points'}
            </p>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-orange)] px-5 py-2.5 text-xs font-semibold text-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw size={14} />
              Play Again
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-zinc-900/40 p-3 flex items-center justify-around text-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Games</p>
            <p className="text-sm font-bold text-white">{totalGamesPlayed}</p>
          </div>
          <div className="w-px h-8 bg-[var(--border-subtle)]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total Score</p>
            <p className="text-sm font-bold text-white">{score}</p>
          </div>
          <div className="w-px h-8 bg-[var(--border-subtle)]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Difficulty</p>
            <p className="text-sm font-bold text-[var(--accent-orange)] capitalize">{difficulty}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
