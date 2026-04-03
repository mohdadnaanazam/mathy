import type { OperationMode, Difficulty } from '@/types'

const OPERATIONS_ORDER: OperationMode[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'mixture',
  'custom',
]

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

/** Ordered list of "More Games" operations for progression. */
const MORE_GAMES_ORDER: string[] = [
  'square_root',
  'fractions',
  'percentage',
  'algebra',
  'speed_math',
  'logic_puzzle',
  'speed_sort',
]

const MORE_GAME_LABELS: Record<string, string> = {
  square_root: 'Square Root',
  fractions: 'Fractions',
  percentage: 'Percentages',
  algebra: 'Algebra',
  speed_math: 'Speed Math',
  logic_puzzle: 'Logic Grid',
  ssc_cgl: 'SSC CGL Math',
  speed_sort: 'Speed Sort',
}

export interface NextGameConfig {
  operation: OperationMode
  difficulty: Difficulty
}

/**
 * Given the current operation + difficulty, return the next slot in the
 * sequential progression: easy → medium → hard → next operation → easy …
 *
 * Progression order: Addition → Subtraction → Multiplication → Division → Mixture → Custom
 * After Custom → Hard, wraps back to Addition → Easy.
 */
export function getNextGameConfig(
  currentOperation: OperationMode,
  currentDifficulty: Difficulty,
): NextGameConfig {
  const opIdx = OPERATIONS_ORDER.indexOf(currentOperation)
  const diffIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty)

  // If current op/diff isn't in our ordered lists, default to next in sequence
  if (opIdx === -1 || diffIdx === -1) {
    return { operation: 'addition', difficulty: 'easy' }
  }

  const totalSlots = OPERATIONS_ORDER.length * DIFFICULTY_ORDER.length
  const currentSlot = opIdx * DIFFICULTY_ORDER.length + diffIdx
  const nextSlot = (currentSlot + 1) % totalSlots
  const nextOpIdx = Math.floor(nextSlot / DIFFICULTY_ORDER.length)
  const nextDiffIdx = nextSlot % DIFFICULTY_ORDER.length

  return {
    operation: OPERATIONS_ORDER[nextOpIdx],
    difficulty: DIFFICULTY_ORDER[nextDiffIdx],
  }
}

/** Human-readable label for an operation */
export function operationLabel(op: OperationMode): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

/** Human-readable label for a difficulty */
export function difficultyLabel(d: Difficulty): string {
  return d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'
}

export { OPERATIONS_ORDER, DIFFICULTY_ORDER, MORE_GAMES_ORDER, MORE_GAME_LABELS }

/**
 * Progression for "More Games": easy → medium → hard → next game → easy …
 * After the last game (logic_puzzle hard), wraps to square_root easy.
 */
export function getNextMoreGameConfig(
  currentGame: string,
  currentDifficulty: Difficulty,
): { game: string; difficulty: Difficulty } {
  const gameIdx = MORE_GAMES_ORDER.indexOf(currentGame)
  const diffIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty)

  if (gameIdx === -1 || diffIdx === -1) {
    return { game: MORE_GAMES_ORDER[0], difficulty: 'easy' }
  }

  const totalSlots = MORE_GAMES_ORDER.length * DIFFICULTY_ORDER.length
  const currentSlot = gameIdx * DIFFICULTY_ORDER.length + diffIdx
  const nextSlot = (currentSlot + 1) % totalSlots
  const nextGameIdx = Math.floor(nextSlot / DIFFICULTY_ORDER.length)
  const nextDiffIdx = nextSlot % DIFFICULTY_ORDER.length

  return {
    game: MORE_GAMES_ORDER[nextGameIdx],
    difficulty: DIFFICULTY_ORDER[nextDiffIdx],
  }
}

/** Human-readable label for a "more game" type */
export function moreGameLabel(game: string): string {
  return MORE_GAME_LABELS[game] ?? game.charAt(0).toUpperCase() + game.slice(1).replace(/_/g, ' ')
}
