'use client'
import { motion } from 'framer-motion'
import { useCountdown } from '@/hooks/useCountdown'

interface Props {
  seconds: number
  onTimeUp: () => void
  type?: 'math' | 'memory'
}

export default function Timer({ seconds, onTimeUp, type = 'math' }: Props) {
  const { remaining, pct, isLow } = useCountdown(seconds, onTimeUp)
  
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`

  const color = isLow ? '#ef4444' : '#94a3b8'
  const fillBg = isLow ? '#ef4444' : '#64748b'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className="flex items-center gap-1.5 font-mono font-semibold tracking-wide shrink-0"
        style={{ color, fontSize: 'clamp(12px, 3vw, 14px)' }}
      >
        <motion.span
          animate={{ opacity: isLow ? [1, 0.5, 1] : 1 }}
          transition={isLow ? { duration: 0.5, repeat: Infinity } : {}}
        >
          {isLow ? '⚠' : '⏱'}
        </motion.span>
        {timeStr}
      </div>
      <div
        className="h-1 rounded-full overflow-hidden shrink-0"
        style={{
          width: 'clamp(56px, 18vw, 80px)',
          background: '#27272a',
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'linear' }}
          className="h-full rounded-full"
          style={{ backgroundColor: fillBg }}
        />
      </div>
    </div>
  )
}
