'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLocalScore, setLocalScore } from '@/lib/indexeddb'

export default function ResetScoreButton() {
  const [score, setScore] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    getLocalScore().then(setScore)
  }, [])

  const handleReset = useCallback(async () => {
    setResetting(true)
    try {
      await setLocalScore(0)
      setScore(0)
      setShowModal(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setResetting(false)
    }
  }, [])

  if (score <= 0) return null

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-300 hover:bg-zinc-800/50 active:scale-[0.97]"
      >
        <span className="tabular-nums text-[var(--accent-orange)]">{score.toLocaleString()}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
        </svg>
      </button>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white">Reset your progress?</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will clear your score and progress. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#dc2626' }}
              >
                {resetting ? 'Resetting…' : 'Reset Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-slate-300 shadow-lg animate-fade-in">
          ✓ Score reset successfully
        </div>
      )}
    </>
  )
}
