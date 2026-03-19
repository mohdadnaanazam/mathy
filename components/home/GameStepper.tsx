'use client'

import { Minus, Plus } from 'lucide-react'

interface GameStepperProps {
  count: number
  onDecrement: () => void
  onIncrement: () => void
  disabled: boolean
}

export default function GameStepper({ count, onDecrement, onIncrement, disabled }: GameStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 mr-1">Games</span>
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-slate-300 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-30"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[1.5rem] text-center font-mono text-sm text-white font-semibold">
        {count}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-full border border-[var(--border-subtle)] text-slate-300 transition-colors hover:border-zinc-500 active:bg-zinc-800 disabled:opacity-30"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
