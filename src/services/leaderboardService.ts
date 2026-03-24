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

export const leaderboardApi = {
  submitScore: (data: {
    user_id: string
    username: string
    avatar_color: string
    score: number
    game_type: string
  }) => apiClient.post<LeaderboardEntry>('/leaderboard/submit-score', data),

  getGlobal: () => apiClient.get<LeaderboardEntry[]>('/leaderboard/global'),
  getDaily: () => apiClient.get<LeaderboardEntry[]>('/leaderboard/daily'),
  getWeekly: () => apiClient.get<LeaderboardEntry[]>('/leaderboard/weekly'),

  getUserRank: (userId: string) =>
    apiClient.get<UserRankInfo>(`/leaderboard/rank/${userId}`),
}
