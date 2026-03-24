import { apiClient } from '@/src/api/apiClient'

export interface LeaderboardEntry {
  id: string
  user_id: string
  username: string
  avatar_color: string
  score: number
  game_type: string
  created_at: string
  rank: number
}

export interface UserRankInfo {
  rank: number | null
  bestScore: number
  totalGames: number
}

export type GameFilter = 'all' | 'math' | 'memory' | 'true_false_math' | 'tictactoe'

export const leaderboardApi = {
  submitScore: (data: {
    user_id: string
    username: string
    avatar_color: string
    score: number
    game_type: string
  }) => apiClient.post<LeaderboardEntry>('/leaderboard/submit-score', data),

  getGlobal: (gameType?: GameFilter) => {
    const q = gameType && gameType !== 'all' ? `?game_type=${gameType}` : ''
    return apiClient.get<LeaderboardEntry[]>(`/leaderboard/global${q}`)
  },

  getDaily: (gameType?: GameFilter) => {
    const q = gameType && gameType !== 'all' ? `?game_type=${gameType}` : ''
    return apiClient.get<LeaderboardEntry[]>(`/leaderboard/daily${q}`)
  },

  getWeekly: (gameType?: GameFilter) => {
    const q = gameType && gameType !== 'all' ? `?game_type=${gameType}` : ''
    return apiClient.get<LeaderboardEntry[]>(`/leaderboard/weekly${q}`)
  },

  getUserRank: (userId: string) =>
    apiClient.get<UserRankInfo>(`/leaderboard/rank/${userId}`),
}
