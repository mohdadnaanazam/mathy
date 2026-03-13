'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAttempts } from '@/hooks/useAttempts'

export default function AttemptTracker() {
  const { used, max } = useAttempts()
  const p = used / max

  let c = 'var(--accent-cyan)'
  if (p < 0.5) c = '#ffb800'
  if (p <= 0.2) c = 'var(--accent-pink)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      
      {/* Label and Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className='section-label' style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>Energy</span>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
          background: `rgba(255,255,255,0.05)`, border: `1px solid ${c}`,
          color: c, padding: '4px 10px', borderRadius: '100px', boxShadow: `0 0 10px ${c}40`
        }}>
          {used} / {max}
        </div>
      </div>

      {/* Segments */}
      <div className="hidden sm:flex" style={{ gap: '4px' }}>
        {Array.from({ length: 15 }).map((_, i) => {
          const active = i < used
          const color = active ? c : 'rgba(255,255,255,0.05)'
          const shadow = active ? `0 0 8px ${c}` : 'none'
          
          return (
            <motion.div
              layout
              key={i}
              initial={false}
              animate={{ backgroundColor: color, boxShadow: shadow }}
              style={{
                width: '6px', height: '14px', borderRadius: '2px',
                transform: 'skewX(-15deg)', transition: 'all 0.3s'
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
