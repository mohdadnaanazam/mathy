import { API_BASE_URL } from '@/src/api/apiClient'

export interface BackendHealth {
  api: boolean
  db: boolean
  gamesCount?: number
  error?: string
}

/**
 * Verify backend and Supabase connectivity. Call from frontend to ensure
 * API and DB are reachable and games table is available.
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const healthRes = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
    if (!healthRes.ok) {
      return { api: false, db: false, error: `API ${healthRes.status}` }
    }

    const dbRes = await fetch(`${API_BASE_URL}/health/db`, { cache: 'no-store' })
    const dbOk = dbRes.ok
    let gamesCount: number | undefined
    if (dbOk) {
      try {
        const data = await dbRes.json()
        gamesCount = data.gamesCount
      } catch {
        // ignore
      }
    }

    return {
      api: true,
      db: dbOk,
      gamesCount,
      error: dbOk ? undefined : 'DB unreachable or not configured',
    }
  } catch (e) {
    return {
      api: false,
      db: false,
      error: e instanceof Error ? e.message : 'Backend unreachable',
    }
  }
}
