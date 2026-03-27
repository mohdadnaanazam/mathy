'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'mathy_has_played'

/**
 * Tracks whether the current user is a first-time visitor.
 * Uses localStorage so the flag persists across sessions.
 */
export function useFirstTimeUser() {
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const played = localStorage.getItem(STORAGE_KEY)
    setIsFirstTime(!played)
    setHydrated(true)
  }, [])

  const markPlayed = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setIsFirstTime(false)
  }, [])

  return { isFirstTime, hydrated, markPlayed }
}
