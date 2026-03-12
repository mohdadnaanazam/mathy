'use client'
import { useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { GameType } from '@/types'

const ParticleBackground = dynamic(() => import('@/components/three/ParticleBackground'), {
  ssr: false,
  loading: () => null,
})

const GAME_CARDS = [
  { tag: '01', icon: '➕', title: 'Basic Math',    desc: 'Addition & subtraction puzzles', diff: 'Easy',   time: '90s', type: 'math'   as GameType, color: 'var(--accent-cyan)' },
  { tag: '02', icon: '🧩', title: 'Memory Match',  desc: 'Flip & pair emoji cards',        diff: 'Medium', time: '2m',  type: 'memory' as GameType, color: 'var(--accent-pink)' },
  { tag: '03', icon: '✖️', title: 'Multiply',      desc: 'Times tables speed challenge',   diff: 'Medium', time: '90s', type: 'math'   as GameType, color: 'var(--accent-purple)' },
  { tag: '04', icon: '⚡', title: 'Speed Math',    desc: '60-second arithmetic sprint',    diff: 'Hard',   time: '60s', type: 'math'   as GameType, color: '#FFB800' },
]

const STEPS = [
  { n: '01', title: 'Instant Access', body: 'No account, no onboarding. Open the site and start playing immediately.' },
  { n: '02', title: 'Pick a Challenge', body: 'Train your brain with math puzzles or visual memory matching games.' },
  { n: '03', title: 'Daily Limits', body: 'Play up to 15 games per hour. Your attempts reset automatically.' },
]

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16,1,0.3,1] as [number,number,number,number] } },
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const router  = useRouter()
  const setType = useGameStore(s => s.setGameType)

  useGSAP(() => {
    if (!heroRef.current) return
    gsap.timeline({ delay: 0.1 })
      .from('.h-tag',  { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.h-h1',   { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.h-sub',  { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
      .from('.h-ctas', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.h-stat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }, '-=0.4')
  }, { scope: heroRef })

  function play(type: GameType) {
    setType(type)
    router.push('/game')
  }

  return (
    <main style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Grid background base */}
      <div className='grid-bg' style={{ position: 'absolute', inset: 0, opacity: 1, pointerEvents: 'none', zIndex: -1 }} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', paddingBottom: '80px' }}>

        {/* Three.js particles */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
          <ParticleBackground />
        </div>

        {/* Center Glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px', height: '800px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112,0,255,0.15) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '900px', width: '100%' }}>

          {/* Tag */}
          <div className='h-tag' style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: '100px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              background: 'rgba(0, 240, 255, 0.05)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.1) inset'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block', boxShadow: '0 0 10px var(--accent-cyan)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-cyan)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                Instant browser play
              </span>
            </div>
          </div>

          {/* H1 */}
          <h1 className='h-h1' style={{
            fontSize: 'clamp(56px, 10vw, 130px)',
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#fff',
            marginBottom: '32px',
          }}>
            Train Your
            <br /><span className='text-gradient'>Brain.</span>
          </h1>

          {/* Sub */}
          <p className='h-sub' style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '520px',
            margin: '0 auto 48px',
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            AI-powered math equations and memory challenges.
            <br />No sign-up. Just open and start playing.
          </p>

          {/* CTAs */}
          <div className='h-ctas' style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
            <button className='btn-primary' onClick={() => play('math')}>
              ✦ Play Now — It's Free
            </button>
            <button className='btn-secondary' onClick={() => play('memory')}>
              🧩 Memory Challenge
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '48px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            paddingTop: '40px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 100%)',
            margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '24px 24px 0 0'
          }}>
            {[
              { val: '2',    lbl: 'Modes', color: 'var(--accent-cyan)'  },
              { val: '15',   lbl: 'Per Hr', color: 'var(--accent-pink)'    },
              { val: '0',    lbl: 'Signups', color: 'var(--accent-purple)'  },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} className='h-stat' style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                  {val}<span style={{ color }}>.</span>
                </div>
                <div className='section-label' style={{ marginTop: '12px', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GAME MODES ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)', opacity: 0.3 }} />
        
        <div className='container'>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '64px', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div className='section-label' style={{ marginBottom: '16px' }}>/ Game Modes</div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Choose your <span className='text-gradient-purple'>challenge.</span>
              </h2>
            </div>
            <Link href='/game' style={{
              color: 'var(--accent-pink)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em', fontWeight: 700, background: 'rgba(255,0,127,0.1)', padding: '8px 16px', borderRadius: '100px'
            }}>
              View All ↗
            </Link>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {GAME_CARDS.map((c, i) => (
              <motion.div
                key={c.tag}
                initial='hidden'
                whileInView='show'
                viewport={{ once: true, margin: '-80px' }}
                variants={itemVariants}
                style={{ transitionDelay: `${i * 0.1}s`, height: '100%' }}
              >
                <div
                  className='card'
                  onClick={() => play(c.type)}
                  style={{
                    padding: '32px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${c.color}20, transparent 70%)`, pointerEvents: 'none' }} />
                  
                  <div>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ fontSize: '40px', lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{c.icon}</div>
                      <span className='section-label' style={{ color: 'rgba(255,255,255,0.2)' }}>{c.tag}</span>
                    </div>

                    {/* Title + desc */}
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{c.title}</h3>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '32px' }}>{c.desc}</p>
                  </div>

                  {/* Meta + CTA row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: c.color }}>{c.diff}</span>
                      <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '14px' }}>·</span>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{c.time}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', transition: 'transform 0.2s', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '100px' }}>Play ↗</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-purple), transparent)', opacity: 0.3 }} />
        
        <div className='container'>
          <div style={{ marginBottom: '64px' }}>
            <div className='section-label' style={{ marginBottom: '16px' }}>/ How it works</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Three steps.<br /><span className='text-gradient'>Zero friction.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial='hidden'
                whileInView='show'
                viewport={{ once: true }}
                variants={itemVariants}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className='card' style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: -20, right: -20, fontSize: '120px', fontWeight: 700, color: 'rgba(255,255,255,0.02)', fontFamily: 'var(--font-sans)', lineHeight: 1, pointerEvents: 'none' }}>{s.n}</div>
                  
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>STEP {s.n}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{s.title}</h3>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ════════════════════════════════════════════════════ */}
      <section style={{ padding: '160px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-pink), transparent)', opacity: 0.5 }} />
        
        {/* Massive background glow for CTA */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(255,0,127,0.1) 0%, transparent 60%)', zIndex: -1, pointerEvents: 'none' }} />
        
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', padding: '0 32px' }}>
          <div className='section-label' style={{ marginBottom: '24px', justifyContent: 'center' }}>/ Ready?</div>
          <h2 style={{
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            marginBottom: '32px',
          }}>
            Ready to <span className='text-gradient'>play?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', marginBottom: '48px', lineHeight: 1.6 }}>
            No downloads, no sign-up, no waiting. Experience the next generation of brain training instantly.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className='btn-primary' onClick={() => play('math')} style={{ padding: '20px 48px', fontSize: '18px' }}>
              ✦ Jump Right In
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
