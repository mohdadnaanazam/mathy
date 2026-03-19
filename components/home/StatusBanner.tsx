'use client'

interface StatusBannerProps {
  isSessionExpired: boolean
  isRefreshing: boolean
  isReloading: boolean
  hasUnfinishedGames: boolean
  justReloaded: boolean
  onReload: () => void
  onContinue: () => void
}

export default function StatusBanner({
  isSessionExpired, isRefreshing, isReloading, hasUnfinishedGames, justReloaded, onReload,
}: StatusBannerProps) {
  // After a fresh reload, suppress the banner until the session genuinely becomes stale again.
  // This prevents the "new games available" message from showing immediately after reload.
  const isStale = (isSessionExpired || isRefreshing) && !justReloaded

  // Only show when: loading, or genuinely stale
  if (!isReloading && !isStale) return null

  const message = isReloading
    ? '🔄 Preparing your games…'
    : hasUnfinishedGames
      ? '🎮 You have games in progress. New games also available.'
      : '🎯 Ready for new challenges? Reload to get fresh games.'

  return (
    <div className="mx-auto max-w-2xl px-3 sm:px-6 pt-2 sm:pt-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
        <p className="text-[10px] sm:text-[11px] text-amber-400 leading-snug">{message}</p>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="rounded-full px-3 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60 transition-colors whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
          >
            {isReloading ? 'Loading…' : 'Reload'}
          </button>
        </div>
      </div>
    </div>
  )
}
