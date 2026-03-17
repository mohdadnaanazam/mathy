import type { Metadata } from 'next'
import { Suspense } from 'react'
import GameBoard from '@/components/game/GameBoard'

export const metadata: Metadata = {
  title: 'Play Game',
  description:
    'Solve AI-generated math equations, test your memory, or play true/false challenges. Pick your difficulty and start training your brain.',
}

function GameFallback() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" aria-label="Loading game" />
    </main>
  )
}

export default function GamePage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Suspense fallback={<GameFallback />}>
        <GameBoard />
      </Suspense>
    </main>
  )
}
