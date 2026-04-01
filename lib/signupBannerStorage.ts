/**
 * signupBannerStorage.ts
 *
 * Thin persistence layer for the signup-banner feature.
 * Primary: IndexedDB (via Dexie).  Fallback: localStorage.
 *
 * Keys
 * ──────────────────────────────────────────────────────────
 *  hasPlayedFirstGame   boolean   – set true after 1st completed game
 *  hasSignedUp          boolean   – set true after successful sign-up
 *  signupBannerClosedAt number    – Unix ms timestamp of last close
 */

import Dexie from 'dexie'

// ─── Types ───────────────────────────────────────────────

export type BannerKey =
  | 'hasPlayedFirstGame'
  | 'hasSignedUp'
  | 'signupBannerClosedAt'

interface KVRecord {
  key: BannerKey
  value: string // JSON-encoded
}

// ─── Dexie DB ────────────────────────────────────────────

class SignupBannerDb extends Dexie {
  kv!: Dexie.Table<KVRecord, BannerKey>

  constructor() {
    super('mathy-signup-banner-db')
    this.version(1).stores({ kv: 'key' })
  }
}

let db: SignupBannerDb | null = null

function getDb(): SignupBannerDb {
  if (!db) db = new SignupBannerDb()
  return db
}

// ─── Core helpers ────────────────────────────────────────

async function idbGet(key: BannerKey): Promise<string | null> {
  try {
    const row = await getDb().kv.get(key)
    return row?.value ?? null
  } catch {
    return null
  }
}

async function idbSet(key: BannerKey, value: string): Promise<void> {
  try {
    await getDb().kv.put({ key, value })
  } catch {
    // fallback handled below
  }
}

function lsGet(key: BannerKey): string | null {
  try {
    return localStorage.getItem(`mathy_banner_${key}`)
  } catch {
    return null
  }
}

function lsSet(key: BannerKey, value: string): void {
  try {
    localStorage.setItem(`mathy_banner_${key}`, value)
  } catch {
    // ignore private-browsing errors
  }
}

// ─── Public API ──────────────────────────────────────────

/** Read a banner flag; tries IndexedDB first, then localStorage. */
export async function getBannerFlag(key: BannerKey): Promise<string | null> {
  const idbVal = await idbGet(key)
  if (idbVal !== null) return idbVal
  return lsGet(key)
}

/** Write a banner flag to both IndexedDB and localStorage (keeps them in sync). */
export async function setBannerFlag(key: BannerKey, value: string): Promise<void> {
  lsSet(key, value)           // write localStorage first (synchronous, no-fail)
  await idbSet(key, value)    // then IndexedDB
}

// ─── Typed convenience wrappers ──────────────────────────

export async function getHasPlayedFirstGame(): Promise<boolean> {
  return (await getBannerFlag('hasPlayedFirstGame')) === 'true'
}
export async function setHasPlayedFirstGame(): Promise<void> {
  await setBannerFlag('hasPlayedFirstGame', 'true')
}

export async function getHasSignedUp(): Promise<boolean> {
  return (await getBannerFlag('hasSignedUp')) === 'true'
}
export async function setHasSignedUp(): Promise<void> {
  await setBannerFlag('hasSignedUp', 'true')
}

export async function getSignupBannerClosedAt(): Promise<number | null> {
  const raw = await getBannerFlag('signupBannerClosedAt')
  if (!raw) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}
export async function setSignupBannerClosedAt(ts: number): Promise<void> {
  await setBannerFlag('signupBannerClosedAt', String(ts))
}
