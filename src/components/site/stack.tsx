"use client";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { TextReveal } from "./text-reveal";

const STACK = [
  { name: "Django REST", role: "Orchestrator" },
  { name: "Gemini 3.6 Flash", role: "Vision LLM" },
  { name: "Whisper", role: "Speech to text" },
  { name: "Tree-sitter", role: "AST search" },
  { name: "PyGithub", role: "PR dispatch" },
  { name: "React PWA", role: "Mobile client" },
  { name: "Celery + Redis", role: "Async workers" },
  { name: "Tailwind CSS", role: "Generated UI" },
];

const HARDWARE = [
  { title: "Macro / OIS camera", copy: "Reads faint pencil and micro-annotations without a scanner." },
  { title: "Multi-mic array", copy: "Noise-cancelled voice notes in a loud hall or office." },
  { title: "On-device NPU", copy: "Local ink preprocessing and optional offline SLM inference." },
  { title: "High-refresh AMOLED", copy: "Sixty-frame sandbox preview of the generated interface." },
];

const METRICS = [
  { value: "15s", label: "Sketch to stack", numeric: 15, suffix: "s" },
  { value: "30s", label: "Napkin to patch", numeric: 30, suffix: "s" },
  { value: "10×", label: "Prototype velocity", numeric: 10, suffix: "×" },
  { value: "80%", label: "Faster bug turnaround", numeric: 80, suffix: "%" },
];

export function Stack() {
  return (
    <section className="border-t border-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-mono text-label tracking-label uppercase text-muted">Stack · Hardware · Impact</motion.p>
        <h2 className="mt-3 font-display text-section font-black uppercase leading-section tracking-section">
          <TextReveal>Built for flagship Android.</TextReveal>
        </h2>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-10 grid grid-cols-1 border-l border-t border-ink xs:grid-cols-2 sm:grid-cols-4">
          {STACK.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="group border-b border-r border-ink p-4 transition-[background-color,color,box-shadow] duration-200 hover:bg-ink hover:text-paper hover:shadow-[5px_5px_0_0_var(--color-accent)] cursor-default"
            >
              <p className="font-display text-base font-black uppercase leading-tight">{item.name}</p>
              <p className="mt-2 font-mono text-label tracking-label uppercase text-muted group-hover:text-paper/70">{item.role}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-2xl font-black uppercase">iQOO synergy</h3>
            <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
              {HARDWARE.map((row, i) => (
                <motion.li key={row.title} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="grid grid-cols-12 gap-4 py-4 hover:bg-cream/50 transition-colors px-1">
                  <p className="col-span-5 font-mono text-micro tracking-wide uppercase">{row.title}</p>
                  <p className="col-span-7 text-sm text-muted">{row.copy}</p>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 border-l border-t border-ink">
            {METRICS.map((m) => (
              <div key={m.label} className="border-b border-r border-ink p-5 hover:bg-cream transition-colors">
                <Count value={m.numeric} suffix={m.suffix} />
                <p className="mt-2 font-mono text-label tracking-label uppercase text-muted">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Count({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);
  useEffect(() => spring.on("change", (v) => { if (text.current) text.current.textContent = Math.round(v).toString(); }), [spring]);
  return (
    <p ref={ref} className="font-display text-4xl font-black tracking-display">
      <span ref={text}>0</span>{suffix}<span className="text-accent">.</span>
    </p>
  );
}
