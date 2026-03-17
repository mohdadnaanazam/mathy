'use client'

import { useState, useCallback } from 'react'

interface ShareScoreButtonProps {
  score: number
  gameType?: string
  difficulty?: string
}

/** Draw a branded share card on a canvas and return it as a Blob. */
async function generateShareImage(
  score: number,
  gameType?: string,
  difficulty?: string,
): Promise<Blob> {
  const W = 600
  const H = 340
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c0c0f')
  bg.addColorStop(1, '#18181b')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 24)
  ctx.fill()

  // Orange accent line at top
  const accent = ctx.createLinearGradient(0, 0, W, 0)
  accent.addColorStop(0, '#f97316')
  accent.addColorStop(1, '#ea580c')
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.roundRect(0, 0, W, 4, [24, 24, 0, 0])
  ctx.fill()

  // App name
  ctx.fillStyle = '#f97316'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MATHY', W / 2, 48)

  // Score
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif'
  ctx.fillText(score.toLocaleString(), W / 2, 130)

  // "points" label
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '16px system-ui, -apple-system, sans-serif'
  ctx.fillText('points', W / 2, 158)

  // Game info pills
  const pills: string[] = []
  if (gameType) pills.push(gameType)
  if (difficulty) pills.push(difficulty)
  if (pills.length) {
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    const pillText = pills.join('  ·  ')
    ctx.fillStyle = 'rgba(249,115,22,0.15)'
    const tw = ctx.measureText(pillText).width
    const px = 16, py = 6
    ctx.beginPath()
    ctx.roundRect((W - tw) / 2 - px, 174, tw + px * 2, 28, 14)
    ctx.fill()
    ctx.fillStyle = '#f97316'
    ctx.textAlign = 'center'
    ctx.fillText(pillText, W / 2, 193)
  }

  // Challenge text
  ctx.fillStyle = '#d4d4d8'
  ctx.font = '20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  const tagY = pills.length ? 240 : 210
  ctx.fillText('I scored this in Mathy 🧠🔥', W / 2, tagY)

  // CTA
  ctx.fillStyle = '#71717a'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillText('Can you beat my score? → matthy.netlify.app', W / 2, tagY + 34)

  // Subtle border
  ctx.strokeStyle = 'rgba(249,115,22,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(0.5, 0.5, W - 1, H - 1, 24)
  ctx.stroke()

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
      const shareText = `I scored ${score.toLocaleString()} in Mathy 🧠🔥 Can you beat me? → matthy.netlify.app`

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
