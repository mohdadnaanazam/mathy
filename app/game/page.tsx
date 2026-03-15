import { Suspense } from 'react'
import GameBoard from '@/components/game/GameBoard'

function GameFallback() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
    </main>
  )
}

export default function GamePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<GameFallback />}>
        <GameBoard />
      </Suspense>
    </main>
  )
}
