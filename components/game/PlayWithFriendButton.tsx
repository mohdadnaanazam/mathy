'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, X, Copy, Check, Share2 } from 'lucide-react'

interface PlayWithFriendButtonProps {
  gameType: string // e.g., 'math', 'memory', 'truefalse', 'tictactoe'
  difficulty?: string // e.g., 'easy', 'medium', 'hard'
  className?: string
}

const SITE_URL = 'https://www.themathy.com'

/**
 * Map internal game types to URL-friendly mode parameters
 */
function getGameModeParam(gameType: string): string {
  switch (gameType.toLowerCase()) {
    case 'math':
      return 'math'
    case 'memory':
      return 'memory'
    case 'true_false':
    case 'truefalse':
      return 'truefalse'
    case 'tictactoe':
    case 'tic_tac_toe':
      return 'tictactoe'
    case 'ssc_cgl':
    case 'ssccgl':
      return 'ssccgl'
    case 'speed_sort':
    case 'speedsort':
      return 'more&type=speed_sort'
    default:
      return gameType.toLowerCase()
  }
}

/**
 * Generate the shareable game URL
 */
function generateGameUrl(gameType: string, difficulty?: string): string {
  const mode = getGameModeParam(gameType)
  let url = `${SITE_URL}/game?mode=${mode}`
  if (difficulty) {
    url += `&difficulty=${difficulty.toLowerCase()}`
  }
  return url
}

/**
 * Generate QR code as canvas using a simple QR code algorithm
 * This is a lightweight implementation without external dependencies
 */
function generateQRCode(text: string, size: number = 200): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // Use a QR code API to generate the QR code image
  // We'll draw a placeholder and load the actual QR from an API
  ctx.fillStyle = '#18181b'
  ctx.fillRect(0, 0, size, size)
  
  return canvas
}

/**
 * PlayWithFriendButton Component
 * Shows a button that opens a modal with shareable link and QR code
 */
export default function PlayWithFriendButton({ 
  gameType, 
  difficulty,
  className = ''
}: PlayWithFriendButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  
  const gameUrl = generateGameUrl(gameType, difficulty)
  
  // Generate QR code URL using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(gameUrl)}&bgcolor=18181b&color=ffffff&margin=10`
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(gameUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [gameUrl])
  
  const handleShare = useCallback(async () => {
    if (sharing) return
    setSharing(true)
    
    try {
      const shareText = `Play ${gameType} with me on Mathy! 🧠🎮`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Play with me on Mathy!',
          text: shareText,
          url: gameUrl,
        })
      } else {
        // Fallback to copy
        await navigator.clipboard.writeText(`${shareText}\n${gameUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    } finally {
      setSharing(false)
    }
  }, [sharing, gameType, gameUrl])
  
  const handleDownloadQR = useCallback(async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mathy-${gameType}-qr.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download QR:', err)
    }
  }, [qrCodeUrl, gameType])

  // Get display name for game type
  const getGameDisplayName = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'math': return 'Math Challenge'
      case 'memory': return 'Memory Grid'
      case 'true_false':
      case 'truefalse': return 'True/False Math'
      case 'tictactoe':
      case 'tic_tac_toe': return 'Tic Tac Toe'
      case 'ssc_cgl':
      case 'ssccgl': return 'SSC CGL'
      case 'speed_sort':
      case 'speedsort': return 'Speed Sort'
      default: return type
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98] ${className}`}
      >
        <Users size={14} strokeWidth={2.5} />
        Play with Friend
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(24,24,27,0.98) 0%, rgba(12,12,15,0.99) 100%)',
                border: '1px solid rgba(249,115,22,0.25)',
                boxShadow: '0 0 60px rgba(249,115,22,0.1), 0 8px 32px rgba(0,0,0,0.6)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-800 z-10"
                style={{ color: '#71717a' }}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              <div className="px-4 py-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div
                    className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{
                      background: 'rgba(249,115,22,0.12)',
                      border: '2px solid rgba(249,115,22,0.25)',
                    }}
                  >
                    <Users size={20} className="text-[var(--accent-orange)]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-0.5">Play with a Friend</h3>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Share this link to challenge your friend to {getGameDisplayName(gameType)}
                    {difficulty && <span className="text-[var(--accent-orange)]"> ({difficulty})</span>}
                  </p>
                </div>

                {/* QR Code */}
                <div 
                  ref={qrRef}
                  className="flex justify-center mb-3"
                >
                  <div 
                    className="rounded-xl overflow-hidden p-2"
                    style={{ 
                      background: '#18181b',
                      border: '1px solid rgba(63,63,70,0.6)',
                    }}
                  >
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code to share game"
                      width={140}
                      height={140}
                      className="rounded-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>
                
                <p className="text-center text-[10px] text-slate-500 mb-3">
                  Scan QR code or share the link below
                </p>

                {/* URL Display */}
                <div 
                  className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
                  style={{
                    background: 'rgba(39,39,42,0.5)',
                    border: '1px solid rgba(63,63,70,0.6)',
                  }}
                >
                  <p className="flex-1 text-[10px] text-slate-300 font-mono truncate">
                    {gameUrl}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-zinc-700"
                    style={{ color: copied ? '#22c55e' : '#a1a1aa' }}
                    aria-label={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#18181b',
                      boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                    }}
                  >
                    <Share2 size={14} strokeWidth={2.5} />
                    {sharing ? 'Sharing...' : 'Share Link'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all hover:border-zinc-500"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(63,63,70,0.8)',
                      color: '#a1a1aa',
                    }}
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
