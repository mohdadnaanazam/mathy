/**
 * Static SEO content section rendered on the homepage.
 * Provides crawlable text with natural keyword usage for search engines.
 * Visually subtle so it doesn't compete with the interactive game UI.
 */
export default function SeoSection() {
  return (
    <section
      className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 pb-2"
      aria-label="About Mathy"
    >
      <h2 className="text-sm font-semibold text-slate-300 mb-2">
        Free Brain Training Games — Powered by AI
      </h2>
      <div className="space-y-2 text-[11px] sm:text-xs leading-relaxed text-slate-500">
        <p>
          Mathy is a free online brain training app that generates fresh math puzzles and memory
          challenges every hour using AI. Practice addition, subtraction, multiplication, and
          division at easy, medium, or hard difficulty — no signup required.
        </p>
        <p>
          Choose from three game modes: solve math equations in <strong className="text-slate-400">Math Challenge</strong>,
          recall highlighted patterns in <strong className="text-slate-400">Memory Grid</strong>,
          or test your instincts with <strong className="text-slate-400">True / False Math</strong>.
          Each session tracks your progress so you can pick up where you left off.
        </p>
        <p>
          Whether you want daily mental math practice, a quick memory workout, or a fun way to
          sharpen your problem-solving skills, Mathy keeps your brain active with new content
          every session.
        </p>
      </div>
    </section>
  )
}
