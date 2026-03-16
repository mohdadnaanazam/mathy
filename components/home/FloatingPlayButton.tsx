'use client'

interface FloatingPlayButtonProps {
  label: string
  showArrow: boolean
  disabled: boolean
  isLocked: boolean
  onClick: () => void
}

export default function FloatingPlayButton({
  label, showArrow, disabled, isLocked, onClick,
}: FloatingPlayButtonProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="pointer-events-auto w-full"
        style={{
          background: 'linear-gradient(to top, var(--bg-surface) 60%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-3 sm:py-4 flex justify-center">
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-10 py-3.5 sm:px-12 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            style={{
              backgroundColor: isLocked ? 'var(--border-subtle)' : 'var(--accent-orange)',
              color: isLocked ? '#64748b' : '#111827',
              border: `1px solid ${isLocked ? 'var(--border-subtle)' : 'var(--accent-orange-hover)'}`,
              boxShadow: isLocked ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}{showArrow && ' →'}
          </button>
        </div>
      </div>
    </div>
  )
}
