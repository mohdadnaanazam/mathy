'use client'
import { motion } from 'framer-motion'
import { useAttempts } from '@/hooks/useAttempts'

export default function RefreshCountdown() {
  const { isLocked, timeToReset } = useAttempts()

  if (!isLocked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', animation: 'pulse 2s infinite' }}>●</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Energy Online
        </span>
      </div>
    )
  }

  const hours = Math.floor(timeToReset / 3600)
  const remainingMinutes = Math.floor((timeToReset % 3600) / 60)
  const remainingSeconds = timeToReset % 60

  const m = remainingMinutes.toString().padStart(2, '0')
  const s = remainingSeconds.toString().padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 0, 127, 0.05)', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(255, 0, 127, 0.2)' }}
    >
      <span style={{ fontSize: '12px', color: 'var(--accent-pink)', animation: 'pulse 1s infinite' }}>●</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Recharging
      </span>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--accent-pink)', background: 'rgba(255, 0, 127, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
        {hours > 0 ? `${hours}:${m}:${s}` : `${m}:${s}`}
      </div>
    </motion.div>
  )
}
