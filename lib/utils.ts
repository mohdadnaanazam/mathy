export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatTime(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function formatScore(score: number): string {
  return score.toLocaleString()
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}
