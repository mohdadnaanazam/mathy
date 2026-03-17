'use client'
import dynamic from 'next/dynamic'
import { useRef, useEffect, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAttempts } from '@/hooks/useAttempts'
import { useGameTimer } from '@/hooks/useGameTimer'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'
import { useGameStore } from '@/store/gameStore'
import { useGameRefreshStore } from '@/store/gameRefreshStore'
import { clearGameCache, resetAllProgress, setSelectedGameCount } from '@/lib/db'
import { fetchAndCacheAllGames } from '@/lib/refreshGames'
import GameLockScreen from './GameLockScreen'

const MathGame = dynamic(() => import('./ApiMathGame'), { ssr: false })
const MemoryGridGame = dynamic(() => import('./MemoryGridGame'), { ssr: false })
const TrueFalseMathGame = dynamic(() => import('./TrueFalseMathGame'), { ssr: false })

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLocked } = useAttempts()
  const { isRefreshing: gamesExpired } = useGameTimer()
  const { isSessionExpired, resetAndResume } = useSessionExpiry()
  const gameType = useGameStore(s => s.gameType)
  const setGameType = useGameStore(s => s.setGameType)

  const setLastFetchAt = useGameRefreshStore(s => s.setLastFetchAt)
  const [isReloading, setIsReloading] = useState(false)

  const handleReload = useCallback(async () => {
    if (isReloading) return
    setIsReloading(true)
    try {
      if (isSessionExpired) await resetAndResume()
      await resetAllProgress()
      await setSelectedGameCount(5)
      await clearGameCache()
      const now = await fetchAndCacheAllGames()
      setLastFetchAt(now)
    } catch {
      router.push('/')
    } finally {
      setIsReloading(false)
    }
  }, [isReloading, isSessionExpired, resetAndResume, setLastFetchAt, router])

  // Read URL params once per render as simple primitives
  // so we can use them safely in effects without depending on
  // the full SearchParams object (which is unstable).
  const modeParam = searchParams.get('mode')
  const opParam = searchParams.get('op')

  // Sync store from URL so navigation to /game?mode=memory works,
  // but only when the primitive modeParam value actually changes.
  useEffect(() => {
    if (modeParam === 'memory') setGameType('memory')
    else if (modeParam === 'truefalse') setGameType('true_false')
  }, [modeParam, setGameType])
  const effectiveGameType = modeParam === 'memory' ? 'memory' : modeParam === 'truefalse' ? 'true_false' : gameType

  const setOperation = useGameStore(s => s.setOperation)
  const customOperations = useGameStore(s => s.customOperations)

  useGSAP(() => {
    if (!boardRef.current) return
    gsap.from(boardRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
  }, [])

  // If user lands directly on /game?op=custom, sync the store.
  useEffect(() => {
    if (opParam === 'custom') {
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
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'relative',
      }}
    >
      {/* Non-blocking banner when new games are available */}
      {(gamesExpired || isSessionExpired) && (
        <div className="mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4 sm:px-6 pt-1 pb-2">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-center justify-between gap-2">
            <p className="text-[10px] text-amber-400 leading-snug">
              ⚡ New games available
            </p>
            <button
              type="button"
              disabled={isReloading}
              onClick={handleReload}
              className="shrink-0 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-wider disabled:opacity-60"
              style={{ backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid rgba(63,63,70,0.6)' }}
            >
              {isReloading ? 'Loading…' : 'Reload'}
            </button>
          </div>
        </div>
      )}

      {/* Game */}
      <main
        id="live-game-area"
        className="flex-1 mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4 sm:px-6 py-6 sm:py-10 flex items-center justify-center"
      >
        <div
          className="card relative w-full border-zinc-800 bg-zinc-900/40 px-4 py-5 sm:px-6 sm:py-6 rounded-2xl"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
          }}
        >
          {effectiveGameType === 'memory' ? (
            <MemoryGridGame />
          ) : effectiveGameType === 'true_false' ? (
            <TrueFalseMathGame />
          ) : opParam === 'custom' && (!customOperations || customOperations.length === 0) ? (
            <div className="w-full text-center text-xs sm:text-sm text-slate-400 py-6">
              Select operations on the home screen, then press Play to start a custom game.
            </div>
          ) : (
            <MathGame />
          )}
        </div>
      </main>
    </div>
  )
}
