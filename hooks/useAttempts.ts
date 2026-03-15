import { useState, useEffect } from 'react'

const MAX_ATTEMPTS = 15
const HOUR_MS      = 60 * 60 * 1000

export function useAttempts() {
  const [used,        setUsed]        = useState(0)
  const [hourStart,   setHourStart]   = useState(Date.now())
  const [timeToReset, setTimeToReset] = useState(3600)
  const [hydrated,    setHydrated]    = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedUsed  = parseInt(localStorage.getItem('ag_attempts_used')  || '0')
    const savedStart = parseInt(localStorage.getItem('ag_hour_start')     || String(Date.now()))
    const elapsed    = Date.now() - savedStart

    if (elapsed >= HOUR_MS) {
      const newStart = Date.now()
      localStorage.setItem('ag_attempts_used', '0')
      localStorage.setItem('ag_hour_start',    String(newStart))
      setUsed(0)
      setHourStart(newStart)
    } else {
      setUsed(savedUsed)
      setHourStart(savedStart)
    }
    setHydrated(true)
  }, [])

  // Tick countdown and auto-reset
  useEffect(() => {
    if (!hydrated) return
    const tick = setInterval(() => {
      const elapsed = Date.now() - hourStart
      if (elapsed >= HOUR_MS) {
        const newStart = Date.now()
        localStorage.setItem('ag_attempts_used', '0')
        localStorage.setItem('ag_hour_start',    String(newStart))
        setUsed(0)
        setHourStart(newStart)
        setTimeToReset(3600)
      } else {
        setTimeToReset(Math.max(0, Math.floor((HOUR_MS - elapsed) / 1000)))
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [hourStart, hydrated])

  function recordAttempt() {
    if (used >= MAX_ATTEMPTS) return
    const next = used + 1
    setUsed(next)
    localStorage.setItem('ag_attempts_used', String(next))
  }

  return {
    used,
    max:        MAX_ATTEMPTS,
    timeToReset,
    isLocked:   used >= MAX_ATTEMPTS,
    recordAttempt,
    hydrated,
  }
}
