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

  const baseColor = type === 'math' ? 'var(--accent-cyan)' : 'var(--accent-pink)'
  const color = isLow ? '#ff3333' : baseColor

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      
      {/* Icon + Time */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700,
        color: isLow ? '#ff3333' : '#fff',
        textShadow: isLow ? '0 0 20px rgba(255, 51, 51, 0.5)' : `0 0 10px ${color}`,
        transition: 'color 0.3s'
      }}>
        <motion.span
          animate={{ opacity: isLow ? [1, 0.5, 1] : 1 }}
          transition={isLow ? { duration: 0.5, repeat: Infinity } : {}}
          style={{ fontSize: '20px', color }}
        >
          {isLow ? '⚠️' : '⏱'}
        </motion.span>
        {timeStr}
      </div>

      {/* Progress Bar Container */}
      <div style={{
        width: '120px', height: '6px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '100px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
      }}>
        {/* Fill */}
        <motion.div
          animate={{ width: `${pct}%`, backgroundColor: color }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{ height: '100%', borderRadius: '100px', boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  )
}
