'use client'

interface ProgressLineProps {
  played: number
  total: number
  remaining: number
  exhausted: boolean
  refreshReady: boolean
  refreshFormatted: string
}

export default function ProgressLine({
  played, total, remaining, exhausted, refreshReady, refreshFormatted,
}: ProgressLineProps) {
  return (
    <div className="mt-1.5">
      <span className="text-[10px] font-mono text-slate-500">
        {played}/{total} played · {remaining} left
      </span>
      {exhausted && (
        <span className="text-[10px] font-mono text-amber-400 ml-2">
          {refreshReady ? '🎉 New games ready!' : `Unlock in ${refreshFormatted}`}
        </span>
      )}
    </div>
  )
}
