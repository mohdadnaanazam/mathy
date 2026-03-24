'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Trophy } from 'lucide-react'

export default function LeaderboardButton() {
  const router = useRouter()

  return (
    <section className="mx-auto max-w-2xl px-3 sm:px-6 pb-2 sm:pb-3">
      <button
        type="button"
        onClick={() => router.push('/leaderboard')}
        className="group w-full rounded-2xl border border-zinc-800/60 p-3 sm:p-4 flex items-center justify-between transition-colors hover:border-zinc-700 active:scale-[0.99]"
        style={{ backgroundColor: 'rgba(24,24,27,0.45)' }}
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <Trophy size={18} className="text-zinc-400 shrink-0 transition-colors group-hover:text-orange-400" />
            <span className="text-[13px] sm:text-sm font-semibold text-zinc-200">Leaderboard</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500">See global rankings and compete with others</p>
        </div>
        <ChevronRight size={16} className="text-zinc-500 shrink-0" />
      </button>
    </section>
  )
}
