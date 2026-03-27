'use client'

import { useState, useCallback } from 'react'

interface ShareScoreButtonProps {
  score: number
  gameType?: string
  difficulty?: string
}

/** Draw a branded share card on a canvas and return it as a Blob. */
export async function generateShareImage(
  score: number,
  gameType?: string,
  difficulty?: string,
): Promise<Blob> {
  // 1080×1080 square — optimal for WhatsApp, Instagram, Twitter
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Solid dark background — edge-to-edge, no rounded corners (avoids
  // transparent gaps that look like padding on dark chat backgrounds)
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

  // --- Content is vertically centred in the card ---
  const centerY = H / 2

  // App name
  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MATHY', W / 2, centerY - 200)

  // Score
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 144px system-ui, -apple-system, sans-serif'
  ctx.fillText(score.toLocaleString(), W / 2, centerY - 50)

  // "points" label
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '32px system-ui, -apple-system, sans-serif'
  ctx.fillText('points', W / 2, centerY + 10)

  // Game info pills
  const pills: string[] = []
  if (gameType) pills.push(gameType)
  if (difficulty) pills.push(difficulty)
  const pillBaseY = centerY + 70
  if (pills.length) {
    ctx.font = '26px system-ui, -apple-system, sans-serif'
    const pillText = pills.join('  ·  ')
    ctx.fillStyle = 'rgba(249,115,22,0.15)'
    const tw = ctx.measureText(pillText).width
    const px = 28
    ctx.beginPath()
    ctx.roundRect((W - tw) / 2 - px, pillBaseY - 20, tw + px * 2, 50, 25)
    ctx.fill()
    ctx.fillStyle = '#f97316'
    ctx.textAlign = 'center'
    ctx.fillText(pillText, W / 2, pillBaseY + 10)
  }

  // Challenge text
  ctx.fillStyle = '#d4d4d8'
  ctx.font = '38px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  const tagY = pills.length ? pillBaseY + 90 : centerY + 100
  ctx.fillText('I scored this in Mathy 🧠🔥', W / 2, tagY)

  // CTA
  ctx.fillStyle = '#71717a'
  ctx.font = '26px system-ui, -apple-system, sans-serif'
  ctx.fillText('Can you beat my score? → www.themathy.com', W / 2, tagY + 56)

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

export default function ShareScoreButton({ score, gameType, difficulty }: ShareScoreButtonProps) {
  const [sharing, setSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await generateShareImage(score, gameType, difficulty)
      const file = new File([blob], 'mathy-score.png', { type: 'image/png' })
      const shareText = `I scored ${score.toLocaleString()} in Mathy 🧠🔥 Can you beat me? → www.themathy.com`

      // Try native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mathy-score.png'
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
  }, [sharing, score, gameType, difficulty])

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all hover:border-zinc-600 hover:text-white active:scale-[0.98] disabled:opacity-60"
    >
      {sharing ? 'Generating…' : '📤 Share Score'}
    </button>
  )
}
