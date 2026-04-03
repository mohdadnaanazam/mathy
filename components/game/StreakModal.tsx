'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Trophy, Zap } from 'lucide-react'

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

function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '👑'
  if (streak >= 14) return '⚡'
  if (streak >= 7) return '🔥'
  return '🔥'
}

function getWeekDays(lastPlayedDate: string, currentStreak: number): { date: number; played: boolean; isToday: boolean }[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  const days: { date: number; played: boolean; isToday: boolean }[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const isToday = dateStr === formatDate(today)

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

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c0c0f')
  bg.addColorStop(1, '#18181b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const accent = ctx.createLinearGradient(0, 0, W, 0)
  accent.addColorStop(0, '#f97316')
  accent.addColorStop(1, '#ea580c')
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 6)

  const centerY = H / 2

  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MATHY', W / 2, centerY - 280)

  ctx.fillStyle = 'rgba(249,115,22,0.12)'
  ctx.beginPath()
  ctx.arc(W / 2, centerY - 160, 70, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(249,115,22,0.25)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.font = '80px system-ui, -apple-system, sans-serif'
  ctx.fillText('🔥', W / 2, centerY - 135)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 160px system-ui, -apple-system, sans-serif'
  ctx.fillText(currentStreak.toString(), W / 2, centerY + 50)

  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif'
  ctx.fillText(getStreakLabel(currentStreak).toUpperCase(), W / 2, centerY + 110)

  const calendarY = centerY + 180
  const dayWidth = 100
  const startX = (W - (7 * dayWidth)) / 2 + dayWidth / 2

  ctx.font = '24px system-ui, -apple-system, sans-serif'
  DAY_LABELS.forEach((label, i) => {
    const x = startX + i * dayWidth
    ctx.fillStyle = '#52525b'
    ctx.fillText(label, x, calendarY)
    
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
    
    ctx.fillStyle = played ? '#f97316' : '#71717a'
    ctx.font = played ? 'bold 28px system-ui' : '24px system-ui'
    ctx.fillText(played ? '✓' : weekDays[i].date.toString(), x, circleY + 8)
  })

  if (longestStreak > 0) {
    ctx.fillStyle = '#52525b'
    ctx.font = '26px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Longest streak: ${longestStreak} days`, W / 2, calendarY + 140)
  }

  ctx.fillStyle = '#d4d4d8'
  ctx.font = '36px system-ui, -apple-system, sans-serif'
  ctx.fillText('Train your brain daily! 🧠', W / 2, H - 120)

  ctx.fillStyle = '#71717a'
  ctx.font = '26px system-ui, -apple-system, sans-serif'
  ctx.fillText('www.themathy.com', W / 2, H - 70)

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
  const [animatedStreak, setAnimatedStreak] = useState(0)
  const playedDays = weekDays.filter(d => d.played).length

  useEffect(() => {
    if (open) {
      setAnimatedStreak(0)
      const duration = 800
      const steps = 20
      const increment = currentStreak / steps
      let current = 0
      const interval = setInterval(() => {
        current += increment
        if (current >= currentStreak) {
          setAnimatedStreak(currentStreak)
          clearInterval(interval)
        } else {
          setAnimatedStreak(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(interval)
    }
  }, [open, currentStreak])

  const handleShare = useCallback(async () => {
    if (sharing || currentStreak === 0) return
    setSharing(true)
    
    try {
      const blob = await generateStreakShareImage(currentStreak, longestStreak, weekDays)
      const file = new File([blob], 'mathy-streak.png', { type: 'image/png' })
      const shareText = `I'm on a ${currentStreak} day streak in Mathy! 🔥🧠 Can you keep up? → www.themathy.com`

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
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
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(9,9,11,0.99) 100%)',
              border: '1px solid rgba(249,115,22,0.2)',
              boxShadow: '0 0 80px rgba(249,115,22,0.15), 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Animated glow effect */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(249,115,22,0.3) 0%, transparent 50%)',
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-zinc-800/80 hover:scale-110 z-10"
              style={{ color: '#71717a' }}
              aria-label="Close streak modal"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="relative px-6 py-8 text-center">
              {/* Fire icon with animated ring */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="relative mx-auto w-24 h-24 mb-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)' }}
                />
                <div
                  className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(234,88,12,0.1) 100%)',
                    border: '2px solid rgba(249,115,22,0.4)',
                    boxShadow: 'inset 0 2px 10px rgba(249,115,22,0.2)',
                  }}
                >
                  <motion.span 
                    className="text-4xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {getStreakEmoji(currentStreak)}
                  </motion.span>
                </div>
              </motion.div>

              {/* Streak number */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p 
                  className="text-6xl font-black mb-1"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(249,115,22,0.3)',
                  }}
                >
                  {animatedStreak}
                </p>
                <p 
                  className="text-lg font-bold tracking-wide mb-1"
                  style={{
                    background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {getStreakLabel(currentStreak)}
                </p>
                <p className="text-xs text-slate-500 mb-6">{getMotivation(currentStreak)}</p>
              </motion.div>

              {/* Week calendar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-5">
                <div className="grid grid-cols-7 gap-2">
                  {DAY_LABELS.map((label, i) => (
                    <motion.div 
                      key={i} 
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <p className="text-[10px] font-medium text-slate-600 mb-2">{label}</p>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="mx-auto w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: weekDays[i].played ? 'rgba(249,115,22,0.2)' : 'rgba(39,39,42,0.6)',
                          border: weekDays[i].isToday ? '2px solid #f97316' : weekDays[i].played ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(63,63,70,0.5)',
                          color: weekDays[i].played ? '#fb923c' : '#71717a',
                          boxShadow: weekDays[i].played ? '0 0 12px rgba(249,115,22,0.3)' : weekDays[i].isToday ? '0 0 12px rgba(249,115,22,0.4)' : 'none',
                        }}
                      >
                        {weekDays[i].played ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>✓</motion.span> : weekDays[i].date}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats row */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-6 mb-6">
                {longestStreak > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <Trophy size={14} className="text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-600">Best</p>
                      <p className="text-sm font-bold text-slate-300">{longestStreak} days</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Zap size={14} className="text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-600">This week</p>
                    <p className="text-sm font-bold text-slate-300">{playedDays}/7 days</p>
                  </div>
                </div>
              </motion.div>

              {/* Share button */}
              {currentStreak > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#18181b',
                    boxShadow: '0 8px 24px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <Share2 size={16} strokeWidth={2.5} />
                  {sharing ? 'Generating...' : 'Share Streak'}
                </motion.button>
              )}

              {currentStreak === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs text-slate-600 mt-2">
                  Play a game today to start your streak! 🎮
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
