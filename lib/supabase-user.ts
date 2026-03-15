import { apiClient } from '@/src/api/apiClient'

/**
 * Ensure a user row exists in Supabase (safe create).
 * Backend checks by UUID; if exists reuses, else inserts.
 */
export async function ensureUserInSupabase(userId: string): Promise<void> {
  await apiClient.post('/users', { user_id: userId })
}

/**
 * Update user score and last_sync in Supabase.
 */
export async function syncScoreToSupabase(userId: string, score: number): Promise<void> {
  await apiClient.patch(`/users/${userId}`, { score })
}
