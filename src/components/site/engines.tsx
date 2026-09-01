"use client";

import { motion } from "motion/react";
import { ArrowRight, Camera, GitPullRequest, Zap, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDemo } from "./demo-context";
import { TextReveal } from "./text-reveal";

export function Engines() {
  const { setMode, play } = useDemo();
  return (
    <section className="border-t border-ink">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        {[
          {
            id: "sketch",
            kicker: "02 · Genesis friction",
            icon: Camera,
            title: "Sketch2Stack",
            route: "/sketch",
            routeLabel: "Launch Sketch2Stack App",
            copy: "Eighty-five percent of architecture still starts on paper. Photograph a wireframe. In fifteen seconds the engine emits a live Tailwind UI and production Django models.",
            bullets: [
              "Client-side ink enhancement and contrast boost",
              "Vision model extracts layout, labels, and relations",
              "Frontend: semantic HTML + Tailwind utilities",
              "Backend: ORM models, serializers, REST routes",
            ],
            cta: "Run Demo Simulation",
            mode: "sketch" as const,
          },
          {
            id: "patch",
            kicker: "03 · Maintenance friction",
            icon: GitPullRequest,
            title: "ScreenToPatch",
            route: "/patch",
            routeLabel: "Launch ScreenToPatch App",
            copy: "Testers burn a third of the week reproducing mobile bugs. Record five seconds, speak the issue, and the engine opens a GitHub pull request with the exact diff.",
            bullets: [
              "Whisper transcription of the voice memo",
              "Frame-level visual glitch hypothesis",
              "Tree-sitter AST search across the repo",
              "PyGithub branch, commit, and PR dispatch",
            ],
            cta: "Run Demo Simulation",
            mode: "patch" as const,
            outline: true,
          },
        ].map((e, idx) => (
          <motion.article
            key={e.id}
            id={e.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: idx * 0.08 }}
            className="group border-b border-ink px-4 py-12 sm:px-8 sm:py-16 lg:border-b-0 lg:border-r last:border-r-0 scroll-mt-20 relative"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-label tracking-label uppercase text-muted">{e.kicker}</p>
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent font-mono text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase">
                <span className="size-1 rounded-full bg-accent animate-pulse" /> LIVE ENGINE
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <motion.span whileHover={{ rotate: 6, scale: 1.06 }} className="flex size-10 items-center justify-center border border-ink bg-paper group-hover:bg-ink group-hover:text-paper transition-colors duration-200">
                <e.icon className="size-4" />
              </motion.span>
              <h2 className="font-display text-section font-black uppercase leading-section tracking-section">
                <TextReveal>{e.title}</TextReveal>
              </h2>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">{e.copy}</p>

            <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              {e.bullets.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.06 * i }}
                  className="flex items-start gap-3 py-3 font-mono text-micro tracking-wide uppercase text-ink"
                >
                  <span className="mt-1 size-1.5 shrink-0 bg-accent group-hover:scale-125 transition-transform" />
                  {item}
                </motion.li>
              ))}
            </ul>

            {/* Action Buttons: REAL WORKING TOOL + DEMO SIMULATION */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={e.route}
                className="flex items-center gap-2 h-11 px-5 bg-ink text-paper font-mono text-label tracking-label uppercase font-bold hover:bg-accent hover:text-accent-fg hover:shadow-[0_4px_16px_rgba(255,68,0,0.3)] transition-all cursor-pointer"
              >
                <Zap className="size-3.5 fill-current text-accent group-hover:text-white" />
                <span>{e.routeLabel}</span>
                <ArrowRight className="size-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMode(e.mode);
                  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
                  window.setTimeout(() => play(e.mode), 400);
                }}
                className="flex items-center gap-1.5 h-11 px-4 border border-ink/30 bg-paper font-mono text-label tracking-label uppercase text-muted hover:border-ink hover:text-ink transition-colors cursor-pointer"
              >
                <Play className="size-3 fill-current" />
                <span>{e.cta}</span>
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
