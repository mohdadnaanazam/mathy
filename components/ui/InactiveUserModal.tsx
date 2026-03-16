'use client'

export interface InactiveUserModalProps {
  open: boolean
  isExpired: boolean
  onContinue: () => void
  onRefresh: () => Promise<void>
}

export default function InactiveUserModal({
  open,
  isExpired,
  onContinue,
  onRefresh,
}: InactiveUserModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactive-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xl"
        style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
      >
        <h2
          id="inactive-modal-title"
          className="text-lg font-semibold text-white mb-1"
        >
          Welcome back
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isExpired
            ? 'Your previous session has expired (over 1 hour). Refresh games to continue.'
            : 'You’ve been away for a while. Continue with your previous games or refresh to load new ones.'}
        </p>
        <div className="flex flex-col gap-3">
          {!isExpired && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-800 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Continue previous game
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--accent-orange)',
              color: '#111827',
            }}
          >
            Refresh games
          </button>
        </div>
      </div>
    </div>
  )
}
