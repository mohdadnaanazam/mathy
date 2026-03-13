'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useGameStore } from '@/store/gameStore'
import { useRouter } from 'next/navigation'
import { GameType } from '@/types'
import MobileArenaFooter from '@/components/layout/MobileArenaFooter'

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const setType = useGameStore(s => s.setGameType)

  function play(type: GameType) {
    setType(type)
    router.push('/game')
  }

  return (
    <main className="min-h-screen overflow-x-hidden relative pb-24 md:pb-0">
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex items-center pt-20 pb-16 px-4"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center">
          {/* Left: copy */}
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5">
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '999px',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 12px rgba(34,197,94,0.9)',
                }}
              />
              <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-slate-300">
                Practice math & memory
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
                Train your brain with
                <br />
                quick daily games.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
                Mathy gives you short, focused sessions for arithmetic and
                memory. Open the site, tap play, and finish a round in under
                two minutes.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <button
                className="btn-primary"
                style={{
                  backgroundColor: '#f97316',
                  boxShadow: '0 10px 30px rgba(248,113,113,0.35)',
                }}
                onClick={() => play('math')}
              >
                Get started now
              </button>
              <button
                className="btn-secondary"
                onClick={() => play('memory')}
              >
                Try memory cards
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-300 md:justify-start">
              <div>
                <div className="font-mono text-lg text-white">2</div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Game modes
                </div>
              </div>
              <div>
                <div className="font-mono text-lg text-white">90s</div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Average round
                </div>
              </div>
              <div>
                <div className="font-mono text-lg text-white">0</div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Sign-ups needed
                </div>
              </div>
            </div>
          </div>

          {/* Right: simple preview card */}
          <div className="flex-1">
            <div
              className="card"
              style={{
                padding: '24px',
                maxWidth: '420px',
                margin: '0 auto',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '999px',
                      backgroundColor: '#22c55e',
                    }}
                  />
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
                    Next round
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  01:30
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-6 mb-4">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
                  Example question
                </div>
                <div className="text-3xl font-semibold text-white">
                  7 × 8 = <span className="text-gradient">?</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {['52', '54', '56', '60'].map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    className="rounded-lg border border-slate-700 bg-slate-900/70 py-2 text-center text-sm font-mono text-slate-200"
                    style={
                      idx === 2
                        ? {
                            borderColor: '#22c55e',
                            color: '#bbf7d0',
                          }
                        : undefined
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="w-full rounded-full bg-slate-100 py-2.5 text-sm font-semibold tracking-[0.14em] uppercase text-slate-900"
                onClick={() => play('math')}
              >
                Play a quick round
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE SECTIONS */}
      <section className="border-t border-slate-800 bg-[#050816] py-12">
        <div className="container">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="section-label mb-2">/ Modes</div>
              <h2 className="text-2xl font-semibold text-white">
                Two simple ways to play.
              </h2>
            </div>
            <Link
              href="/game"
              className="text-xs font-mono uppercase tracking-[0.18em] text-slate-300"
            >
              Open game &rarr;
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <div className="text-sm font-mono uppercase tracking-[0.18em] text-slate-400 mb-2">
                Math
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Timed arithmetic drills
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                Practice addition, subtraction, multiplication, and division
                with a 90-second timer.
              </p>
              <button
                type="button"
                className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300"
                onClick={() => play('math')}
              >
                Start math mode &rarr;
              </button>
            </div>

            <div className="card p-5">
              <div className="text-sm font-mono uppercase tracking-[0.18em] text-slate-400 mb-2">
                Memory
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Flip-and-match cards
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                Strengthen short-term memory with quick emoji matching
                rounds.
              </p>
              <button
                type="button"
                className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300"
                onClick={() => play('memory')}
              >
                Start memory mode &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile arena footer (same as game screen) */}
      <MobileArenaFooter />
    </main>
  )
}
