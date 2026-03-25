'use client'

import { Calculator, Grid3X3, CheckCircle, BookOpen, Gamepad2 } from 'lucide-react'
import { useHomePageState, type ModeLabel } from '@/hooks/useHomePageState'
import { useUserUUID } from '@/hooks/useUserUUID'
import type { OperationMode } from '@/types'
import GameCard from '@/components/home/GameCard'
import DifficultyPills from '@/components/home/DifficultyPills'
import StatusBanner from '@/components/home/StatusBanner'
import FloatingPlayButton from '@/components/home/FloatingPlayButton'
import TopBanner from '@/components/home/TopBanner'
import ResetScoreButton from '@/components/home/ResetScoreButton'
import RefreshBanner from '@/components/ui/RefreshBanner'
import MoreGamesButton from '@/components/home/MoreGamesButton'
import LeaderboardButton from '@/components/home/LeaderboardButton'

const OP_BUTTONS: { symbol: string; label: ModeLabel }[] = [
  { symbol: '+', label: 'Addition' },
  { symbol: '−', label: 'Subtraction' },
  { symbol: '×', label: 'Multiplication' },
  { symbol: '÷', label: 'Division' },
  { symbol: 'Mix', label: 'Mixture' },
  { symbol: '⚙', label: 'Custom' },
]

const CUSTOM_OP_CHOICES: { label: string; value: OperationMode }[] = [
  { label: '+', value: 'addition' },
  { label: '−', value: 'subtraction' },
  { label: '×', value: 'multiplication' },
  { label: '÷', value: 'division' },
]

