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
    <nav className="fixed inset-x-0 top-0 z-50 bg-[#050816] border-b border-slate-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: logo / brand */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
            <span className="text-xs font-semibold text-white">M</span>
          </div>
          <span className="text-base font-semibold text-white">
            Mathy
          </span>
        </Link>

        {/* Desktop nav + status */}
        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-1 text-xs font-medium">
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

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <span>
              {remaining}/{max} plays
            </span>
            <span className="h-3 w-px bg-slate-700" />
            <span>{formatTime(timeToReset)}</span>
            <Link
              href="/game"
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-900"
            >
              Play →
            </Link>
          </div>
        </div>

        {/* Mobile: simple Play button */}
        <Link
          href="/game"
          className="inline-flex md:hidden items-center justify-center rounded-full border border-slate-500 px-3 py-1 text-xs font-semibold text-slate-100"
        >
          Play
        </Link>
      </div>
    </nav>
  )
}
