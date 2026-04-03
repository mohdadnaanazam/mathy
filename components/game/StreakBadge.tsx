'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StreakBadgeProps {
  streak: number
  justIncreased?: boolean
  onClick?: () => void
}

function getMilestone(streak: number): string | null {
  if (streak >= 30) return '🏆'
  if (streak >= 7) return '⭐'
  if (streak >= 3) return '✨'
  return null
}

export default function StreakBadge({ streak, justIncreased, onClick }: StreakBadgeProps) {
  const milestone = getMilestone(streak)

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        key={streak}
        onClick={onClick}
        initial={justIncreased ? { scale: 1.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-orange-500/10 active:scale-95"
        style={{
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.2)',
        }}
      >
        <span className="text-xs">🔥</span>
        <span className="text-[10px] sm:text-xs font-semibold text-orange-400 tabular-nums">
          {streak}
        </span>
        {milestone && <span className="text-[9px]">{milestone}</span>}
      </motion.button>
    </AnimatePresence>
  )
}
