import { MathQuestion, Difficulty, OperationMode } from '@/types'

export function generateMathQuestion(
  difficulty: Difficulty,
  mode: OperationMode = 'mixture',
  customOps?: OperationMode[],
): MathQuestion {
  // Digit-count-based ranges:
  // Easy:   1–2 digits (1–99)
  // Medium: 2–3 digits (10–999)
  // Hard:   3–5 digits (100–99999)
  const ranges: Record<Difficulty, { min: number; max: number }> = {
    easy:   { min: 1,   max: 99 },
    medium: { min: 10,  max: 999 },
    hard:   { min: 100, max: 99999 },
  }

  // Multiplication scaling by digit count:
  // Easy:   1–2 digit × 1 digit
  // Medium: 2 digit × 2 digit
  // Hard:   3 digit × 2 digit
  type MulRange = { aMin: number; aMax: number; bMin: number; bMax: number }
  const mulRanges: Record<Difficulty, MulRange> = {
    easy:   { aMin: 1,   aMax: 99,  bMin: 2, bMax: 9 },
    medium: { aMin: 10,  aMax: 99,  bMin: 10, bMax: 99 },
    hard:   { aMin: 100, aMax: 999, bMin: 10, bMax: 99 },
  }

  let ops: string[]
  if (mode === 'custom' && customOps?.length) {
    const opMap: Record<string, string> = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' }
    ops = customOps.map(o => opMap[o]).filter(Boolean)
  } else {
    switch (mode) {
      case 'addition':
        ops = ['+']
        break
      case 'subtraction':
        ops = ['-']
        break
      case 'multiplication':
        ops = ['×']
        break
      case 'division':
        ops = ['÷']
        break
      case 'mixture':
      case 'custom':
      default:
        ops = difficulty === 'easy' ? ['+', '-'] : ['+', '-', '×', '÷']
        break
    }
  }

  const op = ops[Math.floor(Math.random() * ops.length)]

  let a: number
  let b: number

  if (op === '×' || op === '÷') {
    const mr = mulRanges[difficulty]
    if (op === '÷') {
      // Clean integer division: dividend = divisor × quotient
      b = Math.floor(Math.random() * (mr.bMax - mr.bMin + 1)) + mr.bMin
      const quotient = Math.floor(Math.random() * (mr.bMax - mr.bMin + 1)) + mr.bMin
      a = b * quotient
    } else {
      a = Math.floor(Math.random() * (mr.aMax - mr.aMin + 1)) + mr.aMin
      b = Math.floor(Math.random() * (mr.bMax - mr.bMin + 1)) + mr.bMin
    }
  } else {
    const { min, max } = ranges[difficulty]
    a = Math.floor(Math.random() * (max - min + 1)) + min
    b = Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Ensure subtraction stays positive
  if (op === '-' && b > a) { [a, b] = [b, a] }

  const answer =
    op === '+' ? a + b :
    op === '-' ? a - b :
    op === '×' ? a * b : a / b

  // Generate 3 distinct wrong options close to the answer
  const offsets = [-4, -3, -2, -1, 1, 2, 3, 4]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(o => answer + o)
    .filter(v => v !== answer && v > 0)

  // Ensure we always have 3 wrong options
  while (offsets.length < 3) {
    const o = Math.floor(Math.random() * 10) + 1
    const candidate = answer + (Math.random() > 0.5 ? o : -o)
    if (!offsets.includes(candidate) && candidate !== answer && candidate > 0) {
      offsets.push(candidate)
    }
  }

  const options = [...offsets.slice(0, 3), answer].sort(() => Math.random() - 0.5)

  return { expression: `${a} ${op} ${b}`, answer, options, operation: op }
}
