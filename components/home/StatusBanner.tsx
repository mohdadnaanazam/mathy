'use client'

interface StatusBannerProps {
  isSessionExpired: boolean
  isRefreshing: boolean
  isExpiryResetting: boolean
  isReloadingGames: boolean
  onReset: () => void
  onReload: () => void
}

export default function StatusBanner({
  isSessionExpired, isRefreshing, isExpiryResetting, isReloadingGames,
  onReset, onReload,
}: StatusBannerProps) {
  if (!isSessionExpired && !isRefreshing) return null

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
      {isSessionExpired ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-amber-400">Session expired. Reset to continue.</p>
          <button
            type="button"
            onClick={onReset}
            disabled={isExpiryResetting}
            className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
          >
            {isExpiryResetting ? 'Resetting…' : 'Reset'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-zinc-900/40 px-4 py-2.5">
          <span className="text-[11px] text-slate-400">Games expired. Reload for new questions.</span>
          <button
            type="button"
            onClick={onReload}
            disabled={isReloadingGames}
            className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent-orange)', color: '#111827' }}
          >
            {isReloadingGames ? 'Loading…' : 'Reload'}
          </button>
        </div>
      )}
    </div>
  )
}
