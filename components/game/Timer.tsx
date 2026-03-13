'use client'
import { motion } from 'framer-motion'
import { useGameTimer } from '@/hooks/useGameTimer'

interface Props {
  seconds: number
  onTimeUp: () => void
  type?: 'math' | 'memory'
}

export default function Timer({ seconds, onTimeUp, type = 'math' }: Props) {
  const { remaining, pct, isLow } = useGameTimer(seconds, onTimeUp)
  
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`

  const color = isLow ? '#ef4444' : '#94a3b8'
  const fillBg = isLow ? '#ef4444' : '#64748b'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          fontWeight: 600,
          color,
          letterSpacing: '0.05em',
        }}
      >
        <motion.span
          animate={{ opacity: isLow ? [1, 0.5, 1] : 1 }}
          transition={isLow ? { duration: 0.5, repeat: Infinity } : {}}
          style={{ fontSize: '14px' }}
        >
          {isLow ? '⚠' : '⏱'}
        </motion.span>
        {timeStr}
      </div>
      <div
        style={{
          width: '80px',
          height: '4px',
          background: '#27272a',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'linear' }}
          style={{
            height: '100%',
            borderRadius: '999px',
            backgroundColor: fillBg,
          }}
        />
      </div>
    </div>
  )
}
