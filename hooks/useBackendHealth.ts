'use client'

import { useEffect, useState } from 'react'
import { checkBackendHealth, type BackendHealth } from '@/lib/connectivity'

/**
 * Ping backend /health and /health/db on mount to verify API and Supabase are connected.
 * Use for status indicators or to gate features.
 */
export function useBackendHealth(): BackendHealth & { loading: boolean } {
  const [state, setState] = useState<BackendHealth & { loading: boolean }>({
    api: false,
    db: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    checkBackendHealth().then(result => {
      if (!cancelled) {
        setState({ ...result, loading: false })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
