'use client'

import { Calculator, Grid3X3, CheckCircle } from 'lucide-react'
import { useHomePageState, type ModeLabel } from '@/hooks/useHomePageState'
import type { OperationMode } from '@/types'
import GameCard from '@/components/home/GameCard'
import StatusBanner from '@/components/home/StatusBanner'
import FloatingPlayButton from '@/components/home/FloatingPlayButton'
import RefreshBanner from '@/components/ui/RefreshBanner'

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

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'max(9rem, calc(env(safe-area-inset-bottom, 0px) + 9rem))' }}
    >
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-5 sm:py-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Mathy</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Train your brain daily</p>
          </div>
          {s.isLocked && (
            <span className="text-[10px] font-mono text-amber-400">
              Limit {s.used}/{s.maxAttempts} · resets {s.timeToReset}
            </span>
          )}
        </div>
      </header>

      {/* Status banners */}
      {s.mounted && (
        <StatusBanner
          isSessionExpired={s.isSessionExpired}
          isRefreshing={s.isRefreshing}
          isExpiryResetting={s.isExpiryResetting}
          isReloadingGames={s.isReloadingGames}
          onReset={s.handleSessionReset}
          onReload={s.handleReloadNewGames}
        />
      )}

      {/* Refresh countdown */}
      {s.mounted && (s.mathVariantExhausted || s.memoryVariantExhausted || s.tfVariantExhausted) && (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
          <RefreshBanner tier={s.refreshTier} formatted={s.refreshFormatted} />
        </div>
      )}

      {/* Game cards */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 space-y-3">

        {/* Math Challenge */}
        <GameCard
          id="math"
          isActive={s.activeGame === 'math'}
          onActivate={() => s.setActiveGame('math')}
          icon={<Calculator size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="Math Challenge"
          description="Solve equations. Pick an operation and difficulty, then play."
          difficulty={s.mathDifficulty}
          onDifficultyChange={s.setMathDifficulty}
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
          description="Remember highlighted blocks, then tap them in order."
          difficulty={s.memoryDifficulty}
          onDifficultyChange={s.setMemoryDifficulty}
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

        {/* True / False Math */}
        <GameCard
          id="truefalse"
          isActive={s.activeGame === 'truefalse'}
          onActivate={() => s.setActiveGame('truefalse')}
          icon={<CheckCircle size={16} style={{ color: 'var(--accent-orange)' }} />}
          title="True / False Math"
          description="Is the equation correct? Answer TRUE or FALSE."
          difficulty={s.tfDifficulty}
          onDifficultyChange={s.setTfDifficulty}
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
      </div>

      {/* Floating Play button */}
      <FloatingPlayButton
        label={s.playLabel}
        showArrow={!s.isLocked && !s.isNavigating && !s.isRefreshing && !s.isSessionExpired && s.canPlayActive}
        disabled={s.playDisabled}
        isLocked={s.isLocked}
        onClick={s.handlePlay}
      />
    </main>
  )
}
