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
import { useSignupBanner } from '@/hooks/useSignupBanner'
import GameLockScreen from './GameLockScreen'
import SignupBanner from './SignupBanner'
import AchievementModal from './AchievementModal'
import { useAchievement } from '@/hooks/useAchievement'
import { useDailyStreak } from '@/hooks/useDailyStreak'
import StreakBadge from './StreakBadge'
import StreakModal from './StreakModal'

const MathGame = dynamic(() => import('./ApiMathGame'), { ssr: false })
const MemoryGridGame = dynamic(() => import('./MemoryGridGame'), { ssr: false })
const TrueFalseMathGame = dynamic(() => import('./TrueFalseMathGame'), { ssr: false })
const MoreGame = dynamic(() => import('./MoreGame'), { ssr: false })
const SscCglGame = dynamic(() => import('./SscCglGame'), { ssr: false })
const TicTacToeGame = dynamic(() => import('./TicTacToeGame'), { ssr: false })
const SpeedSortGame = dynamic(() => import('./SpeedSortGame'), { ssr: false })

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

  // ── Achievement system ─────────────────────────────────────────────
  const { reportGameComplete, showCelebration, dismissCelebration, achievementGames } =
    useAchievement()
  const { currentStreak, longestStreak, lastPlayedDate, justIncreased, clearJustIncreased, recordPlay } = useDailyStreak()
  const [streakModalOpen, setStreakModalOpen] = useState(false)

  // Wrap reportGameComplete to also record daily streak
  const handleGameComplete = useCallback((gameLabel: string) => {
    reportGameComplete(gameLabel)
    recordPlay()
  }, [reportGameComplete, recordPlay])

  // ── Signup banner ──────────────────────────────────────────────────
  // TEMP DISABLED: Signup/Login flow (will be re-enabled later)
  const { showBanner: _showBanner, markFirstGamePlayed: _markFirstGamePlayed, closeBanner, markSignedUp } =
    useSignupBanner()
  const showBanner = false
  const markFirstGamePlayed = async () => {} // no-op

  /**
   * Placeholder: replace this body with your Supabase Google OAuth call
   * when you're ready to enable authentication.
   */
  async function handleGoogleSignup() {
    // TODO: await supabase.auth.signInWithOAuth({ provider: 'google' })
    // On success:
    // await markSignedUp()
    console.info('[SignupBanner] Google sign-in triggered — integrate Supabase OAuth here.')
  }
  // ──────────────────────────────────────────────────────────────────

  const handleReload = useCallback(async () => {
    if (isReloading) return
    setIsReloading(true)
    try {
      if (isSessionExpired) await resetAndResume()
      await resetAllProgress()
      await setSelectedGameCount(10)
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
    else if (modeParam === 'ssccgl') setGameType('ssc_cgl')
    else if (modeParam === 'tictactoe') setGameType('math') // placeholder; TicTacToeGame is self-contained
    else if (modeParam === 'more') setGameType('square_root') // placeholder; MoreGame reads type from URL
  }, [modeParam, setGameType])
  const effectiveGameType = modeParam === 'memory' ? 'memory' : modeParam === 'truefalse' ? 'true_false' : modeParam === 'ssccgl' ? 'ssc_cgl' : modeParam === 'tictactoe' ? 'tictactoe' : modeParam === 'more' ? 'more' : gameType

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
      {/* Optional non-blocking hint when new games are available */}
      {(gamesExpired || isSessionExpired) && (
        <div className="mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4 sm:px-6 pt-1 pb-2">
          <div className="rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-3 py-2 flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-500 leading-snug">
              Fresh games available
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
        className="flex-1 mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl px-2.5 sm:px-6 py-3 sm:py-10 flex items-center justify-center"
      >
        <div
          className="card relative w-full border-zinc-800 bg-zinc-900/40 px-3 py-3.5 sm:px-6 sm:py-6 rounded-2xl"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
          }}
        >
          {/* Streak badge */}
          <div className="flex justify-end mb-2">
            <StreakBadge streak={currentStreak} justIncreased={justIncreased} onClick={() => setStreakModalOpen(true)} />
          </div>
          {effectiveGameType === 'memory' ? (
            <MemoryGridGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
          ) : effectiveGameType === 'true_false' ? (
            <TrueFalseMathGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
          ) : effectiveGameType === 'ssc_cgl' ? (
            <SscCglGame />
          ) : effectiveGameType === 'tictactoe' ? (
            <TicTacToeGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
          ) : effectiveGameType === 'more' ? (
            searchParams.get('type') === 'speed_sort'
              ? <SpeedSortGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
              : <MoreGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
          ) : opParam === 'custom' && (!customOperations || customOperations.length === 0) ? (
            <div className="w-full text-center text-xs sm:text-sm text-slate-400 py-6">
              Select operations on the home screen, then press Play to start a custom game.
            </div>
          ) : (
            <MathGame onFirstGameComplete={markFirstGamePlayed} onPerfectScore={handleGameComplete} />
          )}
        </div>
      </main>

      {/* TEMP DISABLED: Signup/Login flow (will be re-enabled later)
      <SignupBanner
        show={showBanner}
        onSignup={handleGoogleSignup}
        onClose={closeBanner}
      /> */}

      {/* Achievement celebration overlay */}
      {showCelebration && achievementGames && (
        <AchievementModal
          games={achievementGames}
          onClose={dismissCelebration}
          onPlayNext={() => {
            dismissCelebration()
            router.push('/')
          }}
        />
      )}

      {/* Streak detail modal */}
      <StreakModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        lastPlayedDate={lastPlayedDate}
      />
    </div>
  )
}
