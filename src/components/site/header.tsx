"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Menu, X, ArrowUpRight, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useDemo } from "./demo-context";
import { ProtoPatchLogo } from "./logo";

const NAV = [
  { id: "overview", num: "01", label: "Overview" },
  { id: "sketch", num: "02", label: "Sketch2Stack" },
  { id: "patch", num: "03", label: "ScreenToPatch" },
  { id: "architecture", num: "04", label: "Architecture" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("overview");
  const { setMode, play } = useDemo();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  // Update active navigation based on visible section
  useEffect(() => {
    const sectionIds = NAV.map((n) => n.id);
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const topEntry = visibleEntries[0];
          if (topEntry?.target.id) {
            setActive(topEntry.target.id);
          }
        }
      },
      { rootMargin: "-15% 0px -40% 0px", threshold: [0.1, 0.3, 0.6] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = useCallback((id: string) => {
    setOpen(false);
    setActive(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (id === "sketch") setMode("sketch");
    if (id === "patch") setMode("patch");
  }, [setMode]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/15 bg-paper/95 backdrop-blur-md supports-[backdrop-filter]:bg-paper/90 transition-shadow duration-300">
      {/* Dynamic top progress bar */}
      <motion.div className="absolute bottom-0 left-0 h-[2px] bg-accent origin-left" style={{ scaleX }} />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand with New Official Logo Graphic */}
        <a
          href="#overview"
          className="group flex items-center gap-2.5 font-display text-lg font-black tracking-tight uppercase"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <ProtoPatchLogo size={30} />
          <span className="leading-none">
            Proto<span className="text-subtle">.</span>Patch<span className="text-accent">.</span>
          </span>
        </a>

        {/* Center Pill Navigation */}
        <nav className="hidden items-center gap-1 lg:flex bg-ink/5 p-1 border border-ink/10 rounded-xs" aria-label="Primary">
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  "relative flex h-8 items-center gap-1.5 px-3 font-mono text-[11px] tracking-label uppercase transition-all duration-200 cursor-pointer",
                  isActive ? "text-paper font-semibold" : "text-muted hover:text-ink hover:bg-black/5",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 bg-ink shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className={cn("relative z-10", isActive ? "text-accent" : "text-subtle")}>
                  {item.num}
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Professional, Clean, Executive Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Action 1: Sketch2Stack Tool */}
          <Link
            to="/sketch"
            className="group hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 bg-ink text-paper font-mono text-label tracking-label uppercase transition-all duration-200 hover:bg-accent hover:text-accent-fg"
          >
            <span>Sketch2Stack</span>
            <ArrowUpRight className="size-3 text-accent group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Action 2: ScreenToPatch Tool */}
          <Link
            to="/patch"
            className="group hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 border border-ink/30 bg-paper text-ink font-mono text-label tracking-label uppercase transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper"
          >
            <span>ScreenToPatch</span>
            <ArrowUpRight className="size-3 text-muted group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Simulation Demo Trigger */}
          <button
            type="button"
            onClick={() => {
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
              play();
            }}
            className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3 font-mono text-[10px] tracking-label uppercase text-muted hover:text-ink transition-colors"
          >
            <Play className="size-3 fill-current opacity-70" />
            <span>Demo</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center border border-ink bg-paper lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className="size-5" />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Menu className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink bg-paper lg:hidden shadow-xl"
          >
            <nav className="mx-auto flex max-w-7xl flex-col p-4 space-y-2" aria-label="Mobile">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-ink/10">
                <Link
                  to="/sketch"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 bg-ink text-paper rounded-xs text-left font-mono text-label tracking-label uppercase"
                >
                  <span>Sketch2Stack</span>
                  <ArrowUpRight className="size-3.5 text-accent" />
                </Link>
                <Link
                  to="/patch"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 border border-ink bg-paper text-ink rounded-xs text-left font-mono text-label tracking-label uppercase"
                >
                  <span>ScreenToPatch</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {/* Standard Nav Links */}
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className="flex h-11 items-center justify-between border-b border-ink/5 px-2 font-mono text-xs tracking-label uppercase text-ink last:border-b-0"
                >
                  <span>{item.label}</span>
                  <span className="text-subtle">{item.num}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
