'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUserUuid, setUserUuid } from '@/lib/indexeddb'
import { ensureUserInSupabase } from '@/lib/supabase-user'

export interface UseUserUUIDResult {
  userUuid: string | null
  loading: boolean
  error: string | null
}

/**
 * Resolve anonymous user UUID: from IndexedDB if present, otherwise generate,
 * store in IndexedDB, and ensure a row exists in Supabase (safe create).
 * UUID is never regenerated if it already exists in IndexedDB.
 */
export function useUserUUID(): UseUserUUIDResult {
  const [userUuid, setUserUuidState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(async () => {
    try {
      let uuid = await getUserUuid()
      if (!uuid) {
        uuid = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : (() => {
              const hex = () => Math.floor(Math.random() * 16).toString(16)
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
                (c === 'x' ? hex() : ((parseInt(hex(), 16) & 0x3) | 0x8).toString(16))
              )
            })()
        await setUserUuid(uuid)
        await ensureUserInSupabase(uuid)
      } else {
        await ensureUserInSupabase(uuid)
      }
      setUserUuidState(uuid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    resolve()
  }, [resolve])

  return { userUuid, loading, error }
}
