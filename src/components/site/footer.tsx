"use client";

import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";

const TICKER = [
  "Napkin in → full stack out",
  "Screen bug in → merged PR out",
  "15s sketch to stack",
  "Voice note → working diff",
  "Built for flagship Android",
];

export function Footer() {
  return (
    <footer className="border-t border-ink bg-ink text-paper">
      <div className="overflow-hidden border-b border-paper/10 py-3" aria-hidden>
        <div className="ticker-track flex w-max items-center gap-10 whitespace-nowrap">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-mono text-label tracking-label uppercase text-paper/45"
            >
              {item}
              <span className="size-1 rounded-full bg-accent/70" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <p className="font-display text-3xl font-black uppercase tracking-tight">
            Proto<span className="text-subtle">.</span>Patch
            <span className="text-accent">.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/70">
            From napkin prototype to merged patch in thirty seconds. A
            multimodal developer engine built for the iQOO National Hackathon —
            productivity and developer velocity, measured.
          </p>
        </motion.div>

        <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-end">
          <p className="font-mono text-label tracking-label uppercase text-paper/50">
            iQOO National Hackathon · Phase 1
          </p>
          <motion.button
            type="button"
            aria-label="Back to top"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.94 }}
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="flex size-11 items-center justify-center border border-paper/25 text-paper/70 transition-colors duration-150 hover:border-accent hover:bg-accent hover:text-accent-fg"
          >
            <ArrowUp className="size-4" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
