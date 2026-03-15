import { setCachedGames } from '@/lib/db'
import { fetchGamesByType } from '@/src/services/gameService'
import type { BackendGame } from '@/src/services/gameService'

const GAME_TYPES: BackendGame['game_type'][] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'mixed',
]

/**
 * Fetch all game types from the server and store in IndexedDB with a single timestamp.
 * Used when user presses Reload after session expiry. Returns the timestamp used.
 * Does not modify score or any progress; caller should clear cache and reset progress first.
 */
export async function fetchAndCacheAllGames(): Promise<number> {
  const now = Date.now()
  for (const gameType of GAME_TYPES) {
    const data = await fetchGamesByType(gameType)
    await setCachedGames(gameType, data.length ? data : [], now)
  }
  return now
}
