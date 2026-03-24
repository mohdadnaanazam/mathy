'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Redirect legacy /game/tictactoe URL to the unified game board. */
export default function TicTacToePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/game?mode=tictactoe') }, [router])
  return null
}
