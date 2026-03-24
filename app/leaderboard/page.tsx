'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Medal, Crown, RefreshCw } from 'lucide-react'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useLeaderboard, type LeaderboardTab } from '@/hooks/useLeaderboard'
import type { LeaderboardEntry } from '@/src/services/leaderboardService'

const TABS: { label: string; value: LeaderboardTab }[] = [
  { label: 'All Time', value: 'global' },
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
]

export default function LeaderboardPage() {
  const router = useRouter()
  const { userUuid } = useUserUUID()
  const { tab, setTab, entries, userRank, loading, error, refresh } = useLeaderboard(userUuid)

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <main
      className="min-h-screen bg-[var(--bg-surface)] overflow-x-hidden"
      style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}
    >
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] py-3 sm:py-5">
        <div className="mx-auto max-w-2xl px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Trophy size={18} className="text-[var(--accent-orange)]" />
                Leaderboard
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Compete with other players</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-3 sm:px-6 py-4 space-y-4">
        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-2xl bg-zinc-900/60 border border-[var(--border-subtle)]">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all ${
                tab === t.value
                  ? 'bg-[var(--accent-orange)] text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* User rank card */}
        {userRank && userRank.rank !== null && (
          <div className="rounded-2xl border border-[var(--accent-orange)]/20 bg-[var(--accent-orange)]/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Your Rank</p>
                <p className="text-2xl font-bold text-[var(--accent-orange)]">#{userRank.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Best Score</p>
                <p className="text-2xl font-bold text-white">{userRank.bestScore}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Games</p>
                <p className="text-2xl font-bold text-zinc-400">{userRank.totalGames}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-xs text-[var(--accent-orange)] font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {/* Podium — Top 3 */}
        {!loading && !error && top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {/* 2nd place */}
            {top3[1] && <PodiumCard entry={top3[1]} place={2} isUser={top3[1].user_id === userUuid} />}
            {/* 1st place */}
            {top3[0] && <PodiumCard entry={top3[0]} place={1} isUser={top3[0].user_id === userUuid} />}
            {/* 3rd place */}
            {top3[2] && <PodiumCard entry={top3[2]} place={3} isUser={top3[2].user_id === userUuid} />}
          </div>
        )}

        {/* Rankings list */}
        {!loading && !error && rest.length > 0 && (
          <div className="space-y-1.5">
            {rest.map(entry => (
              <RankRow key={entry.id} entry={entry} isUser={entry.user_id === userUuid} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm text-zinc-400">No scores yet. Be the first!</p>
          </div>
        )}
      </div>
    </main>
  )
}

function PodiumCard({ entry, place, isUser }: { entry: LeaderboardEntry; place: 1 | 2 | 3; isUser: boolean }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }
  const icons = { 1: <Crown size={20} className="text-yellow-400" />, 2: <Medal size={18} className="text-zinc-300" />, 3: <Medal size={16} className="text-amber-600" /> }
  const bgColors = { 1: 'from-yellow-500/10 to-yellow-500/5', 2: 'from-zinc-400/10 to-zinc-400/5', 3: 'from-amber-600/10 to-amber-600/5' }

  return (
    <div className={`flex flex-col items-center ${place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'}`}>
      <div className="mb-2">{icons[place]}</div>
      <p className="text-[11px] font-bold text-white truncate max-w-[80px]">{entry.username}</p>
      <p className="text-[10px] text-[var(--accent-orange)] font-bold">{entry.score}</p>
      <div
        className={`${heights[place]} w-20 mt-2 rounded-t-xl bg-gradient-to-b ${bgColors[place]} border border-[var(--border-subtle)] border-b-0 flex items-center justify-center ${
          isUser ? 'ring-1 ring-[var(--accent-orange)]' : ''
        }`}
      >
        <span className="text-lg font-bold text-zinc-500">#{place}</span>
      </div>
    </div>
  )
}

function RankRow({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isUser
          ? 'bg-[var(--accent-orange)]/8 border border-[var(--accent-orange)]/20'
          : 'bg-zinc-900/40 border border-[var(--border-subtle)]'
      }`}
    >
      <span className="text-[12px] font-bold text-zinc-500 w-8 text-center">#{entry.rank}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold truncate ${isUser ? 'text-[var(--accent-orange)]' : 'text-white'}`}>
          {entry.username}
          {isUser && <span className="text-[10px] text-zinc-500 ml-1">(you)</span>}
        </p>
      </div>
      <span className="text-[13px] font-bold text-zinc-300">{entry.score}</span>
    </div>
  )
}
