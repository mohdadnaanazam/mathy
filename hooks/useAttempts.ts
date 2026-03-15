import { useState, useEffect } from 'react'

export function useAttempts() {
  const [used,        setUsed]        = useState(0)
  const [hydrated,    setHydrated]    = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedUsed  = parseInt(localStorage.getItem('ag_attempts_used')  || '0')
    setUsed(savedUsed)
    setHydrated(true)
  }, [])

  function recordAttempt() {
    const next = used + 1
    setUsed(next)
    localStorage.setItem('ag_attempts_used', String(next))
  }

  return {
    used,
    max:        Infinity,
    timeToReset: 0,
    isLocked:   false,
    recordAttempt,
    hydrated,
  }
}
