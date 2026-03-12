'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { GameCardConfig } from '@/types'

export default function GameCard({ icon, title, description, difficulty, timeLimit, type, tag }: GameCardConfig) {
  const router  = useRouter()
  const setType = useGameStore(s => s.setGameType)

  const diffColor = { Easy: 'text-white/60', Medium: 'text-white/60', Hard: 'text-white/80' }[difficulty]

  function handlePlay() {
    setType(type)
    router.push('/game')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className='group relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 cursor-pointer overflow-hidden'
      onClick={handlePlay}
    >
      {/* Hover glow */}
      <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'>
        <div className='absolute inset-0 rounded-2xl' style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.04)' }} />
        <div className='absolute -inset-px rounded-2xl border border-white/15' />
      </div>

      {/* Tag */}
      <span className='inline-block mb-4 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/30 border border-white/10 rounded-full px-2 py-0.5'>
        {tag}
      </span>

      {/* Icon + title */}
      <div className='flex items-start gap-3 mb-3'>
        <div className='text-3xl leading-none'>{icon}</div>
        <div>
          <h3 className='text-base font-semibold text-white leading-tight'>{title}</h3>
          <p className='text-xs text-white/35 mt-0.5'>{description}</p>
        </div>
      </div>

      {/* Meta */}
      <div className='flex items-center gap-2 mt-4'>
        <span className={`text-[11px] font-medium ${diffColor}`}>{difficulty}</span>
        <span className='text-white/15 text-xs'>·</span>
        <span className='text-[11px] text-white/30'>{timeLimit}</span>
      </div>

      {/* CTA */}
      <div className='mt-4 pt-4 border-t border-white/6 flex items-center justify-between'>
        <span className='text-xs text-white/25 font-mono'>ready to play</span>
        <span className='text-xs font-semibold text-white group-hover:translate-x-1 transition-transform duration-200'>
          Play →
        </span>
      </div>
    </motion.div>
  )
}