export default function LandingPage() {
  const s = useHomePageState()
  const { username, avatar, loading: userLoading } = useUserUUID()

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'max(4.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}
    >
      {/* Top banner */}
      <TopBanner />

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-3 sm:py-6">
        <div className="mx-auto max-w-2xl px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* DiceBear avatar */}
            {!userLoading && avatar && (
              <img
                src={avatar}
                alt={username || 'Avatar'}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[var(--border-subtle)] bg-zinc-800 shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Mathy</h1>
                {!userLoading && username && (
                  <span className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate max-w-[100px] sm:max-w-[140px]">
                    {username}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">Train your brain with free math and memory games</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LeaderboardButton />
            {s.isLocked && (
              <span className="text-[9px] sm:text-[10px] font-mono text-amber-400">
                Limit {s.used}/{s.maxAttempts} · resets {s.timeToReset}
              </span>
            )}
            <ResetScoreButton />
          </div>
        </div>
      </header>

      {/* Status banners */}
      {s.mounted && (
        <StatusBanner
          isSessionExpired={s.isSessionExpired}
          isRefreshing={s.isRefreshing}
          isReloading={s.isReloading}
          hasUnfinishedGames={s.hasUnfinishedGames}
          justReloaded={s.justReloaded}
          onReload={s.handleReload}
          onContinue={s.handleContinue}
        />
      )}

      {/* Refresh countdown */}
      {s.mounted && (s.mathVariantExhausted || s.memoryVariantExhausted || s.tfVariantExhausted || s.tttVariantExhausted) && (
        <div className="mx-auto max-w-2xl px-3 sm:px-6 pt-2 sm:pt-3">
          <RefreshBanner tier={s.refreshTier} formatted={s.refreshFormatted} />
        </div>
      )}

      {/* Game cards */}
      <div className="mx-auto max-w-2xl px-3 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">

        {/* Shared difficulty selector */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Difficulty</p>
          <DifficultyPills value={s.globalDifficulty} onChange={s.setGlobalDifficulty} />
        </div>

        {/* Math Challenge */}
        <GameCard
          id="math"
          isActive={s.activeGame === 'math'}
          onActivate={() => s.setActiveGame('math')}
          icon={<Calculator size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="Math Challenge"
          description="Solve equations. Pick an operation and difficulty, then play."
          difficulty={s.mathDifficulty}
          onDifficultyChange={s.setGlobalDifficulty}
          hideDifficulty
          gamesCount={s.mathGamesCount}
          onDecrement={() => { if (!s.mathVariantExhausted) s.setMathGamesCount(v => Math.max(1, Math.min(v - 1, s.mathVariantRemaining))) }}
          onIncrement={() => { if (!s.mathVariantExhausted) s.setMathGamesCount(v => Math.min(Math.max(v + 1, 1), s.mathVariantRemaining)) }}
          stepperDisabled={s.mathVariantExhausted}
          sessionHydrated={s.mathSessionHydrated}
          variantPlayed={s.mathVariantPlayed}
          variantTotal={s.mathVariantTotal}
          variantRemaining={s.mathVariantRemaining}
          variantExhausted={s.mathVariantExhausted}
          refreshReady={s.refreshReady}
          refreshFormatted={s.refreshFormatted}
        >
          {/* Operation selector */}
          <div className="flex flex-wrap gap-1 mb-3">
            {OP_BUTTONS.map(item => {
              const active = s.activeMode === item.label && s.activeGame === 'math'
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); s.setActiveMode(item.label); s.setActiveGame('math') }}
                  className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: active ? 'var(--accent-orange-muted)' : 'rgba(39,39,42,0.5)',
                    border: active ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    color: active ? 'var(--accent-orange)' : '#a1a1aa',
                  }}
                >
                  {item.symbol}
                </button>
              )
            })}
          </div>

          {/* Custom ops */}
          {s.activeMode === 'Custom' && s.activeGame === 'math' && (
            <div className="flex flex-wrap gap-1 mb-3">
              {CUSTOM_OP_CHOICES.map(({ label, value }) => {
                const on = s.customOperations.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); s.toggleCustomOp(value) }}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                      on
                        ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)] text-[var(--accent-orange)]'
                        : 'border-zinc-700 bg-zinc-800/50 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
              <span className="text-[9px] text-slate-600 self-center ml-1">Include</span>
            </div>
          )}
        </GameCard>

        {/* Memory Grid */}
        <GameCard
          id="memory"
          isActive={s.activeGame === 'memory'}
          onActivate={() => s.setActiveGame('memory')}
          icon={<Grid3X3 size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="Memory Grid"
          description="Remember highlighted blocks, then tap them in order. Grid: 3×3 / 4×4 / 5×5"
          difficulty={s.memoryDifficulty}
          onDifficultyChange={s.setGlobalDifficulty}
          hideDifficulty
          gridSizes={{ easy: '3×3', medium: '4×4', hard: '5×5' }}
          gamesCount={s.memoryGamesCount}
          onDecrement={() => { if (!s.memoryVariantExhausted) s.setMemoryGamesCount(v => Math.max(1, Math.min(v - 1, s.memoryVariantRemaining))) }}
          onIncrement={() => { if (!s.memoryVariantExhausted) s.setMemoryGamesCount(v => Math.min(Math.max(v + 1, 1), s.memoryVariantRemaining)) }}
          stepperDisabled={s.memoryVariantExhausted}
          sessionHydrated={s.memorySessionHydrated}
          variantPlayed={s.memoryVariantPlayed}
          variantTotal={s.memoryVariantTotal}
          variantRemaining={s.memoryVariantRemaining}
          variantExhausted={s.memoryVariantExhausted}
          refreshReady={s.refreshReady}
          refreshFormatted={s.refreshFormatted}
        />

        {/* Tic Tac Toe */}
        <GameCard
          id="tictactoe"
          isActive={s.activeGame === 'tictactoe'}
          onActivate={() => s.setActiveGame('tictactoe')}
          icon={<Gamepad2 size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="Tic Tac Toe"
          description="Play against AI — Easy (3×3), Medium (4×4), Hard (5×5). Dynamic grids."
          gridSizes={{ easy: '3×3', medium: '4×4', hard: '5×5' }}
          difficulty={s.tttDifficulty}
          onDifficultyChange={s.setGlobalDifficulty}
          hideDifficulty
          gamesCount={s.tttGamesCount}
          onDecrement={() => { if (!s.tttVariantExhausted) s.setTttGamesCount(v => Math.max(1, Math.min(v - 1, s.tttVariantRemaining))) }}
          onIncrement={() => { if (!s.tttVariantExhausted) s.setTttGamesCount(v => Math.min(Math.max(v + 1, 1), s.tttVariantRemaining)) }}
          stepperDisabled={s.tttVariantExhausted}
          sessionHydrated={s.tttSessionHydrated}
          variantPlayed={s.tttVariantPlayed}
          variantTotal={s.tttVariantTotal}
          variantRemaining={s.tttVariantRemaining}
          variantExhausted={s.tttVariantExhausted}
          refreshReady={s.refreshReady}
          refreshFormatted={s.refreshFormatted}
        />

        {/* True / False Math */}
        <GameCard
          id="truefalse"
          isActive={s.activeGame === 'truefalse'}
          onActivate={() => s.setActiveGame('truefalse')}
          icon={<CheckCircle size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="True / False Math"
          description="Is the equation correct? Answer TRUE or FALSE."
          difficulty={s.tfDifficulty}
          onDifficultyChange={s.setGlobalDifficulty}
          hideDifficulty
          gamesCount={s.tfGamesCount}
          onDecrement={() => { if (!s.tfVariantExhausted) s.setTfGamesCount(v => Math.max(1, Math.min(v - 1, s.tfVariantRemaining))) }}
          onIncrement={() => { if (!s.tfVariantExhausted) s.setTfGamesCount(v => Math.min(Math.max(v + 1, 1), s.tfVariantRemaining)) }}
          stepperDisabled={s.tfVariantExhausted}
          sessionHydrated={s.tfSessionHydrated}
          variantPlayed={s.tfVariantPlayed}
          variantTotal={s.tfVariantTotal}
          variantRemaining={s.tfVariantRemaining}
          variantExhausted={s.tfVariantExhausted}
          refreshReady={s.refreshReady}
          refreshFormatted={s.refreshFormatted}
        />

        {/* SSC CGL Math — unlimited practice, no stepper/progress */}
        <div
          className="rounded-2xl border p-3 sm:p-4 transition-colors"
          style={{
            borderColor: s.activeGame === 'ssccgl' ? 'var(--accent-orange)' : 'var(--border-subtle)',
            backgroundColor: s.activeGame === 'ssccgl' ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)',
          }}
          onClick={() => s.setActiveGame('ssccgl')}
        >
          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
            <BookOpen size={16} style={{ color: 'var(--accent-orange)' }} />
            <span className="text-[13px] sm:text-sm font-semibold text-white">SSC CGL Math</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">Unlimited practice — previous year SSC CGL questions.</p>
        </div>
      </div>

      {/* More Games entry point */}
      <MoreGamesButton />

      {/* Floating Play button */}
      <FloatingPlayButton
        label={s.playLabel}
        disabled={s.playDisabled}
        isLocked={s.isLocked}
        isNavigating={s.isNavigating}
        onClick={s.handlePlay}
      />
    </main>
  )
}
