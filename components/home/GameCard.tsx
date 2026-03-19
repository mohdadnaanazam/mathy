'use client'

import type { ReactNode } from 'react'
import type { Difficulty } from '@/types'
import DifficultyPills from './DifficultyPills'
import GameStepper from './GameStepper'
import ProgressLine from './ProgressLine'

export interface GameCardProps {
  /** Unique key for this game type */
  id: string
  /** Whether this card is the currently active/selected game */
  isActive: boolean
  /** Called when user taps anywhere on the card */
  onActivate: () => void
  /** Icon element (e.g. <Calculator />) */
  icon: ReactNode
  title: string
  description: string
  /** Current difficulty selection */
  difficulty: Difficulty | null
  onDifficultyChange: (d: Difficulty) => void
  /** Optional grid size labels for difficulty pills */
  gridSizes?: Record<Difficulty, string>
  /** Game count stepper state — only rendered when card is active + difficulty chosen */
  gamesCount: number
  onDecrement: () => void
  onIncrement: () => void
  stepperDisabled: boolean
  /** Progress info — only rendered when session is hydrated */
  sessionHydrated: boolean
  variantPlayed: number
  variantTotal: number
  variantRemaining: number
  variantExhausted: boolean
  refreshReady: boolean
  refreshFormatted: string
  /** Optional extra content rendered between description and difficulty pills */
  children?: ReactNode
  /** When true, hides the per-card difficulty pills (used when a shared selector exists) */
  hideDifficulty?: boolean
}

export default function GameCard({
  isActive, onActivate, icon, title, description,
  difficulty, onDifficultyChange, gridSizes,
  gamesCount, onDecrement, onIncrement, stepperDisabled,
  sessionHydrated, variantPlayed, variantTotal, variantRemaining,
  variantExhausted, refreshReady, refreshFormatted,
  children, hideDifficulty,
}: GameCardProps) {
  const showControls = isActive && difficulty !== null

  return (
    <div
      className="rounded-2xl border p-3 sm:p-4 transition-colors"
      style={{
        borderColor: isActive ? 'var(--accent-orange)' : 'var(--border-subtle)',
        backgroundColor: isActive ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
      }}
      onClick={onActivate}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
        {icon}
        <span className="text-[13px] sm:text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-[10px] sm:text-[11px] text-slate-500 mb-2 sm:mb-3 leading-snug">{description}</p>

      {/* Game-specific content (e.g. operation selector) */}
      {children}

      {/* Difficulty — hidden when shared selector is used */}
      {!hideDifficulty && (
        <DifficultyPills value={difficulty} onChange={onDifficultyChange} gridSizes={gridSizes} />
      )}

      {/* Stepper + progress — only when active and difficulty chosen */}
      {showControls && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-subtle)]">
          <GameStepper
            count={gamesCount}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            disabled={stepperDisabled}
          />
          {sessionHydrated && (
            <ProgressLine
              played={variantPlayed} total={variantTotal} remaining={variantRemaining}
              exhausted={variantExhausted} refreshReady={refreshReady} refreshFormatted={refreshFormatted}
            />
          )}
        </div>
      )}
    </div>
  )
}
