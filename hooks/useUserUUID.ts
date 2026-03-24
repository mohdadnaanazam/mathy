'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUserUuid, setUserUuid } from '@/lib/indexeddb'
import { getOrCreateUser, getStoredIdentity, type UserIdentity } from '@/lib/userIdentity'

export interface UseUserUUIDResult {
  userUuid: string | null
  username: string | null
  avatar: string | null
  loading: boolean
  error: string | null
}

/**
 * Resolve user identity: auto-generates UUID, username, and DiceBear avatar.
 * No manual input required. Identity persists across sessions.
 * Syncs IndexedDB (for score) and localStorage (for identity) with backend.
 */
export function useUserUUID(): UseUserUUIDResult {
  const [userUuid, setUserUuidState] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(async () => {
    try {
      // Get or create full identity (localStorage + backend sync)
      const identity: UserIdentity = await getOrCreateUser()

      // Also ensure IndexedDB has the UUID (for score tracking)
      const existingUuid = await getUserUuid()
      if (!existingUuid || existingUuid !== identity.userId) {
        await setUserUuid(identity.userId)
      }

      setUserUuidState(identity.userId)
      setUsername(identity.username)
      setAvatar(identity.avatar)
    } catch (e) {
      // Fallback: try to load from localStorage even if backend failed
      const stored = getStoredIdentity()
      if (stored) {
        setUserUuidState(stored.userId)
        setUsername(stored.username)
        setAvatar(stored.avatar)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to resolve user')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    resolve()
  }, [resolve])

  return { userUuid, username, avatar, loading, error }
}
