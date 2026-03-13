'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Trophy, ScrollText, Square, MoreHorizontal } from 'lucide-react'

export function MobileArenaFooter() {
  const router = useRouter()
  const pathname = usePathname()

  const items = [
    { label: 'Arena', path: '/', icon: Home },
    { label: 'Compete', path: '/game', icon: Trophy },
    { label: 'Quests', path: '/game', icon: ScrollText },
    { label: 'Feed', path: '/game', icon: Square },
    { label: 'More', path: '/game', icon: MoreHorizontal },
  ] as const

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        borderTop: '1px solid #18181b',
        backgroundColor: '#000000',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 18px 12px',
          maxWidth: '420px',
          margin: '0 auto',
        }}
      >
        {items.map(item => {
          const isActive = pathname === item.path || (item.label === 'Arena' && pathname === '/')
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontFamily: 'var(--font-mono)',
                color: isActive ? '#22c55e' : '#16a34a',
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: '1px solid rgba(63,63,70,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive
                    ? '0 0 0 1px rgba(34,197,94,0.45)'
                    : 'none',
                  backgroundColor: '#000000',
                }}
              >
                <Icon size={13} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span style={{ position: 'relative' }}>
                {item.label}
                {item.label === 'Quests' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -18,
                      padding: '1px 5px',
                      borderRadius: 999,
                      backgroundColor: '#ef4444',
                      color: '#fef2f2',
                      fontSize: 8,
                      fontWeight: 700,
                    }}
                  >
                    0/3
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileArenaFooter

