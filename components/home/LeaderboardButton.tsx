'use client'

import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'

export default function LeaderboardButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push('/leaderboard')}
      className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-zinc-700/60 bg-zinc-900/80 transition-all hover:border-[var(--accent-orange)]/50 hover:shadow-[0_0_10px_rgba(249,115,22,0.15)] active:scale-95"
      aria-label="Leaderboard"
    >
      <Trophy size={16} className="text-[var(--accent-orange)]" />
    </button>
  )
}
