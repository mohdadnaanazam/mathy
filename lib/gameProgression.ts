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

export { OPERATIONS_ORDER, DIFFICULTY_ORDER }
