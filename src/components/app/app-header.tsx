"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api-client";
import { ProtoPatchLogo } from "@/components/site/logo";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [health, setHealth] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    checkHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/15 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-label tracking-label uppercase text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
          <span className="text-cream">/</span>
          <div>
            <h1 className="font-display text-lg font-black tracking-tight uppercase leading-none">
              {title}
              <span className="text-accent">.</span>
            </h1>
            {subtitle && (
              <p className="font-mono text-[10px] tracking-label uppercase text-subtle leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-label uppercase">
            <motion.span
              className="size-2 rounded-full"
              animate={{
                backgroundColor:
                  health === "ok"
                    ? "var(--color-ok)"
                    : health === "error"
                      ? "var(--color-danger)"
                      : "var(--color-subtle)",
                scale: health === "loading" ? [1, 1.3, 1] : 1,
              }}
              transition={
                health === "loading"
                  ? { duration: 0.8, repeat: Infinity }
                  : { duration: 0.3 }
              }
            />
            <span className="hidden sm:inline text-muted">
              {health === "ok" ? "Backend online" : health === "error" ? "Backend offline" : "Connecting…"}
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-sm font-black tracking-tight uppercase hover:opacity-80 transition-opacity"
          >
            <ProtoPatchLogo size={24} />
            <span>
              Proto<span className="text-subtle">.</span>Patch<span className="text-accent">.</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
