'use client'

import { Lock, Radical, Percent, PieChart, Variable, Zap, Puzzle, LayoutGrid } from 'lucide-react'

const LOCKED_GAMES = [
  { title: 'Square Root', desc: 'Estimate and solve square root problems.', icon: Radical },
  { title: 'Fractions', desc: 'Add, subtract and compare fractions.', icon: PieChart },
  { title: 'Percentages', desc: 'Calculate percentages in real-world scenarios.', icon: Percent },
  { title: 'Algebra', desc: 'Solve for x in simple equations.', icon: Variable },
  { title: 'Speed Math', desc: 'Race the clock with rapid-fire calculations.', icon: Zap },
  { title: 'Brain Puzzle', desc: 'Pattern recognition and logic challenges.', icon: Puzzle },
  { title: 'Logic Grid', desc: 'Deduce the solution from given clues.', icon: LayoutGrid },
]

export default function ComingSoonSection() {
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 pb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
        Coming Soon
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {LOCKED_GAMES.map(({ title, desc, icon: Icon }) => (
          <div
            key={title}
            className="relative rounded-2xl border border-[var(--border-subtle)] p-3 select-none overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', opacity: 0.5 }}
          >
            {/* Lock badge */}
            <div className="absolute top-2.5 right-2.5 text-zinc-600">
              <Lock size={12} />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={14} className="text-zinc-600" />
              <span className="text-[11px] font-semibold text-zinc-400">{title}</span>
            </div>
            <p className="text-[9px] leading-snug text-zinc-600">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
