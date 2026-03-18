'use client'

interface ProgressLineProps {
  played: number
  total: number
  remaining: number
  exhausted: boolean
  refreshReady: boolean
  refreshFormatted: string
}

/** Check if countdown is under 2 minutes by parsing the "Xm YYs" format. */
function isUrgent(formatted: string): boolean {
  const match = formatted.match(/^(\d+)m/)
  if (!match) return false
  return parseInt(match[1], 10) < 2
}

export default function ProgressLine({
  played, total, remaining, exhausted, refreshReady, refreshFormatted,
}: ProgressLineProps) {
  const urgent = !refreshReady && isUrgent(refreshFormatted)

  return (
    <div className="mt-1.5">
      <span className="text-[10px] font-mono text-slate-500">
        {played}/{total} played &middot; {remaining} left
      </span>
      {exhausted && (
        <span
          className={`text-[10px] font-mono ml-2 inline-flex items-center gap-1 ${urgent ? 'progress-urgent' : ''}`}
          style={{ color: refreshReady ? '#22c55e' : urgent ? '#f87171' : '#fbbf24' }}
        >
          {refreshReady ? (
            '🎉 New games ready!'
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0" style={{ opacity: 0.8 }}>
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 4.5V8l2.5 1.5" />
              </svg>
              Unlock in {refreshFormatted}
            </>
          )}
        </span>
      )}
    </div>
  )
}
