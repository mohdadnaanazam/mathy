'use client'
import { motion } from 'framer-motion'
import { useMemoryGame } from '@/hooks/useMemoryGame'
import { useGameStore } from '@/store/gameStore'
import { useAttempts } from '@/hooks/useAttempts'
import Timer from './Timer'

export default function MemoryGame() {
  const { cards, selected: flippedIds, matched: matchedIds, moves, isComplete, flipCard: flip, reset } = useMemoryGame()
  const addScore      = useGameStore(s => s.addScore)
  const recordAttempt = useGameStore(s => s.recordAttempt)
  const { recordAttempt: hourlyRecord } = useAttempts()

  function handleCardClick(id: number) {
    if (isComplete) return
    if (flippedIds.includes(id) || matchedIds.includes(id)) return
    flip(id)
  }

  function handleTimeUp() {
    hourlyRecord()
    recordAttempt()
    reset()
  }

  if (isComplete) {
    const pts = Math.max(500 - moves * 10, 100)
    addScore(pts)
    recordAttempt()
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
      >
        <div style={{ fontSize: '72px', filter: 'drop-shadow(0 0 20px rgba(255, 0, 127, 0.4))' }}>🎉</div>
        <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(255, 0, 127, 0.5)' }}>Flawless Victory.</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--accent-pink)', background: 'rgba(255, 0, 127, 0.1)', padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(255, 0, 127, 0.3)' }}>
          {moves} MOVES · +{pts} PTS
        </div>
        <button className='btn-primary' onClick={reset} style={{ marginTop: '24px' }}>
          Play Again ↗
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
      {/* Header row */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Timer key='memory-timer' seconds={120} onTimeUp={handleTimeUp} type="memory" />
        <div style={{ textAlign: 'right' }}>
          <div className='section-label' style={{ color: 'var(--accent-pink)', marginBottom: '8px' }}>Total Moves</div>
          <div style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {moves}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        width: '100%',
        maxWidth: '480px',
      }}>
        {cards.map(card => {
          const isFlipped  = flippedIds.includes(card.id)
          const isMatched  = matchedIds.includes(card.id)
          const faceUp     = isFlipped || isMatched

          return (
            <motion.div
              key={card.id}
              style={{ perspective: '800px', cursor: isMatched ? 'default' : 'pointer', height: '100px' }}
              onClick={() => handleCardClick(card.id)}
              whileHover={!faceUp ? { scale: 1.05, y: -4 } : {}}
              whileTap={!faceUp ? { scale: 0.95 } : {}}
            >
              <motion.div
                animate={{ rotateY: faceUp ? 180 : 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
              >
                {/* Back */}
                <div className='backface-hidden' style={{
                  position: 'absolute', inset: 0, borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', color: 'rgba(255,255,255,0.15)',
                  transition: 'background 0.3s, border-color 0.3s',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  ✦
                </div>
                {/* Front */}
                <div className='backface-hidden rotate-y-180' style={{
                  position: 'absolute', inset: 0, borderRadius: '16px',
                  background: isMatched ? 'rgba(255, 0, 127, 0.1)' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${isMatched ? 'var(--accent-pink)' : 'rgba(255,255,255,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '40px',
                  boxShadow: isMatched ? '0 0 24px rgba(255, 0, 127, 0.3)' : '0 8px 32px rgba(0,0,0,0.5)',
                  filter: isMatched ? 'grayscale(0)' : 'grayscale(0.2)',
                }}>
                  {card.emoji}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Reset */}
      <button className='btn-secondary' onClick={reset}>
        ↺ Restart Level
      </button>
    </div>
  )
}
