import { useState, useCallback } from 'react'
import { generateMemoryCards } from '@/lib/memoryGenerator'
import { MemoryCard } from '@/types'

export function useMemoryGame(pairs = 8) {
  const [cards,   setCards]   = useState<MemoryCard[]>(() => generateMemoryCards(pairs))
  const [selected, setSelected] = useState<number[]>([])
  const [matched,  setMatched]  = useState<number[]>([])
  const [moves,    setMoves]    = useState(0)
  const [locked,   setLocked]   = useState(false)

  const flipCard = useCallback((id: number) => {
    if (locked || selected.length === 2 || selected.includes(id)) return
    const isAlreadyMatched = cards.find(c => c.id === id)
    if (isAlreadyMatched?.matched) return

    const next = [...selected, id]
    setSelected(next)

    if (next.length === 2) {
      setLocked(true)
      setMoves(m => m + 1)
      const cardA = cards.find(c => c.id === next[0])!
      const cardB = cards.find(c => c.id === next[1])!

      if (cardA.pairId === cardB.pairId) {
        setMatched(m => [...m, cardA.pairId])
        setCards(prev =>
          prev.map(c => c.pairId === cardA.pairId ? { ...c, matched: true } : c)
        )
        setSelected([])
        setLocked(false)
      } else {
        setTimeout(() => {
          setSelected([])
          setLocked(false)
        }, 1000)
      }
    }
  }, [locked, selected, cards])

  const reset = useCallback(() => {
    setCards(generateMemoryCards(pairs))
    setSelected([])
    setMatched([])
    setMoves(0)
    setLocked(false)
  }, [pairs])

  const isComplete = matched.length === pairs

  return { cards, selected, matched, moves, flipCard, reset, isComplete, locked }
}
