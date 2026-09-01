"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Link, useMatch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProtoPatchLogo } from "./logo";

/**
 * Minimal Executive Floating Dock
 * Appears after scrolling past the hero to give effortless access to both tools.
 */
export function FloatingCTA() {
  const match = useMatch({ from: "/", shouldThrow: false });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!match) return;

    const onScroll = () => {
      setScrolled(window.scrollY > 450);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [match]);

  if (!match) return null;

  return (
    <AnimatePresence>
      {scrolled && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 border border-ink/20 bg-paper/95 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.18)] backdrop-blur-md rounded-xs">
            <div className="flex items-center gap-2 pl-2 pr-1">
              <ProtoPatchLogo size={20} />
              <span className="hidden font-mono text-[10px] tracking-label uppercase text-muted sm:inline">
                Live Prototype
              </span>
            </div>

            <Link
              to="/sketch"
              className="flex h-8 items-center gap-1.5 px-3 bg-ink text-paper font-mono text-[11px] tracking-label uppercase font-medium hover:bg-accent hover:text-accent-fg transition-colors"
            >
              <span>Sketch2Stack</span>
              <ArrowUpRight className="size-3 text-accent hover:text-white" />
            </Link>

            <Link
              to="/patch"
              className="flex h-8 items-center gap-1.5 px-3 border border-ink/30 bg-paper text-ink font-mono text-[11px] tracking-label uppercase font-medium hover:border-ink hover:bg-ink hover:text-paper transition-colors"
            >
              <span>ScreenToPatch</span>
              <ArrowUpRight className="size-3 text-muted" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
