'use client'

/**
 * AchievementModal
 *
 * Celebration overlay shown when user completes 2 unique games with perfect 20/20.
 * Shows confetti → modal with achievement details → WhatsApp share button.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ConfettiOverlay from './ConfettiOverlay'

interface AchievementModalProps {
  games: [string, string]
  onClose: () => void
  onPlayNext: () => void
}

const SITE_URL = 'https://www.themathy.com'

export default function AchievementModal({ games, onClose, onPlayNext }: AchievementModalProps) {
  const [showModal, setShowModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  // Delay modal appearance by 1.5s after confetti starts
  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-stop confetti after 5s
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const shareMessage = encodeURIComponent(
    `🔥 I just completed ${games[0]} & ${games[1]} (20/20) in Mathy! Can you beat me? 😎 Play now: ${SITE_URL}`
  )
  const whatsappUrl = `https://wa.me/?text=${shareMessage}`

  return (
    <>
      {showConfetti && <ConfettiOverlay />}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(24,24,27,0.98) 0%, rgba(12,12,15,0.99) 100%)',
                border: '1px solid rgba(249,115,22,0.3)',
                boxShadow: '0 0 60px rgba(249,115,22,0.15), 0 8px 32px rgba(0,0,0,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.8), transparent)',
                }}
              />

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-800"
                style={{ color: '#71717a' }}
                aria-label="Close achievement modal"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              <div className="px-5 py-6 sm:px-6 sm:py-8 text-center">
                {/* Badge */}
                <div className="text-5xl mb-3">🏆</div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                  🎉 Achievement Unlocked!
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-400 mb-4">
                  You completed 2 games with perfect score (20/20)
                </p>

                {/* Game names */}
                <div
                  className="rounded-xl px-4 py-3 mb-5"
                  style={{
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.15)',
                  }}
                >
                  <p className="text-sm font-semibold text-orange-400">
                    {games[0]} & {games[1]}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">🥇 Math Master</p>
                </div>

                {/* WhatsApp share */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] mb-3"
                  style={{
                    background: '#25D366',
                    boxShadow: '0 2px 12px rgba(37,211,102,0.3)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Share on WhatsApp
                </a>

                {/* Play next */}
                <button
                  type="button"
                  onClick={onPlayNext}
                  className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white hover:bg-zinc-800"
                  style={{ border: '1px solid rgba(63,63,70,0.5)' }}
                >
                  Play Next Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
