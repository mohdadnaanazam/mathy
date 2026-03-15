import { create } from 'zustand'

interface GameRefreshState {
  /** Timestamp (ms) of last fetch from server; used for countdown. */
  lastFetchAt: number | null
  setLastFetchAt: (at: number | null) => void
}

export const useGameRefreshStore = create<GameRefreshState>((set) => ({
  lastFetchAt: null,
  setLastFetchAt: (lastFetchAt) => set({ lastFetchAt }),
}))
