import { create } from 'zustand'
import { GameType, Difficulty, OperationMode } from '@/types'

interface GameState {
  gameType:        GameType
  score:           number
  gamesPlayed:     number
  isLocked:        boolean
  difficulty:      Difficulty
  operation:       OperationMode
  customOperations: OperationMode[]  // which ops to use when operation === 'custom'
image.png  setGameType:     (type: GameType) => void
  setDifficulty:   (d: Difficulty) => void
  setOperation:    (o: OperationMode) => void
  setCustomOperations: (ops: OperationMode[]) => void
  toggleCustomOp:  (op: OperationMode) => void
  addScore:        (pts: number) => void
  recordAttempt:   () => void
  setLocked:       (locked: boolean) => void
  reset:           () => void
}

export const useGameStore = create<GameState>((set) => ({
  gameType:         'math',
  score:            0,
  gamesPlayed:      0,
  isLocked:         false,
  difficulty:       'medium',
  operation:        'mixture',
  customOperations: ['addition', 'multiplication'],

  setGameType:         (gameType)   => set({ gameType }),
  setDifficulty:      (difficulty) => set({ difficulty }),
  setOperation:       (operation)  => set({ operation }),
  setCustomOperations: (customOperations) => set({ customOperations }),
  toggleCustomOp:      (op) => set(s => {
    if (op === 'mixture' || op === 'custom') return s
    const next = s.customOperations.includes(op)
      ? s.customOperations.filter(o => o !== op)
      : [...s.customOperations, op]
    return { customOperations: next.length ? next : ['addition'] }
  }),
  addScore:      (pts)        => set(s => ({ score: s.score + pts })),
  recordAttempt: ()           => set(s => ({ gamesPlayed: s.gamesPlayed + 1 })),
  setLocked:     (isLocked)   => set({ isLocked }),
  reset:         ()           => set({ score: 0, gamesPlayed: 0, isLocked: false }),
}))
