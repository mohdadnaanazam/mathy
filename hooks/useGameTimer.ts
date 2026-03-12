import { useState, useEffect, useRef, useCallback } from 'react'

export function useGameTimer(seconds: number, onTimeUp: () => void) {
  const [remaining, setRemaining] = useState(seconds)
  const ref        = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)

  useEffect(() => { onTimeUpRef.current = onTimeUp }, [onTimeUp])

  const reset = useCallback(() => {
    if (ref.current) clearInterval(ref.current)
    setRemaining(seconds)
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(ref.current!)
          onTimeUpRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [seconds])

  useEffect(() => {
    reset()
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [reset])

  const pct   = ((seconds - remaining) / seconds) * 100
  const isLow = remaining <= 10

  return { remaining, pct, isLow, reset }
}
