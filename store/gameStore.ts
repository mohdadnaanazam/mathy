import { create } from 'zustand'
import { GameType, Difficulty } from '@/types'

interface GameState {
  gameType:    GameType
  score:       number
  gamesPlayed: number
  isLocked:    boolean
  difficulty:  Difficulty
  // Actions
  setGameType:   (type: GameType) => void
  setDifficulty: (d: Difficulty) => void
  addScore:      (pts: number) => void
  recordAttempt: () => void
  setLocked:     (locked: boolean) => void
  reset:         () => void
}

export const useGameStore = create<GameState>((set) => ({
  gameType:    'math',
  score:       0,
  gamesPlayed: 0,
  isLocked:    false,
  difficulty:  'medium',

  setGameType:   (gameType)   => set({ gameType }),
  setDifficulty: (difficulty) => set({ difficulty }),
  addScore:      (pts)        => set(s => ({ score: s.score + pts })),
  recordAttempt: ()           => set(s => ({ gamesPlayed: s.gamesPlayed + 1 })),
  setLocked:     (isLocked)   => set({ isLocked }),
  reset:         ()           => set({ score: 0, gamesPlayed: 0, isLocked: false }),
}))
