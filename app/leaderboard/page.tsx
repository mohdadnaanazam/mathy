'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw } from 'lucide-react'
import { useUserUUID } from '@/hooks/useUserUUID'
import { useLeaderboard, type LeaderboardTab } from '@/hooks/useLeaderboard'
import type { LeaderboardEntry } from '@/src/services/leaderboardService'
import { getDiceBearAvatar } from '@/lib/userIdentity'

const TABS: { label: string; value: LeaderboardTab }[] = [
  { label: 'All Time', value: 'global' },
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
]

const MEDAL_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

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

      <div className="mx-auto max-w-2xl px-3 sm:px-6 py-4 space-y-3">
        {/* Time period tabs */}
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
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Score</p>
                <p className="text-2xl font-bold text-white">{userRank.bestScore}</p>
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
            <button onClick={refresh} className="mt-2 text-xs text-[var(--accent-orange)] font-semibold">
              Try again
            </button>
          </div>
        )}

        {/* Top 3 Podium */}
        {!loading && !error && top3.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6">
            <div className="flex items-end justify-center gap-3 sm:gap-4 pt-2 pb-1">
              {top3[1] && <PodiumCard entry={top3[1]} place={2} isUser={top3[1].user_id === userUuid} />}
              {top3[0] && <PodiumCard entry={top3[0]} place={1} isUser={top3[0].user_id === userUuid} />}
              {top3[2] && <PodiumCard entry={top3[2]} place={3} isUser={top3[2].user_id === userUuid} />}
            </div>
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

// ─── Podium Card (Top 3) ─────────────────────────────────────────────

function PodiumCard({ entry, place, isUser }: { entry: LeaderboardEntry; place: 1 | 2 | 3; isUser: boolean }) {
  const heights = { 1: 'h-28 sm:h-32', 2: 'h-20 sm:h-24', 3: 'h-16 sm:h-20' }
  const avatarSizes = { 1: 'w-14 h-14 sm:w-16 sm:h-16', 2: 'w-11 h-11 sm:w-12 sm:h-12', 3: 'w-10 h-10 sm:w-11 sm:h-11' }
  const glowColors: Record<number, string> = {
    1: 'rgba(234,179,8,0.15)',
    2: 'rgba(148,163,184,0.1)',
    3: 'rgba(180,83,9,0.1)',
  }

  const avatarUrl = getDiceBearAvatar(entry.user_id)

  return (
    <div className={`flex flex-col items-center ${place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'}`}>
      <div className="relative mb-1.5">
        <img
          src={avatarUrl}
          alt={entry.username}
          className={`${avatarSizes[place]} rounded-full bg-zinc-800`}
          style={{
            boxShadow: place === 1 ? `0 0 20px ${glowColors[1]}, 0 0 40px ${glowColors[1]}` : undefined,
            border: isUser ? '2px solid var(--accent-orange)' : '2px solid transparent',
          }}
        />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm sm:text-base">
          {MEDAL_EMOJI[place]}
        </span>
      </div>
      <p className={`text-[11px] sm:text-[12px] font-bold truncate max-w-[80px] sm:max-w-[90px] mt-1 ${
        isUser ? 'text-[var(--accent-orange)]' : 'text-white'
      }`}>
        {entry.username}
      </p>
      <p className="text-[10px] sm:text-[11px] font-bold text-[var(--accent-orange)] mt-0.5">{entry.score}</p>
      <div
        className={`${heights[place]} w-20 sm:w-24 mt-2 rounded-t-xl border border-[var(--border-subtle)] border-b-0 flex items-center justify-center ${
          isUser ? 'ring-1 ring-[var(--accent-orange)]/40' : ''
        }`}
        style={{ background: `linear-gradient(to bottom, ${glowColors[place]}, transparent)` }}
      >
        <span className="text-lg sm:text-xl font-bold text-zinc-600">#{place}</span>
      </div>
    </div>
  )
}

// ─── Rank Row (4th+) ─────────────────────────────────────────────────

function RankRow({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  const avatarUrl = getDiceBearAvatar(entry.user_id)

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isUser
          ? 'bg-[var(--accent-orange)]/8 border border-[var(--accent-orange)]/20'
          : 'bg-zinc-900/40 border border-[var(--border-subtle)]'
      }`}
    >
      <span className="text-[12px] font-bold text-zinc-500 w-8 text-center">#{entry.rank}</span>
      <img
        src={avatarUrl}
        alt={entry.username}
        className="w-8 h-8 rounded-full bg-zinc-800 shrink-0"
      />
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