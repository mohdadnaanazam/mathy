'use client'

export function MobileArenaFooter() {
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
        {[
          { label: 'Arena', active: true },
          { label: 'Compete', active: false },
          { label: 'Quests', active: false },
          { label: 'Feed', active: false },
          { label: 'More', active: false },
        ].map(item => (
          <button
            key={item.label}
            type="button"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-mono)',
              color: item.active ? '#a7f3d0' : 'rgba(148,163,184,0.9)',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                border: item.active
                  ? '1px solid rgba(74,222,128,0.9)'
                  : '1px solid rgba(31,41,55,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                boxShadow: item.active
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
        ))}
      </div>
    </nav>
  )
}

export default MobileArenaFooter

