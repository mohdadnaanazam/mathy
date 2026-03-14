'use client'
import Link from 'next/link'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function Footer() {
  const { timeToReset } = useAttempts()

  return (
    <footer
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4 px-4 sm:px-6 shrink-0"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="mx-auto max-w-4xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">AI GAMES</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Home</Link>
          <Link href="/game" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Play</Link>
        </div>
        <span className="text-[10px] font-mono text-slate-600 tracking-[0.08em]">
          resets in {formatTime(timeToReset)}
        </span>
      </div>
    </footer>
  )
}
