import Dexie from 'dexie'
import type { BackendGame } from '@/src/services/gameService'

const DB_NAME = 'mathy-games-db'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const TOTAL_QUESTIONS_PER_VARIANT = 20

export interface GameCacheEntry {
  gameType: string
  games: BackendGame[]
  lastFetchAt: number
}

export interface MetaEntry {
  key: string
  value: number
}

export interface MetaTextEntry {
  key: string
  value: string
}

class MathyDb extends Dexie {
  gameCache!: Dexie.Table<GameCacheEntry, string>
  meta!: Dexie.Table<MetaEntry, string>
  metaText!: Dexie.Table<MetaTextEntry, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      gameCache: 'gameType',
      meta: 'key',
    })
    this.version(2).stores({
      gameCache: 'gameType',
      meta: 'key',
      metaText: 'key',
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
/** Meta: when the current game session started (ms since epoch). */
const META_GAME_SESSION_STARTED_AT = 'gameSessionStartedAt'
/** MetaText: last played selections to hydrate home screen. */
const META_LAST_PLAYED_GAME_TYPE = 'lastPlayedGameType'
const META_LAST_PLAYED_OPERATION = 'lastPlayedOperation'
const META_LAST_PLAYED_DIFFICULTY = 'lastPlayedDifficulty'

export async function setLastLeftAt(timestamp: number): Promise<void> {
  await db.meta.put({ key: META_LAST_LEFT_AT, value: timestamp })
}

export async function getLastLeftAt(): Promise<number | null> {
  const row = await db.meta.get(META_LAST_LEFT_AT)
  return row?.value ?? null
}

/** Store when a game session started (used for 1h expiry UI). */
export async function setGameSessionStartedAt(timestamp: number): Promise<void> {
  await db.meta.put({ key: META_GAME_SESSION_STARTED_AT, value: timestamp })
}

export async function getGameSessionStartedAt(): Promise<number | null> {
  const row = await db.meta.get(META_GAME_SESSION_STARTED_AT)
  return row?.value ?? null
}

export async function clearGameSessionStartedAt(): Promise<void> {
  await db.meta.delete(META_GAME_SESSION_STARTED_AT)
}

export async function setLastPlayedSettings(settings: {
  gameType: string
  operation?: string | null
  difficulty?: string | null
}): Promise<void> {
  await db.metaText.put({ key: META_LAST_PLAYED_GAME_TYPE, value: settings.gameType })
  await db.metaText.put({ key: META_LAST_PLAYED_OPERATION, value: settings.operation ?? '' })
  await db.metaText.put({ key: META_LAST_PLAYED_DIFFICULTY, value: settings.difficulty ?? '' })
}

export async function getLastPlayedSettings(): Promise<{
  gameType: string | null
  operation: string | null
  difficulty: string | null
}> {
  const [gt, op, diff] = await Promise.all([
    db.metaText.get(META_LAST_PLAYED_GAME_TYPE),
    db.metaText.get(META_LAST_PLAYED_OPERATION),
    db.metaText.get(META_LAST_PLAYED_DIFFICULTY),
  ])
  return {
    gameType: gt?.value ?? null,
    operation: op?.value ? op.value : null,
    difficulty: diff?.value ? diff.value : null,
  }
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
  return row?.value ?? 10
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

/** Per-variant (operation + difficulty) progress: how many questions user has answered out of fixed total. */
function variantKey(operation: string, difficulty: string): string {
  return `played_${operation}_${difficulty}`
}

export async function getVariantPlayed(operation: string, difficulty: string): Promise<number> {
  const row = await db.meta.get(variantKey(operation, difficulty))
  return row?.value ?? 0
}

export async function setVariantPlayed(
  operation: string,
  difficulty: string,
  played: number,
): Promise<void> {
  await db.meta.put({ key: variantKey(operation, difficulty), value: played })
}

export async function incrementVariantPlayed(
  operation: string,
  difficulty: string,
): Promise<number> {
  const current = await getVariantPlayed(operation, difficulty)
  const next = Math.min(TOTAL_QUESTIONS_PER_VARIANT, current + 1)
  await setVariantPlayed(operation, difficulty, next)
  return next
}

// Add an arbitrary number of played questions for a variant (used when a full session finishes).
export async function addToVariantPlayed(
  operation: string,
  difficulty: string,
  delta: number,
): Promise<number> {
  if (delta <= 0) return getVariantPlayed(operation, difficulty)
  const current = await getVariantPlayed(operation, difficulty)
  const next = Math.min(TOTAL_QUESTIONS_PER_VARIANT, current + delta)
  await setVariantPlayed(operation, difficulty, next)
  return next
}

export async function getVariantProgress(
  operation: string,
  difficulty: string,
): Promise<{ played: number; total: number; remaining: number }> {
  const played = await getVariantPlayed(operation, difficulty)
  const total = TOTAL_QUESTIONS_PER_VARIANT
  const remaining = Math.max(0, total - played)
  return { played, total, remaining }
}

/** Memory session progress: same rules as math (max rounds, played, default 10). */
const META_MEMORY_SESSION_MAX = 'memorySessionMax'
const META_MEMORY_SESSION_PLAYED = 'memorySessionPlayed'

export async function getMemorySessionMax(): Promise<number> {
  const row = await db.meta.get(META_MEMORY_SESSION_MAX)
  return row?.value ?? 10
}

export async function getMemorySessionPlayed(): Promise<number> {
  const row = await db.meta.get(META_MEMORY_SESSION_PLAYED)
  return row?.value ?? 0
}

export async function setMemorySessionMax(max: number): Promise<void> {
  await db.meta.put({ key: META_MEMORY_SESSION_MAX, value: max })
}

export async function setMemorySessionPlayed(played: number): Promise<void> {
  await db.meta.put({ key: META_MEMORY_SESSION_PLAYED, value: played })
}

export async function incrementMemorySessionPlayed(): Promise<number> {
  const played = await getMemorySessionPlayed()
  const next = played + 1
  await setMemorySessionPlayed(next)
  return next
}

export async function resetMemorySession(max: number): Promise<void> {
  await setMemorySessionMax(max)
  await setMemorySessionPlayed(0)
}

/** Reset all progress: variant played counts, session counters. Leaves game cache intact. */
export async function resetAllProgress(): Promise<void> {
  const keys = await db.meta.toCollection().keys()
  const playedKeys = (keys as string[]).filter(k => k.startsWith('played_'))
  await Promise.all(playedKeys.map(k => db.meta.delete(k)))
  await setMathSessionMax(10)
  await setMathSessionPlayed(0)
  await setMemorySessionMax(10)
  await setMemorySessionPlayed(0)
  await setTrueFalseSessionMax(10)
  await setTrueFalseSessionPlayed(0)
  // Reset new game type sessions
  for (const gt of NEW_GAME_TYPES) {
    await resetGenericSession(gt, 10)
  }
  // Clear persisted game count so next session uses the default
  await db.meta.delete(META_SELECTED_GAME_COUNT)
}

/** Last activity timestamp: updated whenever the user starts or finishes a game session. */
const META_LAST_ACTIVITY_AT = 'lastActivityAt'

export async function getLastActivityAt(): Promise<number | null> {
  const row = await db.meta.get(META_LAST_ACTIVITY_AT)
  return row?.value ?? null
}

export async function setLastActivityAt(timestamp: number = Date.now()): Promise<void> {
  await db.meta.put({ key: META_LAST_ACTIVITY_AT, value: timestamp })
}

/** Persisted game count: the number the user last selected via the stepper (home or session-complete). */
const META_SELECTED_GAME_COUNT = 'selectedGameCount'

export async function getSelectedGameCount(): Promise<number | null> {
  const row = await db.meta.get(META_SELECTED_GAME_COUNT)
  return row?.value ?? null
}

export async function setSelectedGameCount(count: number): Promise<void> {
  await db.meta.put({ key: META_SELECTED_GAME_COUNT, value: count })
}

/** True/False Math session progress: same pattern as math and memory. */
const META_TF_SESSION_MAX = 'trueFalseSessionMax'
const META_TF_SESSION_PLAYED = 'trueFalseSessionPlayed'

export async function getTrueFalseSessionMax(): Promise<number> {
  const row = await db.meta.get(META_TF_SESSION_MAX)
  return row?.value ?? 10
}

export async function getTrueFalseSessionPlayed(): Promise<number> {
  const row = await db.meta.get(META_TF_SESSION_PLAYED)
  return row?.value ?? 0
}

export async function setTrueFalseSessionMax(max: number): Promise<void> {
  await db.meta.put({ key: META_TF_SESSION_MAX, value: max })
}

export async function setTrueFalseSessionPlayed(played: number): Promise<void> {
  await db.meta.put({ key: META_TF_SESSION_PLAYED, value: played })
}

export async function incrementTrueFalseSessionPlayed(): Promise<number> {
  const played = await getTrueFalseSessionPlayed()
  const next = played + 1
  await setTrueFalseSessionPlayed(next)
  return next
}

export async function resetTrueFalseSession(max: number): Promise<void> {
  await setTrueFalseSessionMax(max)
  await setTrueFalseSessionPlayed(0)
}

// ─── Generic session helpers for new game types ──────────────────────
// Avoids duplicating get/set/increment/reset for each new game type.
// Uses the same meta table with keys like "squareRoot_sessionMax".

function sessionKey(gameType: string, field: 'max' | 'played'): string {
  return `${gameType}_session${field === 'max' ? 'Max' : 'Played'}`
}

export async function getGenericSessionMax(gameType: string): Promise<number> {
  const row = await db.meta.get(sessionKey(gameType, 'max'))
  return row?.value ?? 10
}

export async function getGenericSessionPlayed(gameType: string): Promise<number> {
  const row = await db.meta.get(sessionKey(gameType, 'played'))
  return row?.value ?? 0
}

export async function setGenericSessionMax(gameType: string, max: number): Promise<void> {
  await db.meta.put({ key: sessionKey(gameType, 'max'), value: max })
}

export async function setGenericSessionPlayed(gameType: string, played: number): Promise<void> {
  await db.meta.put({ key: sessionKey(gameType, 'played'), value: played })
}

export async function incrementGenericSessionPlayed(gameType: string): Promise<number> {
  const played = await getGenericSessionPlayed(gameType)
  const next = played + 1
  await setGenericSessionPlayed(gameType, next)
  return next
}

export async function resetGenericSession(gameType: string, max: number): Promise<void> {
  await setGenericSessionMax(gameType, max)
  await setGenericSessionPlayed(gameType, 0)
}

/** All new game type identifiers for session reset. */
export const NEW_GAME_TYPES = [
  'square_root', 'fractions', 'percentage', 'algebra', 'speed_math', 'logic_puzzle', 'ssc_cgl', 'tictactoe',
] as const
