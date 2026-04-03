'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StreakBadgeProps {
  streak: number
  justIncreased?: boolean
}

function getMilestone(streak: number): string | null {
  if (streak >= 30) return '🏆 Elite'
  if (streak >= 7) return '⭐ Weekly'
  if (streak >= 3) return '✨ Rising'
  return null
}

export default function StreakBadge({ streak, justIncreased }: StreakBadgeProps) {
  if (streak <= 0) return null

  const milestone = getMilestone(streak)

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={justIncreased ? { scale: 1.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.2)',
        }}
      >
        <span className="text-xs">🔥</span>
        <span className="text-[10px] sm:text-xs font-semibold text-orange-400 tabular-nums">
          {streak}
        </span>
        {milestone && (
          <span className="text-[9px] text-slate-500">{milestone}</span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
