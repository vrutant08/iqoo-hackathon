"use client";
import { motion } from "motion/react";
import { TextReveal } from "./text-reveal";

const ROWS = [
  { name: "Copilot / Cursor", gap: "Desktop-locked. Cannot ingest paper or a phone screen recording." },
  { name: "v0 / Bolt", gap: "Text prompts only. No camera, schema parse, or patch loop." },
  { name: "Jira / Loom", gap: "Records the bug. Never writes the fix or opens the PR." },
  { name: "ProtoPatch", gap: "Paper in, running stack out. Screen bug in, merged PR out." },
];

export function Compare() {
  return (
    <section id="compare" className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-mono text-label tracking-label uppercase text-muted">Why the wrappers fail</motion.p>
        <h2 className="mt-3 font-display text-section font-black uppercase leading-section tracking-section">
          <TextReveal>Not another prompt box.</TextReveal>
        </h2>
        <div className="mt-10 border-t border-ink overflow-hidden">
          {ROWS.map((row, i) => {
            const ours = row.name === "ProtoPatch";
            return (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: ours ? 0 : 4 }}
                className={ours ? "relative grid gap-2 overflow-hidden border-b border-ink bg-ink px-4 py-5 text-paper sm:grid-cols-12 sm:items-baseline" : "grid gap-2 border-b border-ink px-4 py-5 sm:grid-cols-12 sm:items-baseline hover:bg-cream transition-colors"}
              >
                {ours && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-paper"
                    initial={{ scaleX: 1 }}
                    whileInView={{ scaleX: 0 }}
                    style={{ originX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  />
                )}
                <p className="relative font-display text-lg font-black uppercase sm:col-span-4">{row.name}{ours ? <span className="text-accent">.</span> : null}</p>
                <p className={ours ? "relative text-sm text-paper/75 sm:col-span-8" : "text-sm text-muted sm:col-span-8"}>{row.gap}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
