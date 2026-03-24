// ─── Tic Tac Toe AI & Game Logic ─────────────────────────────────────
// Pure functions — no React, no side effects.
// Supports dynamic grid sizes (3×3, 4×4, 5×5) with configurable win lengths.

export type Cell = 'X' | 'O' | null
export type Board = Cell[]
export type Result = 'win' | 'lose' | 'draw' | null
export type TttDifficulty = 'easy' | 'medium' | 'hard'

// ─── Mode Config ─────────────────────────────────────────────────────

export interface ModeConfig {
  grid: number
  win: number
  label: string
}

export const MODES: Record<TttDifficulty, ModeConfig> = {
  easy:   { grid: 3, win: 3, label: 'Easy' },
  medium: { grid: 4, win: 3, label: 'Medium' },
  hard:   { grid: 5, win: 4, label: 'Hard' },
}

export function emptyBoard(size: number): Board {
  return Array(size * size).fill(null)
}

// ─── Dynamic Win Detection ───────────────────────────────────────────

/** Direction vectors: [dRow, dCol] */
const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal
  [1, -1],  // anti-diagonal
]

/**
 * Check if placing at (row, col) creates a win of `winLen` for `player`.
 * Returns the winning cell indices or null.
 */
export function checkWinAt(
  board: Board, gridSize: number, row: number, col: number,
  player: Cell, winLen: number,
): number[] | null {
  if (!player) return null
  for (const [dr, dc] of DIRECTIONS) {
    const cells: number[] = []
    // Walk backward to find the start of the line
    let r = row - dr * (winLen - 1)
    let c = col - dc * (winLen - 1)
    // Slide a window of winLen along this direction
    for (let start = 0; start < winLen * 2 - 1; start++) {
      const sr = r + dr * start
      const sc = c + dc * start
      // Collect winLen consecutive cells
      const line: number[] = []
      let valid = true
      for (let k = 0; k < winLen; k++) {
        const cr = sr + dr * k
        const cc = sc + dc * k
        if (cr < 0 || cr >= gridSize || cc < 0 || cc >= gridSize) { valid = false; break }
        const idx = cr * gridSize + cc
        if (board[idx] !== player) { valid = false; break }
        line.push(idx)
      }
      if (valid && line.length === winLen) return line
    }
  }
  return null
}

/** Scan entire board for any winner. Returns winner + winning line indices. */
export function checkWinner(board: Board, gridSize: number, winLen: number): { winner: Cell; line: number[] | null } {
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) continue
    const row = Math.floor(i / gridSize)
    const col = i % gridSize
    const line = checkWinAt(board, gridSize, row, col, board[i], winLen)
    if (line) return { winner: board[i], line }
  }
  return { winner: null, line: null }
}

export function isDraw(board: Board, gridSize: number, winLen: number): boolean {
  return !checkWinner(board, gridSize, winLen).winner && board.every(c => c !== null)
}

export function getResult(board: Board, gridSize: number, winLen: number): Result {
  const { winner } = checkWinner(board, gridSize, winLen)
  if (winner === 'X') return 'win'
  if (winner === 'O') return 'lose'
  if (isDraw(board, gridSize, winLen)) return 'draw'
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

function findWinningMove(board: Board, player: Cell, gridSize: number, winLen: number): number | null {
  for (const i of getEmptyCells(board)) {
    const copy = [...board]
    copy[i] = player
    if (checkWinner(copy, gridSize, winLen).winner === player) return i
  }
  return null
}

function mediumMove(board: Board, gridSize: number, winLen: number): number {
  // Try to win
  const win = findWinningMove(board, 'O', gridSize, winLen)
  if (win !== null) return win
  // Block player
  const block = findWinningMove(board, 'X', gridSize, winLen)
  if (block !== null) return block
  // Take center
  const center = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2)
  if (board[center] === null) return center
  // Random
  return randomMove(board)
}

/**
 * Minimax with alpha-beta pruning and depth limit.
 * Depth limit prevents exponential blowup on 4×4 and 5×5 grids.
 */
function minimax(
  board: Board, gridSize: number, winLen: number,
  isMaximizing: boolean, depth: number, maxDepth: number,
  alpha: number, beta: number,
): number {
  const { winner } = checkWinner(board, gridSize, winLen)
  if (winner === 'O') return 100 - depth
  if (winner === 'X') return depth - 100
  if (board.every(c => c !== null) || depth >= maxDepth) return 0

  const empty = getEmptyCells(board)
  if (isMaximizing) {
    let best = -Infinity
    for (const i of empty) {
      board[i] = 'O'
      best = Math.max(best, minimax(board, gridSize, winLen, false, depth + 1, maxDepth, alpha, beta))
      board[i] = null
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const i of empty) {
      board[i] = 'X'
      best = Math.min(best, minimax(board, gridSize, winLen, true, depth + 1, maxDepth, alpha, beta))
      board[i] = null
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

function hardMove(board: Board, gridSize: number, winLen: number): number {
  // First check immediate win/block (fast path)
  const win = findWinningMove(board, 'O', gridSize, winLen)
  if (win !== null) return win
  const block = findWinningMove(board, 'X', gridSize, winLen)
  if (block !== null) return block

  // Depth limit scales with grid size to keep AI responsive
  const maxDepth = gridSize <= 3 ? 9 : gridSize <= 4 ? 6 : 4

  let bestScore = -Infinity
  let bestMove = -1
  for (const i of getEmptyCells(board)) {
    board[i] = 'O'
    const score = minimax(board, gridSize, winLen, false, 0, maxDepth, -Infinity, Infinity)
    board[i] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = i
    }
  }
  return bestMove === -1 ? randomMove(board) : bestMove
}

export function getAiMove(board: Board, difficulty: TttDifficulty): number {
  const { grid, win } = MODES[difficulty]
  if (difficulty === 'easy') return randomMove(board)
  if (difficulty === 'medium') return mediumMove(board, grid, win)
  return hardMove(board, grid, win)
}

// ─── Scoring ─────────────────────────────────────────────────────────

export const POINTS: Record<'win' | 'draw' | 'lose', number> = {
  win: 10,
  draw: 5,
  lose: 0,
}
