'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function Navbar() {
  const { used, max, timeToReset } = useAttempts()
  const remaining = max - used
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Left: logo / brand */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-700 shrink-0">
            <span className="text-[10px] sm:text-xs font-semibold text-white">M</span>
          </div>
          <span className="text-sm sm:text-base font-semibold text-white">
            Mathy
          </span>
        </Link>

        {/* Desktop nav + status: prevent overlap with flex-shrink-0 on Play */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-3 min-w-0 max-w-[calc(100%-8rem)]">
          <div className="flex items-center gap-1 text-xs font-medium shrink-0">
            {[{ href: '/', label: 'Home' }, { href: '/game', label: 'Play' }].map(
              ({ href, label }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-2 py-1 rounded-md ${
                      active
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {label}
                  </Link>
                )
              }
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 min-w-0 overflow-hidden">
            <span className="shrink-0">{remaining}/{max} plays</span>
            <span className="h-3 w-px bg-slate-700 shrink-0" />
            <span className="tabular-nums truncate">{formatTime(timeToReset)}</span>
          </div>
          <Link
            href="/game"
            className="shrink-0 rounded-full px-3 py-1.5 font-semibold text-[11px] transition-all duration-200 hover:shadow-[0_0_16px_rgba(249,115,22,0.3)]"
            style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
          >
            Play →
          </Link>
        </div>

        {/* Mobile: Play button */}
        <Link
          href="/game"
          className="inline-flex md:hidden items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200"
          style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
        >
          Play
        </Link>
      </div>
    </nav>
  )
}
