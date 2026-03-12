import { MathQuestion, Difficulty } from '@/types'

export function generateMathQuestion(difficulty: Difficulty): MathQuestion {
  const ranges: Record<Difficulty, number> = { easy: 10, medium: 50, hard: 100 }
  const max = ranges[difficulty]

  let a = Math.floor(Math.random() * max) + 1
  let b = Math.floor(Math.random() * max) + 1
  const ops = difficulty === 'easy' ? ['+', '-'] : ['+', '-', '×', '÷']
  const op  = ops[Math.floor(Math.random() * ops.length)]

  // Ensure clean division
  if (op === '÷') {
    b = Math.floor(Math.random() * 9) + 1
    a = b * (Math.floor(Math.random() * 12) + 1)
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
