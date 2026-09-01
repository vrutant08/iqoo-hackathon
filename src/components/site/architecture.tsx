"use client";
import { motion } from "motion/react";
import { TextReveal } from "./text-reveal";

const COLS = [
  { kicker: "01 Input", title: "Mobile", items: ["Camera capture", "Screen recording", "Voice memo"] },
  { kicker: "02 Gateway", title: "Django", items: ["REST router", "Celery / Redis", "GitHub OAuth"] },
  { kicker: "03 Intelligence", title: "Multimodal", items: ["Gemini 3.6 Flash", "Whisper STT", "Tree-sitter AST"] },
  { kicker: "04 Output", title: "Deliverable", items: ["Live sandbox UI", "Django models", "GitHub pull request"] },
];

export function Architecture() {
  return (
    <section id="architecture" className="border-t border-ink scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-mono text-label tracking-label uppercase text-muted">04 · Blueprint</motion.p>
        <h2 className="mt-3 max-w-3xl font-display text-section font-black uppercase leading-section tracking-section">
          <TextReveal>Dual-engine orchestrator.</TextReveal>
        </h2>
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-4 max-w-2xl text-sm text-muted">A touch-native PWA on the device. A Python intelligence layer behind it. No desktop IDE required to go from paper to a merged patch.</motion.p>

        <p className="mt-2 font-mono text-[10px] tracking-label uppercase text-subtle md:hidden">Swipe →</p>

        <div className="scrollbar-hide mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto border border-ink p-0 md:grid md:grid-cols-4 md:gap-0 md:overflow-visible">
          {COLS.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className="group relative w-[78%] shrink-0 snap-center border border-ink/15 bg-surface p-6 transition-colors hover:bg-cream/40 sm:w-[52%] md:w-auto md:shrink md:border-0 md:border-b-0 md:border-r md:border-ink md:bg-transparent md:last:border-r-0"
            >
              <p className="flex items-center justify-between font-mono text-label tracking-label uppercase text-muted">
                {col.kicker}
                {i < COLS.length - 1 ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-ink transition-colors group-hover:text-accent"
                    aria-hidden
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 12h14" strokeDasharray="3 3" className="dash-move" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                ) : null}
              </p>
              <h3 className="mt-3 font-display text-2xl font-black uppercase">{col.title}</h3>
              <ul className="mt-6 space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-muted flex items-start gap-2">
                    <span className="mt-2 size-1 bg-accent shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <motion.div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
