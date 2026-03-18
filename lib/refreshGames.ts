import { setCachedGames } from '@/lib/db'
import { fetchGamesByType } from '@/src/services/gameService'
import type { BackendGame } from '@/src/services/gameService'

const GAME_TYPES: BackendGame['game_type'][] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'mixed',
  'true_false_math',
  'square_root',
  'fractions',
  'percentage',
  'algebra',
  'speed_math',
  'logic_puzzle',
]

/** Per-request timeout (ms). Prevents a single slow/hung request from blocking forever. */
const FETCH_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

/**
 * Fetch all game types from the server and store in IndexedDB with a single timestamp.
 * Used when user presses Reload after session expiry. Returns the timestamp used.
 * Does not modify score or any progress; caller should clear cache and reset progress first.
 *
 * Fetches all types in parallel with a per-request timeout so a single slow endpoint
 * cannot block the entire reload indefinitely.
 */
export async function fetchAndCacheAllGames(): Promise<number> {
  const now = Date.now()
  const results = await Promise.allSettled(
    GAME_TYPES.map(async (gameType) => {
      const data = await withTimeout(fetchGamesByType(gameType), FETCH_TIMEOUT_MS)
      await setCachedGames(gameType, data.length ? data : [], now)
    }),
  )
  // If every single fetch failed, propagate the error so callers know nothing was cached.
  const allFailed = results.every(r => r.status === 'rejected')
  if (allFailed) {
    const first = results[0] as PromiseRejectedResult
    throw first.reason instanceof Error ? first.reason : new Error(String(first.reason))
  }
  return now
}
