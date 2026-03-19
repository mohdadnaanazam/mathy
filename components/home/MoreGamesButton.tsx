'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

export default function MoreGamesButton() {
  const router = useRouter()

  return (
    <section className="mx-auto max-w-2xl px-3 sm:px-6 pt-2 sm:pt-4 pb-4 sm:pb-6">
      <button
        type="button"
        onClick={() => router.push('/game/more')}
        className="w-full rounded-2xl border border-zinc-800/60 p-3 sm:p-4 flex items-center justify-between transition-colors hover:border-zinc-700 active:scale-[0.99]"
        style={{ backgroundColor: 'rgba(24,24,27,0.45)' }}
      >
        <div>
          <span className="text-[13px] sm:text-sm font-semibold text-zinc-200">More Games</span>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">Square Root, Fractions, Algebra and more</p>
        </div>
        <ChevronRight size={16} className="text-zinc-500 shrink-0" />
      </button>
    </section>
  )
}
