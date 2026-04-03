'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface StreakModalProps {
  open: boolean
  onClose: () => void
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string // YYYY-MM-DD
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getStreakLabel(streak: number): string {
  if (streak >= 30) return 'Month Streak'
  if (streak >= 7) return 'Week Streak'
  if (streak >= 1) return 'Day Streak'
  return 'No Streak'
}

function getMotivation(streak: number): string {
  if (streak >= 30) return 'Legendary dedication. Keep it up!'
  if (streak >= 14) return 'Two weeks strong. Unstoppable!'
  if (streak >= 7) return 'A full week! You\'re on fire!'
  if (streak >= 3) return 'Great momentum. Don\'t stop now!'
  if (streak >= 1) return 'Nice start! Come back tomorrow.'
  return 'Play a game to start your streak!'
}

/** Get the current week's dates (Mon–Sun) and mark which ones were played */
function getWeekDays(lastPlayedDate: string, currentStreak: number): { date: number; played: boolean; isToday: boolean }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  const days: { date: number; played: boolean; isToday: boolean }[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const isToday = dateStr === formatDate(today)

    // A day is "played" if it falls within the streak window ending at lastPlayedDate
    let played = false
    if (lastPlayedDate && currentStreak > 0) {
      const lastPlayed = new Date(lastPlayedDate + 'T00:00:00')
      const streakStart = new Date(lastPlayed)
      streakStart.setDate(lastPlayed.getDate() - currentStreak + 1)
      played = d >= streakStart && d <= lastPlayed
    }

    days.push({ date: d.getDate(), played, isToday })
  }

  return days
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function StreakModal({ open, onClose, currentStreak, longestStreak, lastPlayedDate }: StreakModalProps) {
  const weekDays = getWeekDays(lastPlayedDate, currentStreak)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-xs rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(24,24,27,0.98) 0%, rgba(12,12,15,0.99) 100%)',
              border: '1px solid rgba(249,115,22,0.25)',
              boxShadow: '0 0 60px rgba(249,115,22,0.1), 0 8px 32px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-800"
              style={{ color: '#71717a' }}
              aria-label="Close streak modal"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="px-5 py-6 sm:px-6 sm:py-8 text-center">
              {/* Fire icon */}
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(249,115,22,0.12)',
                  border: '2px solid rgba(249,115,22,0.25)',
                }}
              >
                <span className="text-3xl">🔥</span>
              </div>

              {/* Streak number */}
              <p className="text-4xl font-bold text-white mb-1">{currentStreak}</p>
              <p className="text-sm font-semibold text-orange-400 mb-1">{getStreakLabel(currentStreak)}</p>
              <p className="text-[11px] text-slate-500 mb-5">{getMotivation(currentStreak)}</p>

              {/* Week calendar */}
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[9px] text-slate-600 mb-1.5">{label}</p>
                    <div
                      className="mx-auto w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        backgroundColor: weekDays[i].played
                          ? 'rgba(249,115,22,0.2)'
                          : 'rgba(39,39,42,0.5)',
                        border: weekDays[i].isToday
                          ? '2px solid var(--accent-orange)'
                          : weekDays[i].played
                            ? '1px solid rgba(249,115,22,0.3)'
                            : '1px solid rgba(63,63,70,0.4)',
                        color: weekDays[i].played ? '#f97316' : '#71717a',
                      }}
                    >
                      {weekDays[i].played ? '✓' : weekDays[i].date}
                    </div>
                  </div>
                ))}
              </div>

              {/* Longest streak */}
              {longestStreak > 0 && (
                <p className="text-[10px] text-slate-600">
                  Longest streak: <span className="text-slate-400 font-semibold">{longestStreak} days</span>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
