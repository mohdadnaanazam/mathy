'use client'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameStore } from '@/store/gameStore'
import { OperationMode } from '@/types'
import GameLockScreen from './GameLockScreen'
import { Settings2 } from 'lucide-react'

const MathGame = dynamic(() => import('./ApiMathGame'), { ssr: false })

const CUSTOM_OP_CHOICES: { label: string; value: OperationMode }[] = [
  { label: 'Addition', value: 'addition' },
  { label: 'Subtraction', value: 'subtraction' },
  { label: 'Multiplication', value: 'multiplication' },
  { label: 'Division', value: 'division' },
]

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const { isLocked } = useAttempts()
  const operation = useGameStore(s => s.operation)
  const setOperation = useGameStore(s => s.setOperation)
  const customOperations = useGameStore(s => s.customOperations)
  const toggleCustomOp = useGameStore(s => s.toggleCustomOp)
  const [customOpen, setCustomOpen] = useState(false)

  useGSAP(() => {
    if (!boardRef.current) return
    gsap.from(boardRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
  }, [])

  const isCustom = operation === 'custom'

  if (isLocked) return <GameLockScreen />

  return (
    <div
      ref={boardRef}
      className="overflow-x-hidden bg-[var(--bg-surface)]"
      style={{
        minHeight: '100vh',
        paddingTop: '56px',
        paddingBottom: '80px',
        position: 'relative',
      }}
    >
      {/* Game only */}
      <main id="live-game-area" className="mx-auto w-full max-w-[420px] px-3 py-6 sm:px-4 sm:py-8">
        <div
          className="card relative w-full border-zinc-800 bg-zinc-900/30 px-3 py-4 sm:px-4 sm:py-5"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          <MathGame />
        </div>
      </main>

      {/* Custom game bar (replaces footer on game page) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-[var(--bg-surface)]"
        style={{ maxWidth: '420px', margin: '0 auto', left: 0, right: 0 }}
      >
        <button
          type="button"
          onClick={() => {
            setCustomOpen((o) => !o)
            if (!customOpen) setOperation('custom')
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold transition-colors"
          style={{
            color: isCustom ? 'var(--accent-orange)' : 'rgba(148,163,184,0.9)',
            borderBottom: customOpen ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <Settings2 size={18} />
          Custom game — choose operations
        </button>
        {customOpen && (
          <div className="px-4 pb-4 pt-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Include: (e.g. only × & ÷ or only + & −)
            </p>
            <div className="flex flex-wrap gap-2">
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
    </div>
  )
}
