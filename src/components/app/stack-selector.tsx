"use client";

import { motion } from "motion/react";
import { Layers, Server, Database, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StackSelection } from "@/lib/api-client";

interface StackSelectorProps {
  value: StackSelection;
  onChange: (value: StackSelection) => void;
  disabled?: boolean;
}

const FRONTEND_OPTIONS: { id: StackSelection["frontend"]; label: string; tag: string }[] = [
  { id: "react", label: "React 19", tag: "Vite + Tailwind" },
  { id: "nextjs", label: "Next.js 15", tag: "App Router" },
  { id: "vue", label: "Vue 3", tag: "Composition API" },
  { id: "html_tailwind", label: "HTML5", tag: "Tailwind CDN" },
];

const BACKEND_OPTIONS: { id: StackSelection["backend"]; label: string; tag: string }[] = [
  { id: "fastapi", label: "FastAPI", tag: "Python 3.12" },
  { id: "django", label: "Django REST", tag: "DRF + ORM" },
  { id: "express_ts", label: "Express", tag: "TypeScript" },
  { id: "go_gin", label: "Go (Gin)", tag: "High Perf" },
];

const DATABASE_OPTIONS: { id: StackSelection["database"]; label: string; tag: string }[] = [
  { id: "postgresql", label: "PostgreSQL", tag: "Relational" },
  { id: "sqlite", label: "SQLite", tag: "Embedded" },
  { id: "mongodb", label: "MongoDB", tag: "Document" },
];

export function StackSelector({ value, onChange, disabled }: StackSelectorProps) {
  const updateStack = <K extends keyof StackSelection>(key: K, val: StackSelection[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-4 rounded-none border border-ink/20 bg-paper p-4 text-ink">
      <div className="flex items-center justify-between border-b border-ink/10 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent" />
          <span className="font-mono text-label uppercase tracking-label font-bold text-ink">
            Target Full-Stack Architecture
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
          {value.frontend.replace("_", " ")} · {value.backend.replace("_", " ")} · {value.database}
        </span>
      </div>

      {/* Frontend selection */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Layers className="size-3 text-subtle" /> Frontend Framework
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FRONTEND_OPTIONS.map((opt) => {
            const selected = value.frontend === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => !disabled && updateStack("frontend", opt.id)}
                whileTap={!disabled ? { scale: 0.98 } : undefined}
                className={cn(
                  "flex flex-col items-start p-2.5 text-left border transition-all text-xs font-mono",
                  selected
                    ? "border-accent bg-accent/5 text-ink shadow-sm"
                    : "border-ink/15 bg-paper text-muted hover:border-ink/40 hover:text-ink",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">{opt.label}</span>
                  {selected && <Check className="size-3 text-accent shrink-0" />}
                </div>
                <span className="text-[10px] text-subtle mt-0.5">{opt.tag}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Backend selection */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Server className="size-3 text-subtle" /> Backend & API
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BACKEND_OPTIONS.map((opt) => {
            const selected = value.backend === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => !disabled && updateStack("backend", opt.id)}
                whileTap={!disabled ? { scale: 0.98 } : undefined}
                className={cn(
                  "flex flex-col items-start p-2.5 text-left border transition-all text-xs font-mono",
                  selected
                    ? "border-accent bg-accent/5 text-ink shadow-sm"
                    : "border-ink/15 bg-paper text-muted hover:border-ink/40 hover:text-ink",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">{opt.label}</span>
                  {selected && <Check className="size-3 text-accent shrink-0" />}
                </div>
                <span className="text-[10px] text-subtle mt-0.5">{opt.tag}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Database selection */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Database className="size-3 text-subtle" /> Database & Schema
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DATABASE_OPTIONS.map((opt) => {
            const selected = value.database === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => !disabled && updateStack("database", opt.id)}
                whileTap={!disabled ? { scale: 0.98 } : undefined}
                className={cn(
                  "flex flex-col items-start p-2.5 text-left border transition-all text-xs font-mono",
                  selected
                    ? "border-accent bg-accent/5 text-ink shadow-sm"
                    : "border-ink/15 bg-paper text-muted hover:border-ink/40 hover:text-ink",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">{opt.label}</span>
                  {selected && <Check className="size-3 text-accent shrink-0" />}
                </div>
                <span className="text-[10px] text-subtle mt-0.5">{opt.tag}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
