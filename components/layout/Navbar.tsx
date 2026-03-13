'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAttempts } from '@/hooks/useAttempts'
import { formatTime } from '@/lib/utils'

export default function Navbar() {
  const { used, max, timeToReset } = useAttempts()
  const remaining = max - used
  const pathname  = usePathname()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div className="nav-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href='/' style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', position: 'relative', zIndex: 200 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            background: 'rgba(0, 240, 255, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.2)'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
          </div>
          <span className="nav-brand-text" style={{ fontWeight: 800, color: '#fff', fontSize: '18px', letterSpacing: '0.04em', fontFamily: 'var(--font-sans)', textShadow: '0 0 12px rgba(255,255,255,0.3)' }}>
            AI<span style={{ color: 'var(--accent-cyan)' }}>GAMES</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ href: '/', label: 'Home' }, { href: '/game', label: 'Play' }].map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link" style={{
              borderRadius: '8px', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
              background: pathname === href ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: pathname === href ? '#fff' : 'rgba(255,255,255,0.5)',
              border: pathname === href ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right: attempts + timer + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'none', '@media (minWidth: 480px)': { display: 'flex' }, alignItems: 'center', gap: '8px' } as any}>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
              {remaining}/{max}
            </span>
            <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
            {formatTime(timeToReset)}
          </span>
          <Link href='/game' style={{
            padding: '6px 12px', borderRadius: '6px',
            background: '#fff', color: '#000',
            fontSize: '11px', fontWeight: 700, textDecoration: 'none',
            marginLeft: '4px', whiteSpace: 'nowrap'
          }}>
            Play →
          </Link>
        </div>
      </div>
    </nav>
  )
}
