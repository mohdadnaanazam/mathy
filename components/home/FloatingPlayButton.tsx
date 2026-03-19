'use client'

import { useRef, useCallback } from 'react'

interface FloatingPlayButtonProps {
  label: string
  disabled: boolean
  isLocked: boolean
  isNavigating?: boolean
  onClick: () => void
}

export default function FloatingPlayButton({
  label, disabled, isLocked, isNavigating, onClick,
}: FloatingPlayButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    if (disabled || isNavigating) return
    // Haptic-style micro-feedback via a quick scale punch
    const el = btnRef.current
    if (el) {
      el.style.transform = 'scale(0.94)'
      requestAnimationFrame(() => {
        setTimeout(() => { if (el) el.style.transform = '' }, 120)
      })
    }
    onClick()
  }, [disabled, isNavigating, onClick])

  const isActive = !disabled && !isLocked && !isNavigating

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="pointer-events-auto w-full"
        style={{
          background: 'linear-gradient(to top, var(--bg-surface) 60%, transparent)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          paddingTop: '20px',
        }}
      >
        <div className="mx-auto w-full max-w-md px-5 sm:px-6 pb-4 sm:pb-5 flex justify-center">
          <button
            ref={btnRef}
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-busy={isNavigating}
            className="play-btn group relative w-full overflow-hidden rounded-2xl px-8 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 ease-out disabled:pointer-events-none"
            style={{
              /* --- colours by state --- */
              background: isLocked
                ? 'rgba(39,39,42,0.7)'
                : isNavigating
                  ? 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)'
                  : isActive
                    ? 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)'
                    : 'rgba(39,39,42,0.55)',
              color: isLocked ? '#52525b' : isActive || isNavigating ? '#111827' : '#71717a',
              border: isLocked
                ? '1px solid rgba(63,63,70,0.5)'
                : isActive || isNavigating
                  ? '1px solid rgba(249,115,22,0.5)'
                  : '1px solid rgba(63,63,70,0.4)',
              boxShadow: isActive
                ? '0 8px 32px rgba(249,115,22,0.35), 0 2px 12px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                : isNavigating
                  ? '0 6px 24px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : 'none',
              opacity: disabled && !isLocked && !isNavigating ? 0.45 : 1,
            }}
          >
            {/* Shimmer sweep on active state */}
            {isActive && (
              <span
                aria-hidden="true"
                className="play-btn-shimmer absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.13) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                }}
              />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isNavigating ? (
                <>
                  <svg className="play-btn-spinner h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 20" />
                  </svg>
                  <span>Starting…</span>
                </>
              ) : (
                <span>{label}</span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
