import { MemoryCard } from '@/types'

const EMOJI_POOL = [
  '⚡','🎯','🚀','💎','🔥','🧠','🌙','⭐',
  '🎮','🏆','🌊','🎲','🦋','🎸','🎪','🔮',
]

export function generateMemoryCards(pairs = 8): MemoryCard[] {
  const emojis  = EMOJI_POOL.slice(0, pairs)
  const doubled = [...emojis, ...emojis]
  const shuffled = doubled.sort(() => Math.random() - 0.5)
  return shuffled.map((emoji, i) => ({
    id:      i,
    emoji,
    pairId:  emojis.indexOf(emoji),
    flipped: false,
    matched: false,
  }))
}
