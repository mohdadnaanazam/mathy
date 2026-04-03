'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2 } from 'lucide-react'

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

/** Generate a share image for the streak */
async function generateStreakShareImage(
  currentStreak: number,
  longestStreak: number,
  weekDays: { date: number; played: boolean; isToday: boolean }[]
): Promise<Blob> {
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c0c0f')
  bg.addColorStop(1, '#18181b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Orange accent line at top
  const accent = ctx.createLinearGradient(0, 0, W, 0)
  accent.addColorStop(0, '#f97316')
  accent.addColorStop(1, '#ea580c')
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 6)

  const centerY = H / 2

  // App name
  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MATHY', W / 2, centerY - 280)

  // Fire emoji circle
  ctx.fillStyle = 'rgba(249,115,22,0.12)'
  ctx.beginPath()
  ctx.arc(W / 2, centerY - 160, 70, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(249,115,22,0.25)'
  ctx.lineWidth = 3
  ctx.stroke()

  // Fire emoji
  ctx.font = '80px system-ui, -apple-system, sans-serif'
  ctx.fillText('🔥', W / 2, centerY - 135)

  // Streak number
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 160px system-ui, -apple-system, sans-serif'
  ctx.fillText(currentStreak.toString(), W / 2, centerY + 50)

  // Streak label
  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif'
  ctx.fillText(getStreakLabel(currentStreak).toUpperCase(), W / 2, centerY + 110)

  // Week calendar
  const calendarY = centerY + 180
  const dayWidth = 100
  const startX = (W - (7 * dayWidth)) / 2 + dayWidth / 2

  ctx.font = '24px system-ui, -apple-system, sans-serif'
  DAY_LABELS.forEach((label, i) => {
    const x = startX + i * dayWidth
    
    // Day label
    ctx.fillStyle = '#52525b'
    ctx.fillText(label, x, calendarY)
    
    // Day circle
    const circleY = calendarY + 50
    const played = weekDays[i].played
    const isToday = weekDays[i].isToday
    
    ctx.beginPath()
    ctx.arc(x, circleY, 32, 0, Math.PI * 2)
    ctx.fillStyle = played ? 'rgba(249,115,22,0.2)' : 'rgba(39,39,42,0.5)'
    ctx.fill()
    
    if (isToday) {
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 3
      ctx.stroke()
    } else if (played) {
      ctx.strokeStyle = 'rgba(249,115,22,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Checkmark or date
    ctx.fillStyle = played ? '#f97316' : '#71717a'
    ctx.font = played ? 'bold 28px system-ui, -apple-system, sans-serif' : '24px system-ui, -apple-system, sans-serif'
    ctx.fillText(played ? '✓' : weekDays[i].date.toString(), x, circleY + 8)
  })

  // Longest streak
  if (longestStreak > 0) {
    ctx.fillStyle = '#52525b'
    ctx.font = '26px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Longest streak: ${longestStreak} days`, W / 2, calendarY + 140)
  }

  // CTA
  ctx.fillStyle = '#d4d4d8'
  ctx.font = '36px system-ui, -apple-system, sans-serif'
  ctx.fillText('Train your brain daily! 🧠', W / 2, H - 120)

  ctx.fillStyle = '#71717a'
  ctx.font = '26px system-ui, -apple-system, sans-serif'
  ctx.fillText('www.themathy.com', W / 2, H - 70)

  // Subtle inner border
  ctx.strokeStyle = 'rgba(249,115,22,0.15)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate image'))),
      'image/png',
    )
  })
}

export default function StreakModal({ open, onClose, currentStreak, longestStreak, lastPlayedDate }: StreakModalProps) {
  const weekDays = getWeekDays(lastPlayedDate, currentStreak)
  const [sharing, setSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (sharing || currentStreak === 0) return
    setSharing(true)
    
    try {
      const blob = await generateStreakShareImage(currentStreak, longestStreak, weekDays)
      const file = new File([blob], 'mathy-streak.png', { type: 'image/png' })
      const shareText = `I'm on a ${currentStreak} day streak in Mathy! 🔥🧠 Can you keep up? → www.themathy.com`

      // Try native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mathy-streak.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // User cancelled share dialog — not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    } finally {
      setSharing(false)
    }
  }, [sharing, currentStreak, longestStreak, weekDays])

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
                <p className="text-[10px] text-slate-600 mb-4">
                  Longest streak: <span className="text-slate-400 font-semibold">{longestStreak} days</span>
                </p>
              )}

              {/* Share button */}
              {currentStreak > 0 && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#18181b',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                  }}
                >
                  <Share2 size={14} strokeWidth={2.5} />
                  {sharing ? 'Generating...' : 'Share Streak'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
