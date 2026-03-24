// ─── Tic Tac Toe AI & Game Logic ─────────────────────────────────────
// Pure functions — no React, no side effects.

export type Cell = 'X' | 'O' | null
export type Board = Cell[]
export type Result = 'win' | 'lose' | 'draw' | null
export type Difficulty = 'easy' | 'medium' | 'hard'

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
]

export function emptyBoard(): Board {
  return Array(9).fill(null)
}

export function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return { winner: null, line: null }
}

export function isDraw(board: Board): boolean {
  return !checkWinner(board).winner && board.every(c => c !== null)
}

export function getResult(board: Board): Result {
  const { winner } = checkWinner(board)
  if (winner === 'X') return 'win'
  if (winner === 'O') return 'lose'
  if (isDraw(board)) return 'draw'
  return null
}

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, c, i) => (c === null ? [...acc, i] : acc), [])
}

// ─── AI Moves ────────────────────────────────────────────────────────

function randomMove(board: Board): number {
  const empty = getEmptyCells(board)
  return empty[Math.floor(Math.random() * empty.length)]
}

function findWinningMove(board: Board, player: Cell): number | null {
  for (const i of getEmptyCells(board)) {
    const copy = [...board]
    copy[i] = player
    if (checkWinner(copy).winner === player) return i
  }
  return null
}

function mediumMove(board: Board): number {
  // Try to win
  const win = findWinningMove(board, 'O')
  if (win !== null) return win
  // Block player
  const block = findWinningMove(board, 'X')
  if (block !== null) return block
  // Take center
  if (board[4] === null) return 4
  // Random
  return randomMove(board)
}

function minimax(board: Board, isMaximizing: boolean, depth: number): number {
  const { winner } = checkWinner(board)
  if (winner === 'O') return 10 - depth
  if (winner === 'X') return depth - 10
  if (board.every(c => c !== null)) return 0

  const empty = getEmptyCells(board)
  if (isMaximizing) {
    let best = -Infinity
    for (const i of empty) {
      board[i] = 'O'
      best = Math.max(best, minimax(board, false, depth + 1))
      board[i] = null
    }
    return best
  } else {
    let best = Infinity
    for (const i of empty) {
      board[i] = 'X'
      best = Math.min(best, minimax(board, true, depth + 1))
      board[i] = null
    }
    return best
  }
}

function hardMove(board: Board): number {
  let bestScore = -Infinity
  let bestMove = -1
  for (const i of getEmptyCells(board)) {
    board[i] = 'O'
    const score = minimax(board, false, 0)
    board[i] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = i
    }
  }
  return bestMove
}

export function getAiMove(board: Board, difficulty: Difficulty): number {
  if (difficulty === 'easy') return randomMove(board)
  if (difficulty === 'medium') return mediumMove(board)
  return hardMove(board)
}

// ─── Scoring ─────────────────────────────────────────────────────────

export const POINTS: Record<'win' | 'draw' | 'lose', number> = {
  win: 10,
  draw: 5,
  lose: 0,
}
