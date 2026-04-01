'use client'

/**
 * SignupBanner
 *
 * A non-intrusive, slide-up bottom banner shown after the user's first game.
 * Does NOT block gameplay — it sits above the bottom edge like a toast.
 *
 * Props:
 *  onSignup  → fired when "Continue with Google" is clicked
 *              (placeholder for future Supabase Google OAuth)
 *  onClose   → fired when the user dismisses the banner
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SignupBannerProps {
  show: boolean
  onSignup: () => void
  onClose: () => void
}

// ─── Google "G" icon (official colours, no external dependency) ─────────────

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SignupBanner({ show, onSignup, onClose }: SignupBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="signup-banner"
          role="complementary"
          aria-label="Sign up prompt"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-0 sm:px-6 sm:pb-6"
          style={{ pointerEvents: 'none' }}
        >
          {/* Banner card */}
          <div
            className="relative mx-auto w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              pointerEvents: 'all',
              background: 'linear-gradient(135deg, rgba(24,24,27,0.97) 0%, rgba(18,18,22,0.98) 100%)',
              border: '1px solid rgba(249,115,22,0.25)',
              boxShadow:
                '0 -4px 40px rgba(249,115,22,0.12), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Subtle top-edge accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[1.5px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.6) 40%, rgba(249,115,22,0.6) 60%, transparent 100%)',
              }}
            />

            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">

              {/* Icon / badge */}
              <div
                className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(249,115,22,0.12)',
                  border: '1px solid rgba(249,115,22,0.2)',
                }}
                aria-hidden="true"
              >
                <span className="text-base sm:text-lg">🧠</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                  Save your progress
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-snug mt-0.5 truncate">
                  Sign up free to keep your score &amp; streaks
                </p>
              </div>

              {/* CTA — Continue with Google */}
              <button
                id="signup-banner-google-btn"
                type="button"
                onClick={onSignup}
                className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-slate-900 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                }}
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                <span className="hidden xs:inline sm:inline">Continue with Google</span>
                <span className="xs:hidden sm:hidden">Google</span>
              </button>

              {/* Close button */}
              <button
                id="signup-banner-close-btn"
                type="button"
                onClick={onClose}
                className="shrink-0 ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-zinc-800 active:bg-zinc-700"
                style={{ color: '#71717a' }}
                aria-label="Dismiss sign-up banner"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
