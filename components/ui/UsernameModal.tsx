'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'mathy_username'

export function getStoredUsername(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setStoredUsername(name: string) {
  localStorage.setItem(STORAGE_KEY, name)
}

interface Props {
  open: boolean
  onSubmit: (username: string) => void
  onClose: () => void
}

export default function UsernameModal({ open, onSubmit, onClose }: Props) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const stored = getStoredUsername()
      if (stored) setName(stored)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 30) return
    setStoredUsername(trimmed)
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <div>
          <h2 className="text-sm font-bold text-white">Enter your name</h2>
          <p className="text-[10px] text-zinc-500 mt-1">This will appear on the leaderboard.</p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          maxLength={30}
          placeholder="Your name"
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[var(--accent-orange)] transition-colors"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || name.trim().length > 30}
            className="flex-1 rounded-xl bg-[var(--accent-orange)] py-2.5 text-xs font-semibold text-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            Submit Score
          </button>
        </div>
      </div>
    </div>
  )
}
