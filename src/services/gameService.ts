import { apiClient } from '../api/apiClient'

export type BackendGame = {
  id: string
  game_type: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed' | 'true_false_math'
  question: string
  correct_answer: number | string
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function fetchAllGames(): Promise<BackendGame[]> {
  return apiClient.get<BackendGame[]>('/games')
}

export async function fetchGamesByType(
  type: BackendGame['game_type'],
): Promise<BackendGame[]> {
  return apiClient.get<BackendGame[]>(`/games/${type}`)
}

