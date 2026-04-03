'use client'

import { memo } from 'react'

/**
 * Loading Skeletons for Game Components
 * Provides consistent loading states during dynamic imports.
 * 
 * Requirements: 7.1, 7.2
 */

// ============================================================================
// Base Skeleton Components
// ============================================================================

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export const Skeleton = memo(function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/50 rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
})

export const SkeletonText = memo(function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  )
})

export const SkeletonCircle = memo(function SkeletonCircle({ 
  size = 40,
  className = '' 
}: { 
  size?: number
  className?: string 
}) {
  return (
    <Skeleton
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  )
})

// ============================================================================
// Game-Specific Skeletons
// ============================================================================

export type GameSkeletonType = 'math' | 'memory' | 'truefalse' | 'tictactoe' | 'speedsort' | 'default'

interface GameSkeletonProps {
  type?: GameSkeletonType
}

/**
 * Math Game Skeleton
 * Shows placeholder for equation and answer buttons
 */
const MathGameSkeleton = memo(function MathGameSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Progress indicator */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Equation display */}
      <div className="flex justify-center py-8">
        <Skeleton className="h-12 w-48 rounded-lg" />
      </div>

      {/* Answer input or buttons */}
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  )
})

/**
 * Memory Grid Game Skeleton
 * Shows placeholder grid of cards
 */
const MemoryGameSkeleton = memo(function MemoryGameSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square rounded-lg"
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  )
})

/**
 * True/False Game Skeleton
 * Shows placeholder for statement and true/false buttons
 */
const TrueFalseGameSkeleton = memo(function TrueFalseGameSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Progress */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Statement */}
      <div className="py-8 space-y-3">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
      </div>

      {/* True/False buttons */}
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-16 w-32 rounded-xl" />
        <Skeleton className="h-16 w-32 rounded-xl" />
      </div>
    </div>
  )
})

/**
 * Tic-Tac-Toe Game Skeleton
 * Shows placeholder 3x3 grid
 */
const TicTacToeSkeleton = memo(function TicTacToeSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square rounded-lg"
          />
        ))}
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
    </div>
  )
})

/**
 * Speed Sort Game Skeleton
 * Shows placeholder for sortable items
 */
const SpeedSortSkeleton = memo(function SpeedSortSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Timer */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Sortable items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-14 w-full rounded-xl"
          />
        ))}
      </div>

      {/* Submit */}
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  )
})

/**
 * Default Game Skeleton
 * Generic loading state for any game
 */
const DefaultGameSkeleton = memo(function DefaultGameSkeleton() {
  return (
    <div className="w-full space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Main content area */}
      <div className="py-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
})

// ============================================================================
// Main GameSkeleton Component
// ============================================================================

/**
 * GameSkeleton Component
 * Renders appropriate skeleton based on game type.
 * 
 * @param type - The type of game skeleton to render
 */
export const GameSkeleton = memo(function GameSkeleton({ type = 'default' }: GameSkeletonProps) {
  switch (type) {
    case 'math':
      return <MathGameSkeleton />
    case 'memory':
      return <MemoryGameSkeleton />
    case 'truefalse':
      return <TrueFalseGameSkeleton />
    case 'tictactoe':
      return <TicTacToeSkeleton />
    case 'speedsort':
      return <SpeedSortSkeleton />
    default:
      return <DefaultGameSkeleton />
  }
})

// ============================================================================
// Page-Level Skeletons
// ============================================================================

/**
 * Full page loading skeleton
 */
export const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="card bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
          <DefaultGameSkeleton />
        </div>
      </div>
    </div>
  )
})

/**
 * Inline loading spinner
 */
export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  }

  return (
    <div
      className={`animate-spin rounded-full border-zinc-700 border-t-zinc-300 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
})

export default GameSkeleton
