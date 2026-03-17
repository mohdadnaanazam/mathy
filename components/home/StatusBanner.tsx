'use client'

interface StatusBannerProps {
  isSessionExpired: boolean
  isRefreshing: boolean
  isReloading: boolean
  hasUnfinishedGames: boolean
  onReload: () => void
  onContinue: () => void
}

export default function StatusBanner({
  isSessionExpired, isRefreshing, isReloading, hasUnfinishedGames, onReload, onContinue,
}: StatusBannerProps) {
  // Show banner when: loading, OR (session/cache expired AND user has no games to continue)
  // If user has unfinished games, don't nag them — they can just play.
  // Only show the banner if there's something actionable to communicate.
  const needsReload = (isSessionExpired || isRefreshing) && !hasUnfinishedGames
  if (!isReloading && !needsReload) return null

  const message = isReloading
    ? '🔄 Preparing your games…'
    : '🎯 Ready for new challenges? Reload to get fresh games.'

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-amber-400 leading-snug">{message}</p>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
          >
            {isReloading ? 'Loading…' : 'Reload New Games'}
          </button>
        </div>
      </div>
    </div>
  )
}
