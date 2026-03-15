'use client'
import dynamic from 'next/dynamic'
import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameStore } from '@/store/gameStore'
import { OperationMode } from '@/types'
import GameLockScreen from './GameLockScreen'
import { Settings2 } from 'lucide-react'

const MathGame = dynamic(() => import('./ApiMathGame'), { ssr: false })
const MemoryGridGame = dynamic(() => import('./MemoryGridGame'), { ssr: false })

const CUSTOM_OP_CHOICES: { label: string; value: OperationMode }[] = [
  { label: 'Addition', value: 'addition' },
  { label: 'Subtraction', value: 'subtraction' },
  { label: 'Multiplication', value: 'multiplication' },
  { label: 'Division', value: 'division' },
]

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const { isLocked } = useAttempts()
  const gameType = useGameStore(s => s.gameType)
  const setGameType = useGameStore(s => s.setGameType)
  const operation = useGameStore(s => s.operation)

  // Sync store from URL so navigation to /game?mode=memory works
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'memory') setGameType('memory')
  }, [searchParams, setGameType])

  // Use URL for first paint so memory game shows immediately on reload (no blank flash)
  const modeParam = searchParams.get('mode')
  const opParam = searchParams.get('op')
  const effectiveGameType = modeParam === 'memory' ? 'memory' : gameType

  const setOperation = useGameStore(s => s.setOperation)
  const customOperations = useGameStore(s => s.customOperations)
  const toggleCustomOp = useGameStore(s => s.toggleCustomOp)
  const [customOpen, setCustomOpen] = useState(false)

  useGSAP(() => {
    if (!boardRef.current) return
    gsap.from(boardRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
  }, [])

  const isCustom = operation === 'custom'

  // If user lands directly on /game?op=custom, open the custom panel and
  // keep the user in configuration mode instead of immediately starting a game.
  useEffect(() => {
    if (opParam === 'custom') {
      setCustomOpen(true)
      setOperation('custom')
    }
  }, [opParam, setOperation])

  if (isLocked) return <GameLockScreen />

  return (
    <div
      ref={boardRef}
      className="overflow-x-hidden bg-[var(--bg-surface)] min-h-0 flex flex-col"
      style={{
        minHeight: '100dvh',
        paddingTop: '12px',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        position: 'relative',
      }}
    >
      {/* Game only */}
      <main
        id="live-game-area"
        className="mx-auto w-full max-w-[720px] md:max-w-[880px] lg:max-w-[1040px] px-2 py-4 sm:px-4 sm:py-6"
      >
        <div
          className="card relative w-full border-zinc-800 bg-zinc-900/30 px-2 py-3 sm:px-4 sm:py-4"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {effectiveGameType === 'memory' ? (
            <MemoryGridGame />
          ) : opParam === 'custom' ? (
            <div className="w-full text-center text-xs sm:text-sm text-slate-400 py-6">
              Select which operations you want to include in your custom game using the panel below,
              then return to the home screen and press Play to start.
            </div>
          ) : (
            <MathGame />
          )}
        </div>
      </main>

      {/* Custom game bar (math only) */}
      {effectiveGameType === 'math' && (
      <div
        className="fixed left-0 right-0 bottom-0 z-40 border-t border-zinc-800 bg-[var(--bg-surface)]"
        style={{
          maxWidth: '1040px',
          margin: '0 auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCustomOpen((o) => !o)
            if (!customOpen) setOperation('custom')
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold transition-colors"
          style={{
            color: isCustom ? 'var(--accent-orange)' : 'rgba(148,163,184,0.9)',
            borderBottom: customOpen ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <Settings2 size={18} />
          Custom game — choose operations
        </button>
        {customOpen && (
          <div className="px-3 pb-3 pt-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              Include: (e.g. only × & ÷ or only + & −)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CUSTOM_OP_CHOICES.map(({ label, value }) => {
                const on = customOperations.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleCustomOp(value)}
                    className={`text-sm px-3 py-2 rounded-full border transition-colors ${
                      on
                        ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)] text-[var(--accent-orange)]'
                        : 'border-zinc-700 bg-zinc-800/50 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
