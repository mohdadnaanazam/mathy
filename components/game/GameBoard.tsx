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
import { Difficulty, OperationMode } from '@/types'
import GameLockScreen from './GameLockScreen'
import MobileArenaFooter from '@/components/layout/MobileArenaFooter'

const MathGame = dynamic(() => import('./MathGame'), { ssr: false })

const OPERATION_TOGGLES: { label: string; value: OperationMode }[] = [
  { label: 'Addition',       value: 'addition' },
  { label: 'Subtraction',    value: 'subtraction' },
  { label: 'Multiplication', value: 'multiplication' },
  { label: 'Division',       value: 'division' },
  { label: 'Mixture',        value: 'mixture' },
]
const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: 'Easy',   value: 'easy'   },
  { label: 'Med',    value: 'medium' },
  { label: 'Hard',   value: 'hard'   },
]

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)

  const difficulty    = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)
  const operation     = useGameStore(s => s.operation)
  const setOperation  = useGameStore(s => s.setOperation)

  const { isLocked } = useAttempts()

  useGSAP(() => {
    if (!boardRef.current) return
    gsap.from(boardRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
  }, [])

  if (isLocked) return <GameLockScreen />

  return (
    <div
      ref={boardRef}
      className="overflow-x-hidden bg-[var(--bg-surface)]"
      style={{
        minHeight: '100vh',
        paddingTop: '56px',
        paddingBottom: '64px', // space for bottom nav
        position: 'relative',
      }}
    >
      {/* Arena header (visible on phone and desktop) */}
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-4 mt-4 space-y-4 sm:space-y-5">
        {/* Top timer pill with Play button */}
        <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          {/* Status orb */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent-orange-muted)] border border-[rgba(249,115,22,0.3)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)]" />
          </div>

          <div className="flex-1 flex justify-center items-center pointer-events-none">
            <span className="font-mono text-xs sm:text-[13px] tracking-[0.2em] text-slate-400">
              38:08
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const anchor = document.getElementById('live-game-area')
              if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--accent-orange)',
              color: '#111827',
              border: '1px solid var(--accent-orange-hover)',
              boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
            }}
          >
            Play
            <span className="text-sm">→</span>
          </button>
        </div>
        {/* Kick off quest card (simplified like homepage cards) */}
        <div className="card px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="section-label">Kick off quest</div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
              Daily
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-slate-100">
            Complete all tasks
          </p>
          <p className="mb-3 text-xs text-slate-400">
            Earn your welcome rewards by finishing today&apos;s practice.
          </p>
          <button
            type="button"
            className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-success)] hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => {
              const anchor = document.getElementById('live-game-area')
              if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Jump into a round &rarr;
          </button>
        </div>

        {/* Duels header and game type tabs */}
        <div className="space-y-3 w-full min-w-0">
          <div
            className="flex flex-wrap items-center justify-between gap-2"
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
            className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full"
          >
            {[
              { label: 'Addition', value: 'addition' as OperationMode },
              { label: 'Subtraction', value: 'subtraction' as OperationMode },
              { label: 'Multiplication', value: 'multiplication' as OperationMode },
              { label: 'Division', value: 'division' as OperationMode },
              { label: 'Mixture', value: 'mixture' as OperationMode },
            ].map(tab => {
              const isActive = operation === tab.value
              return (
                <button
                  key={tab.label}
                  onClick={() => setOperation(tab.value)}
                  className="text-[9px] sm:text-xs shrink-0 px-2 py-1 sm:px-2 sm:py-1.5"
                  style={{
                    borderRadius: '999px',
                    border: isActive
                      ? '1px solid rgba(249,115,22,0.5)'
                      : '1px solid var(--border-subtle)',
                    background: isActive ? 'var(--accent-orange-muted)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--accent-orange)' : 'rgba(156,163,175,1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary duel card (mobile focus) */}
        <div className="space-y-3" style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(148,163,184,0.9)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Math
          </div>
          <button
            className="card card-interactive w-full text-left p-4 sm:p-5"
            onClick={() => {
              setDifficulty('medium')
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
                Sprint Duels
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
              Race to solve the most in 1 minute
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
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] md:sticky md:top-[64px] md:z-40">
        <div
          className="mx-auto flex min-h-[48px] sm:min-h-[52px] w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-0 lg:px-4"
        >
          <AttemptTracker />
          <RefreshCountdown />
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:gap-6 md:py-8 lg:flex-row lg:px-6 lg:max-w-5xl">

        {/* Left: game area */}
        <main id="live-game-area" className="flex-1 min-w-0">

          {/* Selectors row */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">

            {/* Operation mode toggle */}
            <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1.5 w-full sm:w-auto min-w-0">
              {OPERATION_TOGGLES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setOperation(value)}
                  className={`toggle-btn ${operation === value ? 'toggle-active' : 'toggle-inactive'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Difficulty toggle */}
            <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1.5 shrink-0">
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
          </div>

          {/* Game canvas */}
          <div
            className="card relative w-full max-w-[380px] mx-auto border-zinc-800 bg-zinc-900/30 px-3 py-4 sm:px-4 sm:py-5"
            style={{
              marginTop: '4px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            }}
          >
            <MathGame />
          </div>
        </main>

        {/* Right: sidebar */}
        <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 md:gap-5">

          {/* Score */}
          <div className='card' style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <ScoreDisplay />
          </div>

          {/* Instructions */}
          <div className='card' style={{ padding: '22px 20px' }}>
            <div className='section-label' style={{ marginBottom: '12px' }}>How to play</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Type your answer with the keypad',
                'Build streaks for point multipliers',
                'Beat the 90s countdown timer',
              ].map(t => (
                <li key={t} className="flex gap-2 text-sm text-slate-400" style={{ lineHeight: 1.5 }}>
                  <span className="text-slate-500">•</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Session info */}
          <div className='card' style={{ padding: '22px 20px' }}>
            <div className='section-label' style={{ marginBottom: '12px' }}>Session Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Active mode</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  {operation.charAt(0).toUpperCase() + operation.slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Difficulty</span>
                <span style={{ color: '#fff', textTransform: 'capitalize', fontWeight: 700 }}>{difficulty}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav to mirror phone UI */}
      <MobileArenaFooter />
    </div>
  )
}
