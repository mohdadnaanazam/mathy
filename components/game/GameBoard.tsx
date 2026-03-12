'use client'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import MathGame from './MathGame'
import GameLockScreen from './GameLockScreen'
import ScoreDisplay from './ScoreDisplay'
import AttemptTracker from './AttemptTracker'
import RefreshCountdown from './RefreshCountdown'
import { GameType, Difficulty } from '@/types'

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
    <div ref={boardRef} style={{ minHeight: '100vh', paddingTop: '56px', position: 'relative' }}>
      
      {/* Background radial glow specific to the game view */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: -1
      }} />

      {/* Status bar */}
      <div style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(3, 0, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: '56px', zIndex: 40,
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)'
      }}>
        <div className='container' style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AttemptTracker />
          <RefreshCountdown />
        </div>
      </div>

      {/* Main layout */}
      <div className='container' style={{ padding: '48px 32px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

        {/* Left: game area */}
        <main style={{ flex: '1 1 600px', minWidth: 0 }}>

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
          <div className='card' style={{
            padding: '64px 40px',
            position: 'relative',
            boxShadow: gameType === 'math' ? '0 0 80px rgba(0, 240, 255, 0.08) inset, 0 8px 32px rgba(0,0,0,0.4)' : '0 0 80px rgba(255, 0, 127, 0.08) inset, 0 8px 32px rgba(0,0,0,0.4)',
            border: `1px solid ${gameType === 'math' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)'}`
          }}>
            {gameType === 'math' ? <MathGame /> : <MemoryGame />}
          </div>
        </main>

        {/* Right: sidebar */}
        <aside style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
    </div>
  )
}
