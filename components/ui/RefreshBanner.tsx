'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { RefreshTier } from '@/hooks/useRefreshCountdown'

interface RefreshBannerProps {
  tier: RefreshTier
  formatted: string
}

/**
 * Tiered banner that appears based on how close the next game refresh is.
 * - none (>10 min): hidden
 * - warning (2–10 min): small yellow/orange banner
 * - urgent (<2 min): red highlighted banner
 * - ready (0): green celebration banner
 */
export default function RefreshBanner({ tier, formatted }: RefreshBannerProps) {
  if (tier === 'none') return null

  const config = {
    warning: {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
      color: '#f59e0b',
      icon: '⏱',
      text: `New games unlock in ${formatted}`,
      py: 'py-2',
      textSize: 'text-xs',
    },
    urgent: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.4)',
      color: '#f87171',
      icon: '⏳',
      text: `Almost ready! New games in ${formatted}`,
      py: 'py-2.5',
      textSize: 'text-xs sm:text-sm',
    },
    ready: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.4)',
      color: '#22c55e',
      icon: '🎉',
      text: 'New games available!',
      py: 'py-2.5',
      textSize: 'text-xs sm:text-sm',
    },
  }[tier]

  return (
    <AnimatePresence>
      <motion.div
        key={tier}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`w-full rounded-xl border ${config.py} px-4 text-center`}
        style={{
          backgroundColor: config.bg,
          borderColor: config.border,
        }}
      >
        <span
          className={`${config.textSize} font-semibold`}
          style={{ color: config.color }}
        >
          {config.icon}{' '}{config.text}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
