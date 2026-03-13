'use client'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import ScoreDisplay from './ScoreDisplay'
import AttemptTracker from './AttemptTracker'
import RefreshCountdown from './RefreshCountdown'
import { GameType, Difficulty } from '@/types'
import GameLockScreen from './GameLockScreen'
import MobileArenaFooter from '@/components/layout/MobileArenaFooter'

const MathGame = dynamic(() => import('./MathGame'), { ssr: false })

const MemoryGame = dynamic(() => import('./MemoryGame'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{
        width: '40px', height: '40px', border: '3px solid rgba(0, 240, 255, 0.1)',
        borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
    </div>
  ),
})

const GAME_TYPES: { label: string; value: GameType }[] = [
  { label: '➕ Math',   value: 'math'   },
  { label: '🧩 Memory', value: 'memory' },
]
const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: 'Easy',   value: 'easy'   },
  { label: 'Med',    value: 'medium' },
  { label: 'Hard',   value: 'hard'   },
]

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)

  const gameType    = useGameStore(s => s.gameType)
  const setGameType = useGameStore(s => s.setGameType)
  const difficulty  = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)

  const { isLocked } = useAttempts()

  useGSAP(() => {
    if (!boardRef.current) return
    gsap.from(boardRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
  }, [])

  if (isLocked) return <GameLockScreen />

  return (
    <div
      ref={boardRef}
      style={{
        minHeight: '100vh',
        paddingTop: '56px',
        paddingBottom: '80px', // space for mobile bottom nav
        position: 'relative',
      }}
    >
      
      {/* Background radial glow specific to the game view */}
      <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] md:w-[800px] md:h-[800px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)' }}
      />

      {/* Mobile "arena" header */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 md:hidden mt-4 space-y-6">
        {/* Top timer pill with Play button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 10px 10px 6px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #020617, #020617)',
            boxShadow: '0 16px 40px rgba(15,23,42,0.9)',
            border: '1px solid rgba(15,23,42,1)',
          }}
        >
          {/* Glowing status orb */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              background:
                'radial-gradient(circle at 30% 20%, rgba(34,197,235,0.9), rgba(15,23,42,1))',
              boxShadow:
                '0 0 0 2px rgba(15,23,42,1), 0 0 0 6px rgba(15,23,42,1), 0 0 24px rgba(34,197,235,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                backgroundColor: '#22d3ee',
                boxShadow: '0 0 18px rgba(34,211,238,0.9)',
              }}
            />
          </div>

          {/* Center timer text (mirrors in-game timer style) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.25em',
                color: 'rgba(148,163,184,0.9)',
              }}
            >
              38:08
            </span>
          </div>

          {/* Right Play CTA */}
          <button
            type="button"
            onClick={() => {
              const anchor = document.getElementById('live-game-area')
              if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              backgroundColor: '#f9fafb',
              border: '1px solid rgba(15,23,42,0.9)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-urbanist)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#020617',
              boxShadow: '0 10px 28px rgba(15,23,42,0.9)',
            }}
          >
            Play
            <span style={{ fontSize: '14px' }}>→</span>
          </button>
        </div>
        {/* Kick off quest card */}
        <div
          className="card"
          style={{
            padding: '20px 18px',
            borderRadius: '24px',
            background:
              'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(5,6,14,0.95))',
            borderColor: 'rgba(34,197,94,0.24)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(148, 163, 184, 0.9)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
              }}
            >
              Kick off quest
            </div>
            <button
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                padding: '6px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'rgba(226, 232, 240, 0.9)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              View all
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '4px',
                }}
              >
                Complete all tasks
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(209, 213, 219, 0.8)',
                }}
              >
                Earn your welcome rewards
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '999px',
                    border: '1px solid rgba(34,197,94,0.4)',
                    background:
                      'radial-gradient(circle at 30% 20%, rgba(190,242,100,0.4), transparent 55%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#bbf7d0',
                  }}
                >
                  ●
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Duels header and game type tabs */}
        <div className="space-y-3">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(148, 163, 184, 0.9)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Duels
            </div>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(148, 163, 184, 0.9)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Today&apos;s challenge
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {[
              { label: 'Math', value: 'math' as GameType },
              { label: 'Memory', value: 'memory' as GameType },
              { label: 'Puzzle', value: 'math' as GameType },
              { label: 'Classical', value: 'math' as GameType },
            ].map(tab => {
              const isActive = gameType === tab.value
              return (
                <button
                  key={tab.label}
                  onClick={() => setGameType(tab.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: isActive
                      ? '1px solid rgba(34,197,94,0.8)'
                      : '1px solid rgba(31, 41, 55, 1)',
                    background: isActive
                      ? 'radial-gradient(circle at 20% 0%, rgba(34,197,94,0.3), rgba(15,23,42,1))'
                      : 'rgba(15,23,42,0.95)',
                    color: isActive ? '#bbf7d0' : 'rgba(156,163,175,1)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {tab.label === 'Math' && <span>▶</span>}
                  {tab.label === 'Memory' && <span>🧠</span>}
                  {tab.label === 'Puzzle' && <span>▢</span>}
                  {tab.label === 'Classical' && <span>♛</span>}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary duel card (mobile focus) */}
        <div className="space-y-3">
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(148,163,184,0.9)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {gameType === 'math' ? 'Math' : 'Memory'}
          </div>
          <button
            className="card w-full text-left"
            style={{
              padding: '18px 16px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, rgba(15,23,42,1), rgba(2,6,23,1))',
              borderColor: 'rgba(31,41,55,1)',
            }}
            onClick={() => {
              if (gameType === 'math') {
                setDifficulty('medium')
              }
              const anchor = document.getElementById('live-game-area')
              if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {gameType === 'math' ? 'Sprint Duels' : 'Mind Snap Duels'}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'rgba(148,163,184,0.9)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Just played
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(209,213,219,0.85)',
                marginBottom: '6px',
              }}
            >
              {gameType === 'math'
                ? 'Race to solve the most in 1 minute'
                : 'Who can snap faster?'}
            </div>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(148,163,184,0.9)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Tap to enter live game
            </div>
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(3, 0, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: '56px',
          zIndex: 40,
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="mx-auto flex h-[56px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <AttemptTracker />
          <RefreshCountdown />
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:gap-8 md:py-12 lg:flex-row lg:px-8">

        {/* Left: game area */}
        <main id="live-game-area" className="flex-1 min-w-0">

          {/* Selectors row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>

            {/* Game type toggle */}
            <div style={{
              display: 'flex', gap: '4px', padding: '6px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '100px',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {GAME_TYPES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setGameType(value)}
                  className={`toggle-btn ${gameType === value ? 'toggle-active' : 'toggle-inactive'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Difficulty toggle (math only) */}
            {gameType === 'math' && (
              <div style={{
                display: 'flex', gap: '4px', padding: '6px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '100px',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
              }}>
                {DIFFICULTIES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value)}
                    className={`toggle-btn ${difficulty === value ? 'toggle-active' : 'toggle-inactive'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game canvas */}
          <div className='card p-6 md:p-10 lg:p-16 relative' style={{
            boxShadow: gameType === 'math' ? '0 0 80px rgba(0, 240, 255, 0.08) inset, 0 8px 32px rgba(0,0,0,0.4)' : '0 0 80px rgba(255, 0, 127, 0.08) inset, 0 8px 32px rgba(0,0,0,0.4)',
            border: `1px solid ${gameType === 'math' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)'}`
          }}>
            {gameType === 'math' ? <MathGame /> : <MemoryGame />}
          </div>
        </main>

        {/* Right: sidebar */}
        <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-6">

          {/* Score */}
          <div className='card' style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <ScoreDisplay />
          </div>

          {/* Instructions */}
          <div className='card' style={{ padding: '32px' }}>
            <div className='section-label' style={{ marginBottom: '20px' }}>How to play</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(gameType === 'math'
                ? ['Select the correct answer', 'Build streaks for point multipliers', 'Beat the 90s countdown timer']
                : ['Flip two cards at a time', 'Match all emoji pairs correctly', 'Fewer moves = higher final score']
              ).map(t => (
                <li key={t} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: 1.5 }}>
                  <span style={{ color: gameType === 'math' ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}>✦</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Session info */}
          <div className='card' style={{ padding: '32px' }}>
            <div className='section-label' style={{ marginBottom: '20px' }}>Session Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                ['Active Mode',  gameType],
                ['Difficulty', difficulty],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{lbl}</span>
                  <span style={{ color: '#fff', textTransform: 'capitalize', fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav to mirror phone UI */}
      <MobileArenaFooter />
    </div>
  )
}
