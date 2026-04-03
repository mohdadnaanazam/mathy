'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateShareImage } from './ShareScoreButton'

interface AutoShareModalProps {
  score: number
  gameType?: string
  difficulty?: string
  onClose: () => void
}

const SITE_URL = 'https://www.themathy.com'

/**
 * Auto-opening modal that generates and previews the score share image.
 * Shown once for first-time users after confetti finishes.
 * Features WhatsApp share as primary action.
 */
export default function AutoShareModal({
  score,
  gameType,
  difficulty,
  onClose,
}: AutoShareModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false)

  // Generate share image
  useEffect(() => {
    let revoke: string | null = null
    generateShareImage(score, gameType, difficulty).then(blob => {
      const url = URL.createObjectURL(blob)
      revoke = url
      setImageUrl(url)
    })
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [score, gameType, difficulty])

  // Auto-redirect countdown to WhatsApp
  useEffect(() => {
    if (autoRedirectCancelled || !imageUrl) return
    
    if (countdown <= 0) {
      handleWhatsAppShare()
      return
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, autoRedirectCancelled, imageUrl])

  const getWhatsAppUrl = useCallback(() => {
    const gameInfo = gameType ? `${gameType}${difficulty ? ` (${difficulty})` : ''}` : ''
    const message = encodeURIComponent(
      `🔥 I scored ${score.toLocaleString()} points in Mathy${gameInfo ? ` - ${gameInfo}` : ''}! 🧠\n\nCan you beat my score? Play now: ${SITE_URL}`
    )
    return `https://wa.me/?text=${message}`
  }, [score, gameType, difficulty])

  const handleWhatsAppShare = useCallback(() => {
    setAutoRedirectCancelled(true)
    window.open(getWhatsAppUrl(), '_blank')
  }, [getWhatsAppUrl])

  const handleNativeShare = useCallback(async () => {
    if (sharing || !imageUrl) return
    setSharing(true)
    setAutoRedirectCancelled(true)
    
    try {
      const resp = await fetch(imageUrl)
      const blob = await resp.blob()
      const file = new File([blob], 'mathy-score.png', { type: 'image/png' })
      const shareText = `I scored ${score.toLocaleString()} in Mathy 🧠🔥 Can you beat me? → ${SITE_URL}`

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
        // Fallback: download the image
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = 'mathy-score.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    } finally {
      setSharing(false)
    }
  }, [sharing, imageUrl, score])

  const handleClose = () => {
    setAutoRedirectCancelled(true)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(9,9,11,0.99) 100%)',
            border: '1px solid rgba(249,115,22,0.2)',
            boxShadow: '0 0 60px rgba(249,115,22,0.1), 0 25px 50px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Orange accent line */}
          <div 
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, #f97316, #ea580c)' }}
          />

          <div className="p-5">
            {/* Header */}
            <div className="text-center mb-4">
              <p className="text-sm uppercase tracking-widest text-[var(--accent-orange)] font-bold mb-1">
                🎉 First game complete!
              </p>
              <p className="text-xs text-slate-400">
                Share your score with friends
              </p>
            </div>

            {/* Image Preview */}
            <div className="rounded-xl overflow-hidden border border-zinc-800 mb-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Your Mathy score"
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex items-center justify-center py-16 bg-zinc-900">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
                </div>
              )}
            </div>

            {/* Auto-redirect notice */}
            {!autoRedirectCancelled && imageUrl && countdown > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-3"
              >
                <p className="text-[11px] text-slate-500">
                  Opening WhatsApp in <span className="text-[var(--accent-orange)] font-bold">{countdown}</span> seconds...
                </p>
                <button
                  type="button"
                  onClick={() => setAutoRedirectCancelled(true)}
                  className="text-[10px] text-slate-600 underline hover:text-slate-400 mt-1"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {/* WhatsApp Share - Primary */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                disabled={!imageUrl}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share on WhatsApp
              </button>

              {/* Other share options */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={sharing || !imageUrl}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {sharing ? 'Sharing…' : '📤 Share'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all hover:border-zinc-600 active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
