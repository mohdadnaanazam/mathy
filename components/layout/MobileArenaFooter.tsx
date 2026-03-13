'use client'

import { useRouter, usePathname } from 'next/navigation'

export function MobileArenaFooter() {
  const router = useRouter()
  const pathname = usePathname()

  const items = [
    { label: 'Arena', path: '/' },
    { label: 'Compete', path: '/game' },
    // Placeholder paths for now – can be wired up later
    { label: 'Quests', path: '/game' },
    { label: 'Feed', path: '/game' },
    { label: 'More', path: '/game' },
  ] as const

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40"
      style={{
        borderTop: '1px solid rgba(15,23,42,1)',
        background: 'linear-gradient(to top, #020617, #020617)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 12px 16px',
        }}
      >
        {items.map(item => {
          const isActive = pathname === item.path || (item.label === 'Arena' && pathname === '/')
          return (
          <button
            key={item.label}
            type="button"
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-mono)',
              color: isActive ? '#a7f3d0' : 'rgba(148,163,184,0.9)',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                border: isActive
                  ? '1px solid rgba(74,222,128,0.9)'
                  : '1px solid rgba(31,41,55,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                boxShadow: isActive
                  ? '0 0 16px rgba(74,222,128,0.7)'
                  : 'none',
              }}
            >
              {item.label === 'Arena' && '✦'}
              {item.label === 'Compete' && '⚔'}
              {item.label === 'Quests' && '🎯'}
              {item.label === 'Feed' && '☰'}
              {item.label === 'More' && '⋯'}
            </span>
            <span>{item.label}</span>
          </button>
        )})}
      </div>
    </nav>
  )
}

export default MobileArenaFooter

