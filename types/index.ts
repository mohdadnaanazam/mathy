// Shared TypeScript types for the AI Gaming Platform

export type GameType = 'math' | 'memory'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type OperationMode =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'mixture'
  | 'custom'

export interface MathQuestion {
  expression: string
  answer:     number
  options:    number[]
  operation:  string
}

export interface MemoryCard {
  id:      number
  emoji:   string
  pairId:  number
  flipped: boolean
  matched: boolean
}

export interface GameCardConfig {
  icon:        string
  title:       string
  description: string
  difficulty:  'Easy' | 'Medium' | 'Hard'
  timeLimit:   string
  type:        GameType
  tag:         string
}

export interface AttemptState {
  used:        number
  max:         number
  hourStart:   number
  timeToReset: number
  isLocked:    boolean
}

export interface GameState {
  gameType:    GameType
  score:       number
  gamesPlayed: number
  isLocked:    boolean
  difficulty:  Difficulty
  operation?:  OperationMode
}
