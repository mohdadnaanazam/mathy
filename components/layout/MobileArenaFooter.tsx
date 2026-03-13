'use client'

import { useRouter, usePathname } from 'next/navigation'

export function MobileArenaFooter() {
  const router = useRouter()
  const pathname = usePathname()

  const items = [
    { label: 'Arena', path: '/' },
    { label: 'Compete', path: '/game' },
    { label: 'Quests', path: '/game' },
    { label: 'Feed', path: '/game' },
    { label: 'More', path: '/game' },
  ] as const

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        borderTop: '1px solid #18181b',
        backgroundColor: '#050505',
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
              color: isActive ? '#22c55e' : 'rgba(148,163,184,0.9)',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                border: '1px solid rgba(63,63,70,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                boxShadow: 'none',
              }}
            >
              {item.label === 'Arena' && '✦'}
              {item.label === 'Compete' && '🏆'}
              {item.label === 'Quests' && '📜'}
              {item.label === 'Feed' && '▢'}
              {item.label === 'More' && '⋯'}
            </span>
            <span style={{ position: 'relative' }}>
              {item.label}
              {item.label === 'Quests' && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: -14,
                    padding: '1px 4px',
                    borderRadius: '999px',
                    backgroundColor: '#ef4444',
                    color: '#fef2f2',
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  0/3
                </span>
              )}
            </span>
          </button>
        )})}
      </div>
    </nav>
  )
}

export default MobileArenaFooter

