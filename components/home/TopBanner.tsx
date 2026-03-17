'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'bannerDismissed'

export default function TopBanner() {
  // Start hidden to avoid flash, then reveal after sessionStorage check
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== 'true') setVisible(true)
    } catch { /* private browsing — show it */ setVisible(true) }
  }, [])

  const dismiss = useCallback(() => {
    setClosing(true)
    try { sessionStorage.setItem(STORAGE_KEY, 'true') } catch {}
    setTimeout(() => setVisible(false), 250)
  }, [])

  if (!visible) return null

  return (
    <div
      className="w-full transition-all duration-250 ease-out"
      style={{
        background: 'linear-gradient(90deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.04) 100%)',
        borderBottom: '1px solid rgba(249,115,22,0.15)',
        opacity: closing ? 0 : 1,
        transform: closing ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <p className="text-[11px] sm:text-xs text-slate-400">
          <span className="text-[var(--accent-orange)] mr-1.5">✦</span>
          We generate new games every hour using AI.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="shrink-0 p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
