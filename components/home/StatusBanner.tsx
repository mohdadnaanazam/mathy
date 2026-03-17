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
  isSessionExpired, isRefreshing, isReloading, hasUnfinishedGames, onReload,
}: StatusBannerProps) {
  // Always show the banner so the reload option is always accessible.
  // Tone changes based on state: loading → amber, expired → amber, normal → subtle zinc.
  const isExpiredOrRefreshing = isSessionExpired || isRefreshing

  const message = isReloading
    ? '🔄 Preparing your games…'
    : isExpiredOrRefreshing && !hasUnfinishedGames
      ? '🎯 Ready for new challenges? Reload to get fresh games.'
      : isExpiredOrRefreshing && hasUnfinishedGames
        ? '🎮 You have games in progress. New games also available.'
        : '🔄 Want fresh questions? Reload anytime.'

  // Use amber styling when there's something noteworthy, subtle zinc otherwise
  const isHighlighted = isReloading || isExpiredOrRefreshing

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
      <div
        className="rounded-xl px-4 py-2.5 flex items-center justify-between gap-3"
        style={{
          border: isHighlighted ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(63,63,70,0.4)',
          background: isHighlighted ? 'rgba(245,158,11,0.05)' : 'rgba(39,39,42,0.3)',
        }}
      >
        <p className="text-[11px] leading-snug" style={{ color: isHighlighted ? '#fbbf24' : '#71717a' }}>
          {message}
        </p>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60 transition-colors"
            style={
              isHighlighted
                ? { backgroundColor: 'var(--accent-orange)', color: '#111827' }
                : { backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid rgba(63,63,70,0.6)' }
            }
          >
            {isReloading ? 'Loading…' : 'Reload New Games'}
          </button>
        </div>
      </div>
    </div>
  )
}
