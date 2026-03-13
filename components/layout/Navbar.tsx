'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function Navbar() {
  const { used, max, timeToReset } = useAttempts()
  const remaining = max - used
  const pathname  = usePathname()

  return (
    <nav className="fixed inset-x-0 top-2 z-50 flex w-full justify-center px-4">
      <div className="flex w-full max-w-6xl items-center justify-between rounded-full border border-border/30 bg-background/80 px-4 py-2 shadow-sm backdrop-blur-xl">
        {/* Left: logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center gap-2 text-sm font-semibold tracking-[0.18em]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.08)] shadow-[0_0_16px_rgba(0,240,255,0.2)]">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_10px_var(--accent-cyan)]" />
          </div>
          <span className="hidden text-sm font-extrabold text-white sm:inline nav-brand-text">
            AI<span className="text-[var(--accent-cyan)]">GAMES</span>
          </span>
        </Link>

        {/* Center: nav links */}
        <div className="hidden items-center gap-1 text-xs font-medium md:flex">
          {[{ href: '/', label: 'Home' }, { href: '/game', label: 'Play' }].map(
            ({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative rounded-lg px-3 py-2 transition-colors ${
                    active
                      ? 'bg-foreground/10 text-white'
                      : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              )
            }
          )}
        </div>

        {/* Right: attempts + timer + CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[11px] font-mono text-foreground/60">
              {remaining}/{max}
            </span>
            <span className="h-3 w-px bg-foreground/15" />
          </div>
          <span className="text-[11px] font-mono tracking-[0.15em] text-foreground/70">
            {formatTime(timeToReset)}
          </span>
          <Link
            href="/game"
            className="ml-1 inline-flex items-center justify-center rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background shadow-sm hover:bg-foreground/90"
          >
            Play →
          </Link>
        </div>
      </div>
    </nav>
  )
}
