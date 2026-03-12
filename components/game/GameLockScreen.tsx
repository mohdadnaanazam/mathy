'use client'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function GameLockScreen() {
  const { timeToReset } = useAttempts()
  const lockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!lockRef.current) return
    gsap.from(lockRef.current, { opacity: 0, y: 32, duration: 0.7, ease: 'power3.out' })
  }, [])

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative'
    }}>
      
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 0, 127, 0.1) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: -1
      }} />

      <div ref={lockRef} className='card' style={{ textAlign: 'center', maxWidth: '480px', padding: '64px 40px', border: '1px solid rgba(255, 0, 127, 0.2)' }}>

        {/* Lock icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '72px', marginBottom: '28px', filter: 'drop-shadow(0 0 20px rgba(255, 0, 127, 0.4))' }}
        >
          🔒
        </motion.div>

        <div className='section-label' style={{ marginBottom: '16px', justifyContent: 'center', color: 'var(--accent-pink)' }}>
          Energy Depleted
        </div>

        <h2 style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.03em',
          lineHeight: 0.95,
          marginBottom: '24px',
        }}>
          Recharging<br />
          <span style={{ color: 'rgba(255, 0, 127, 0.5)' }}>systems...</span>
        </h2>

        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '48px' }}>
          You've completed all 15 games for this hour.<br />
          Your energy automatically restores every hour.
        </p>

        {/* Countdown */}
        <div style={{
          background: 'rgba(255, 0, 127, 0.05)',
          border: '1px solid rgba(255, 0, 127, 0.2)',
          borderRadius: '24px',
          padding: '32px 48px',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 0 40px rgba(255, 0, 127, 0.05) inset, 0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div className='section-label' style={{ color: 'var(--accent-pink)' }}>Online In</div>
          <div style={{
            fontSize: '56px', fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: '#fff', letterSpacing: '-0.05em', lineHeight: 1,
            textShadow: '0 0 20px rgba(255, 0, 127, 0.4)'
          }}>
            {formatTime(timeToReset)}
          </div>
        </div>
      </div>
    </div>
  )
}
