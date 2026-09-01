"use client";

import { cn } from "@/lib/utils";

interface DiffViewerProps {
  diff: string;
  className?: string;
}

export function DiffViewer({ diff, className }: DiffViewerProps) {
  if (!diff || !diff.trim()) {
    return (
      <div className={cn("border border-ink/10 bg-code p-4 font-mono text-micro text-white/40 italic", className)}>
        No diff generated — review the suggested fix above.
      </div>
    );
  }

  const lines = diff.split("\n");

  return (
    <div className={cn("overflow-hidden border border-ink/10 bg-code", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-mono text-label tracking-label uppercase text-accent">
          Unified Diff
        </span>
        <span className="font-mono text-[10px] tracking-label uppercase text-white/30">
          {lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length} additions
          {" · "}
          {lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length} deletions
        </span>
      </div>
      <pre className="overflow-auto p-3 font-mono text-micro leading-relaxed max-h-[20rem]">
        {lines.map((line, i) => {
          let lineClass = "text-code-fg/80";
          let bgClass = "";

          if (line.startsWith("+++") || line.startsWith("---")) {
            lineClass = "text-white/50 font-bold";
          } else if (line.startsWith("@@")) {
            lineClass = "text-accent/80";
            bgClass = "bg-accent/5";
          } else if (line.startsWith("+")) {
            lineClass = "text-add";
            bgClass = "bg-add/8";
          } else if (line.startsWith("-")) {
            lineClass = "text-danger";
            bgClass = "bg-danger/8";
          }

          return (
            <div key={i} className={cn("px-1 -mx-1", bgClass)}>
              <span className={lineClass}>{line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
