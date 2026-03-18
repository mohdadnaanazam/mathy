'use client'

import { Radical, Percent, PieChart, Variable, Zap, Puzzle, LayoutGrid } from 'lucide-react'

export interface MoreGame {
  id: string
  title: string
  desc: string
  icon: typeof Radical
}

export const MORE_GAMES: MoreGame[] = [
  { id: 'square_root',  title: 'Square Root',  desc: 'Estimate and solve square roots.',       icon: Radical },
  { id: 'fractions',    title: 'Fractions',     desc: 'Add, subtract and compare fractions.',   icon: PieChart },
  { id: 'percentage',   title: 'Percentages',   desc: 'Calculate real-world percentages.',      icon: Percent },
  { id: 'algebra',      title: 'Algebra',       desc: 'Solve for x in simple equations.',       icon: Variable },
  { id: 'speed_math',   title: 'Speed Math',    desc: 'Rapid-fire chain calculations.',         icon: Zap },
  { id: 'brain_puzzle', title: 'Brain Puzzle',   desc: 'Pattern and logic challenges.',          icon: Puzzle },
  { id: 'logic_grid',   title: 'Logic Grid',    desc: 'Deduce solutions from clues.',           icon: LayoutGrid },
]

export default function ComingSoonSection() {
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-5 pb-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mb-2.5">
        More Games
      </p>

      <div className="grid grid-cols-2 gap-2">
        {MORE_GAMES.map(({ id, title, desc, icon: Icon }) => (
          <div
            key={id}
            className="rounded-xl border border-zinc-800/60 p-3 select-none cursor-default"
            style={{ backgroundColor: 'rgba(24,24,27,0.5)' }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon size={13} className="text-zinc-500 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-300 truncate">{title}</span>
            </div>
            <p className="text-[9px] leading-snug text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
