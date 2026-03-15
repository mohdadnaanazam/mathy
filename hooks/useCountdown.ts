'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

const LOW_THRESHOLD = 20

export interface UseCountdownResult {
  remaining: number
  pct: number
  isLow: boolean
}

/**
 * Per-round countdown: starts at `seconds`, ticks down every second, calls onTimeUp at 0.
 */
export function useCountdown(seconds: number, onTimeUp: () => void): UseCountdownResult {
  const [remaining, setRemaining] = useState(seconds)
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  const totalRef = useRef(seconds)

  useEffect(() => {
    totalRef.current = seconds
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(id)
          onTimeUpRef.current()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [remaining])

  const total = totalRef.current
  const pct = total > 0 ? Math.max(0, (remaining / total) * 100) : 0
  const isLow = remaining <= LOW_THRESHOLD

  return { remaining, pct, isLow }
}
