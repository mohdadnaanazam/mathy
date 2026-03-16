import { MathQuestion, Difficulty, OperationMode } from '@/types'

export function generateMathQuestion(
  difficulty: Difficulty,
  mode: OperationMode = 'mixture',
  customOps?: OperationMode[],
): MathQuestion {
  // Number ranges per difficulty
  const ranges: Record<Difficulty, { min: number; max: number }> = {
    easy:   { min: 1,  max: 10 },
    medium: { min: 10, max: 50 },
    hard:   { min: 50, max: 200 },
  }
  // Multiplication/division use smaller ranges to keep answers reasonable
  const mulRanges: Record<Difficulty, { min: number; max: number }> = {
    easy:   { min: 1,  max: 10 },
    medium: { min: 5,  max: 15 },
    hard:   { min: 10, max: 30 },
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

  const isMulDiv = op === '×' || op === '÷'
  const { min, max } = isMulDiv ? mulRanges[difficulty] : ranges[difficulty]

  let a: number
  let b: number

  if (op === '÷') {
    b = Math.floor(Math.random() * (max - min + 1)) + min
    const quotient = Math.floor(Math.random() * (max - min + 1)) + min
    a = b * quotient
  } else {
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
