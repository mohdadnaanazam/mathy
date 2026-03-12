'use client'
import { motion, useAnimation, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export default function ScoreDisplay() {
  const score = useGameStore(s => s.score)
  
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)
  const controls = useAnimation()

  useEffect(() => {
    const animation = animate(count, score, { duration: 1.2, ease: "easeOut" })
    controls.start({
      scale: [1, 1.1, 1],
      color: ['#fff', 'var(--accent-cyan)', '#fff'],
      textShadow: ['0 0 0px transparent', '0 0 30px rgba(0, 240, 255, 0.8)', '0 0 0px transparent']
    })
    return animation.stop
  }, [score])

  return (
    <div style={{ textAlign: 'center' }}>
      <div className='section-label' style={{ justifyContent: 'center', marginBottom: '12px', color: 'rgba(255,255,255,0.4)' }}>
        Total XP
      </div>
      <motion.div
        animate={controls}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '56px', fontWeight: 700,
          lineHeight: 1, letterSpacing: '-0.04em', color: '#fff'
        }}
      >
        {rounded}
      </motion.div>
    </div>
  )
}
