'use client'

import type { Difficulty } from '@/types'

interface DifficultyPillsProps {
  value: Difficulty | null
  onChange: (d: Difficulty) => void
  gridSizes?: Record<Difficulty, string>
}

const LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export default function DifficultyPills({ value, onChange, gridSizes }: DifficultyPillsProps) {
  return (
    <div className="flex gap-1.5">
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
        const active = value === d
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className="flex-1 py-2 sm:py-1.5 rounded-lg text-center transition-all duration-150 active:scale-[0.97] min-h-[36px]"
            style={{
              backgroundColor: active ? 'var(--accent-orange-muted)' : 'rgba(39,39,42,0.5)',
              border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
              color: active ? 'var(--accent-orange)' : '#a1a1aa',
            }}
          >
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">{LABELS[d]}</span>
            {gridSizes && (
              <span
                className="block text-[9px] mt-0.5"
                style={{ color: active ? 'var(--accent-orange)' : '#71717a' }}
              >
                {gridSizes[d]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
