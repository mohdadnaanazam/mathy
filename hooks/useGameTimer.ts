import { useState, useEffect, useRef, useCallback } from 'react'

export function useGameTimer(seconds: number, onTimeUp: () => void) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    hasFiredRef.current = false
    setRemaining(seconds)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer, seconds])

  useEffect(() => {
    reset()
    return () => {
      clearTimer()
    }
  }, [reset, clearTimer])

  // Fire onTimeUp only after render when remaining hits 0,
  // to avoid triggering parent updates while Timer is rendering.
  useEffect(() => {
    if (remaining === 0 && !hasFiredRef.current) {
      hasFiredRef.current = true
      onTimeUpRef.current()
    }
  }, [remaining])

  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0
  const isLow = remaining <= 10

  return { remaining, pct, isLow, reset }
}
