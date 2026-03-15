import Dexie from 'dexie'
import type { BackendGame } from '@/src/services/gameService'

const DB_NAME = 'mathy-games-db'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export interface GameCacheEntry {
  gameType: string
  games: BackendGame[]
  lastFetchAt: number
}

export interface MetaEntry {
  key: string
  value: number
}

class MathyDb extends Dexie {
  gameCache!: Dexie.Table<GameCacheEntry, string>
  meta!: Dexie.Table<MetaEntry, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      gameCache: 'gameType',
      meta: 'key',
    })
  }
}

export const db = new MathyDb()

export async function getCachedGames(gameType: string): Promise<BackendGame[] | null> {
  const entry = await db.gameCache.get(gameType)
  if (!entry?.games?.length) return null
  return entry.games
}

export async function getLastFetchAt(gameType: string): Promise<number | null> {
  const entry = await db.gameCache.get(gameType)
  return entry?.lastFetchAt ?? null
}

/** Returns global last fetch time (max across any type) for countdown. */
export async function getGlobalLastFetchAt(): Promise<number | null> {
  const entries = await db.gameCache.toArray()
  if (entries.length === 0) return null
  const max = Math.max(...entries.map(e => e.lastFetchAt))
  return max
}

export async function setCachedGames(
  gameType: string,
  games: BackendGame[],
  lastFetchAt: number = Date.now(),
): Promise<void> {
  await db.gameCache.put({ gameType, games, lastFetchAt })
}

export async function isCacheFresh(gameType: string): Promise<boolean> {
  const at = await getLastFetchAt(gameType)
  if (at == null) return false
  return Date.now() - at < CACHE_TTL_MS
}

export const CACHE_TTL_MS_EXPORT = CACHE_TTL_MS

/** Meta: last time user left the tab (for inactive detection). */
const META_LAST_LEFT_AT = 'lastLeftAt'

export async function setLastLeftAt(timestamp: number): Promise<void> {
  await db.meta.put({ key: META_LAST_LEFT_AT, value: timestamp })
}

export async function getLastLeftAt(): Promise<number | null> {
  const row = await db.meta.get(META_LAST_LEFT_AT)
  return row?.value ?? null
}

export function getCacheTtlMs(): number {
  return CACHE_TTL_MS
}

/** Clear all game cache so next load will fetch from server. */
export async function clearGameCache(): Promise<void> {
  await db.gameCache.clear()
}

/** Math session progress: max games per session and how many played (persists across reloads). */
const META_MATH_SESSION_MAX = 'mathSessionMax'
const META_MATH_SESSION_PLAYED = 'mathSessionPlayed'

export async function getMathSessionMax(): Promise<number> {
  const row = await db.meta.get(META_MATH_SESSION_MAX)
  return row?.value ?? 20
}

export async function getMathSessionPlayed(): Promise<number> {
  const row = await db.meta.get(META_MATH_SESSION_PLAYED)
  return row?.value ?? 0
}

export async function setMathSessionMax(max: number): Promise<void> {
  await db.meta.put({ key: META_MATH_SESSION_MAX, value: max })
}

export async function setMathSessionPlayed(played: number): Promise<void> {
  await db.meta.put({ key: META_MATH_SESSION_PLAYED, value: played })
}

/** Increment played count by 1; returns new value. */
export async function incrementMathSessionPlayed(): Promise<number> {
  const played = await getMathSessionPlayed()
  const next = played + 1
  await setMathSessionPlayed(next)
  return next
}

/** Reset session: set max and played to 0 (call when starting a new session with new max). */
export async function resetMathSession(max: number): Promise<void> {
  await setMathSessionMax(max)
  await setMathSessionPlayed(0)
}
