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

/**
 * Auto-opening modal that generates and previews the score share image.
 * Shown once for first-time users after confetti finishes.
 */
export default function AutoShareModal({
  score,
  gameType,
  difficulty,
  onClose,
}: AutoShareModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

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

  const handleShare = useCallback(async () => {
    if (sharing || !imageUrl) return
    setSharing(true)
    try {
      const resp = await fetch(imageUrl)
      const blob = await resp.blob()
      const file = new File([blob], 'mathy-score.png', { type: 'image/png' })
      const shareText = `I scored ${score.toLocaleString()} in Mathy 🧠🔥 Can you beat me? → www.themathy.com`

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-widest text-[var(--accent-orange)] font-semibold mb-1">
              🎉 First game complete!
            </p>
            <p className="text-sm text-slate-400">
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
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing || !imageUrl}
              className="flex-1 rounded-full bg-[var(--accent-orange)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {sharing ? 'Sharing…' : '📤 Share'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all hover:border-zinc-600 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
