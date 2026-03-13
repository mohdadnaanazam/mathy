'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const MathGame = dynamic(() => import('../game/MathGame'), { ssr: false })

interface GamePreviewWindowProps {
  className?: string
}

export function GamePreviewWindow({ className }: GamePreviewWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`relative ${className || ''}`}
    >
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 backdrop-blur-xl shadow-2xl">
        
        {/* macOS Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900/50 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="ml-4 flex-1 text-xs text-white/60 font-mono tracking-wider">
            {/* Empty space for draggable window feel */}
          </div>
          
          {/* Status Indicator */}
          <motion.div
            className="flex items-center gap-1.5 text-xs text-green-400 font-mono tracking-wider"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <span>Active</span>
          </motion.div>
        </div>

        {/* Game Content Container */}
        <div className="relative overflow-hidden" style={{ minHeight: '520px' }}>
          {/* Internal Glow Behind Game */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-pink-500/5 pointer-events-none" />
          
          <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col items-center justify-center transform scale-[0.75] sm:scale-[0.85] origin-top">
            <MathGame />
          </div>
        </div>

        {/* Ambient Blur Behind Window */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-purple)] to-[var(--accent-pink)] blur-[80px] opacity-[0.15]" />
      </div>

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-lg bg-[var(--accent-cyan)]/10 backdrop-blur-sm border border-[var(--accent-cyan)]/20 shadow-[0_0_30px_rgba(0,240,255,0.1)] pointer-events-none z-20 hidden md:block"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div
        className="absolute -bottom-4 -left-4 w-16 h-16 rounded-lg bg-[var(--accent-pink)]/10 backdrop-blur-sm border border-[var(--accent-pink)]/20 shadow-[0_0_30px_rgba(255,0,127,0.1)] pointer-events-none z-20 hidden md:block"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </motion.div>
  )
}

export default GamePreviewWindow
