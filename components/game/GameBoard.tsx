'use client'
import dynamic from 'next/dynamic'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import { useGameStore } from '@/store/gameStore'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { OperationMode } from '@/types'
import { clearGameCache } from '@/lib/db'
import { fetchAndCacheAllGames } from '@/lib/refreshGames'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLocked } = useAttempts()
  const { isRefreshing: gamesExpired } = useGameTimer()
  const { isSessionExpired } = useSessionExpiry()
  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)
  const gameType = useGameStore(s => s.gameType)
  const setGameType = useGameStore(s => s.setGameType)
  const operation = useGameStore(s => s.operation)
  const [isReloading, setIsReloading] = useState(false)

  const handleReload = useCallback(async () => {
    if (isReloading) return
    setIsReloading(true)
    try {
      await clearGameCache()
      const now = await fetchAndCacheAllGames()
      setLastFetchAt(now)
      // After reload, navigate back to home so user can start fresh
      router.push('/')
    } catch {
      // On failure, send to home anyway
      router.push('/')
    } finally {
      setIsReloading(false)
    }
  }, [isReloading, setLastFetchAt, router])

  // Read URL params once per render as simple primitives
  // so we can use them safely in effects without depending on
  // the full SearchParams object (which is unstable).
  const modeParam = searchParams.get('mode')
  const opParam = searchParams.get('op')

  // Sync store from URL so navigation to /game?mode=memory works,
  // but only when the primitive modeParam value actually changes.
  useEffect(() => {
    if (modeParam === 'memory') setGameType('memory')
  }, [modeParam, setGameType])
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

  if (gamesExpired || isSessionExpired) {
    return (
      <div
        className="overflow-x-hidden bg-[var(--bg-surface)] min-h-0 flex flex-col items-center justify-center py-12 px-4"
        style={{ minHeight: '100dvh' }}
      >
        <p className="text-sm text-slate-300 text-center mb-4">
          {isSessionExpired
            ? 'Your session has expired. Reload to refresh game questions.'
            : 'Games have expired. Tap Reload to load new games.'}
        </p>
        <button
          type="button"
          onClick={handleReload}
          disabled={isReloading}
          className="rounded-full border border-[var(--accent-orange)] bg-[var(--accent-orange)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-900 disabled:opacity-60"
        >
          {isReloading ? 'Reloading…' : 'Reload'}
        </button>
      </div>
    )
  }

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
        className="flex-1 mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4 sm:px-6 py-6 sm:py-10 flex items-start justify-center"
      >
        <div
          className="card relative w-full border-zinc-800 bg-zinc-900/40 px-4 py-5 sm:px-6 sm:py-6 rounded-2xl"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
          }}
        >
          {effectiveGameType === 'memory' ? (
            <MemoryGridGame />
          ) : opParam === 'custom' && (!customOperations || customOperations.length === 0) ? (
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
