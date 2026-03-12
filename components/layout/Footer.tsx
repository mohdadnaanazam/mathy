'use client'
import Link from 'next/link'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function Footer() {
  const { timeToReset } = useAttempts()

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '28px 24px',
      background: '#000',
    }}>
      <div className='container' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧠</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>AI GAMES</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href='/' style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}>Home</Link>
          <Link href='/game' style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}>Play</Link>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>
          resets in {formatTime(timeToReset)}
        </span>
      </div>
    </footer>
  )
}
