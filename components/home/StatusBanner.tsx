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
  // Show banner when: loading, session expired, or cache expired
  if (!isReloading && !isSessionExpired && !isRefreshing) return null

  // Determine message based on state
  const message = isReloading
    ? '🔄 Preparing your games…'
    : hasUnfinishedGames
      ? '🎮 You have games in progress — pick up where you left off!'
      : isSessionExpired
        ? '🎯 Fresh new challenges are ready!'
        : '⚡ New games are available!'

  // Show continue as primary when user has playable games
  const showContinue = !isReloading && hasUnfinishedGames

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-amber-400 leading-snug">{message}</p>
        <div className="shrink-0 flex items-center gap-2">
          {showContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
            >
              Continue
            </button>
          )}
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
            style={
              showContinue
                ? { backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid rgba(63,63,70,0.6)' }
                : { backgroundColor: 'var(--accent-orange)', color: '#111827' }
            }
          >
            {isReloading ? 'Loading…' : showContinue ? 'New Games' : 'Reload New Games'}
          </button>
        </div>
      </div>
    </div>
  )
}
