'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiOverlayProps {
  /** Called after the confetti animation finishes (~3 s) */
  onComplete?: () => void
  /** Unique key to force re-fire confetti when changed */
  fireKey?: number | string
}

/**
 * Fires a multi-burst confetti animation on mount, then calls onComplete.
 * Renders nothing visible — the confetti is drawn on its own full-screen canvas.
 */
export default function ConfettiOverlay({ onComplete, fireKey }: ConfettiOverlayProps) {
  const lastFireKey = useRef<number | string | undefined>(undefined)

  useEffect(() => {
    // Only fire if this is a new mount or fireKey changed
    if (lastFireKey.current === fireKey && fireKey !== undefined) return
    lastFireKey.current = fireKey

    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#f97316', '#fb923c', '#fbbf24', '#22c55e', '#3b82f6', '#a855f7']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else {
        onComplete?.()
      }
    }

    // Initial big burst
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors,
    })

    requestAnimationFrame(frame)
  }, [onComplete, fireKey])

  return null
}
