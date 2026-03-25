/**
 * User Identity Service
 * Zero-input onboarding: auto-generates UUID, username, and DiceBear avatar.
 * Persists in localStorage. Syncs to backend on creation.
 * Never regenerates on refresh — identity is permanent.
 */

import { apiClient } from '@/src/api/apiClient'

// ─── Types ───────────────────────────────────────────────────────────

export interface UserIdentity {
  userId: string
  username: string
  avatar: string
}

// ─── Storage Keys ────────────────────────────────────────────────────

const STORAGE_KEY = 'mathy_user_identity'

// ─── Avatar ──────────────────────────────────────────────────────────

export function getDiceBearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`
}

// ─── Local Storage ───────────────────────────────────────────────────

export function getStoredIdentity(): UserIdentity | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.userId && parsed?.username && parsed?.avatar) return parsed
    return null
  } catch { return null }
}

export function setStoredIdentity(identity: UserIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
}

// ─── UUID Generation ─────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  const hex = () => Math.floor(Math.random() * 16).toString(16)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
    c === 'x' ? hex() : ((parseInt(hex(), 16) & 0x3) | 0x8).toString(16),
  )
}

// ─── Username Generation ─────────────────────────────────────────────

async function fetchRandomUsername(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://randomuser.me/api/?nat=us,gb&inc=name', {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    const name = data?.results?.[0]?.name
    if (name?.first) {
      const first = name.first.replace(/[^a-zA-Z]/g, '')
      const lastInitial = name.last ? name.last.charAt(0).toUpperCase() : ''
      return `${first}${lastInitial}`
    }
    return null
  } catch {
    return null
  }
}

function generateFallbackUsername(userId: string): string {
  return `Player${userId.slice(0, 4).toUpperCase()}`
}

// ─── DB Check ────────────────────────────────────────────────────────

export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    const res = await apiClient.post<{ ok: boolean; exists: boolean }>(
      '/users/check',
      { user_id: userId },
    )
    return res.exists === true
  } catch {
    return false // network failure — assume not exists, will sync later
  }
}

// ─── DB Create ───────────────────────────────────────────────────────

async function createUserInDB(identity: UserIdentity): Promise<void> {
  try {
    await apiClient.post('/users', {
      user_id: identity.userId,
      username: identity.username,
      avatar: identity.avatar,
    })
  } catch {
    // Network failure — user created locally, will sync on next load
    console.warn('[UserIdentity] Failed to sync user to DB, will retry later')
  }
}

// ─── Main Entry Point ────────────────────────────────────────────────

/**
 * Get or create user identity. Zero input required.
 * 1. Check localStorage for existing identity
 * 2. If exists → sync to DB (in case it was only local) → return
 * 3. If not → generate UUID, check DB uniqueness (max 3 retries),
 *    generate username (random API with fallback), generate DiceBear avatar,
 *    save locally, sync to DB → return
 */
export async function getOrCreateUser(): Promise<UserIdentity> {
  // 1. Check local storage
  const stored = getStoredIdentity()
  if (stored) {
    // Ensure synced to DB (fire-and-forget)
    createUserInDB(stored).catch(() => {})
    return stored
  }

  // 2. Generate new identity with UUID collision retry
  let userId = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    userId = generateUUID()
    const exists = await checkUserExists(userId)
    if (!exists) break
    console.warn(`[UserIdentity] UUID collision on attempt ${attempt + 1}, retrying`)
    if (attempt === 2) {
      // Extremely unlikely — just use it anyway
      console.warn('[UserIdentity] Max retries reached, using last generated UUID')
    }
  }

  // 3. Generate username (try random API, fallback to local)
  const randomName = await fetchRandomUsername()
  const username = randomName || generateFallbackUsername(userId)

  // 4. Generate DiceBear avatar
  const avatar = getDiceBearAvatar(userId)

  const identity: UserIdentity = { userId, username, avatar }

  // 5. Save locally
  setStoredIdentity(identity)

  // 6. Sync to DB
  await createUserInDB(identity)

  console.log('[UserIdentity] New user created:', identity.userId, identity.username)
  return identity
}
