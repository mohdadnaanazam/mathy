'use client'

interface StatusBannerProps {
  isSessionExpired: boolean
  isRefreshing: boolean
  isReloading: boolean
  onReload: () => void
}

export default function StatusBanner({
  isSessionExpired, isRefreshing, isReloading, onReload,
}: StatusBannerProps) {
  if (!isSessionExpired && !isRefreshing) return null

  const message = isSessionExpired
    ? 'Your session has expired.'
    : 'Games have expired. Reload for new questions.'

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-amber-400">{message}</p>
        <button
          type="button"
          onClick={onReload}
          disabled={isReloading}
          className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
        >
          {isReloading ? 'Loading…' : 'Reload New Games'}
        </button>
      </div>
    </div>
  )
}
