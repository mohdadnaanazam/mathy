import type { Metadata } from 'next'
import { Suspense } from 'react'
import GameBoard from '@/components/game/GameBoard'
import { generateGameMetadataSafe, mapModeToGameType, type Difficulty } from '@/lib/seo'

interface GamePageProps {
  searchParams: Promise<{ mode?: string; difficulty?: string; type?: string }>
}

export async function generateMetadata({ searchParams }: GamePageProps): Promise<Metadata> {
  const params = await searchParams
  const gameType = mapModeToGameType(params.mode)
  const difficulty = params.difficulty as Difficulty | undefined
  
  return generateGameMetadataSafe({ gameType, difficulty, moreType: params.type })
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
