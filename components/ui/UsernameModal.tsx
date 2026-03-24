'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'mathy_username'
const AVATAR_COLOR_KEY = 'mathy_avatar_color'

const AVATAR_COLORS = [
  '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e',
  '#ec4899', '#eab308', '#3b82f6', '#14b8a6', '#f43f5e',
]

export function getStoredUsername(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function getStoredAvatarColor(): string {
  if (typeof window === 'undefined') return AVATAR_COLORS[0]
  return localStorage.getItem(AVATAR_COLOR_KEY) || AVATAR_COLORS[0]
}

export function setStoredUsername(name: string) {
  localStorage.setItem(STORAGE_KEY, name)
}

export function setStoredAvatarColor(color: string) {
  localStorage.setItem(AVATAR_COLOR_KEY, color)
}

interface Props {
  open: boolean
  onSubmit: (username: string, avatarColor: string) => void
  onClose: () => void
}

export default function UsernameModal({ open, onSubmit, onClose }: Props) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const stored = getStoredUsername()
      if (stored) setName(stored)
      setSelectedColor(getStoredAvatarColor())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const initial = name.trim().charAt(0).toUpperCase() || '?'

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 30) return
    setStoredUsername(trimmed)
    setStoredAvatarColor(selectedColor)
    onSubmit(trimmed, selectedColor)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <div className="text-center">
          <div
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3"
            style={{ backgroundColor: selectedColor }}
          >
            {initial}
          </div>
          <h2 className="text-sm font-bold text-white">Enter your name</h2>
          <p className="text-[10px] text-zinc-500 mt-1">This will appear on the leaderboard</p>
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

        {/* Avatar color picker */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                backgroundColor: c,
                outline: selectedColor === c ? '2px solid white' : 'none',
                outlineOffset: 2,
                transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>

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
            Save & Submit
          </button>
        </div>
      </div>
    </div>
  )
}
