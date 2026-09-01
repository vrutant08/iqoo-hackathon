"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface PipelineProgressProps {
  steps: Step[];
  currentStep: string | null;
  className?: string;
}

export function PipelineProgress({ steps, currentStep, className }: PipelineProgressProps) {
  const currentIndex = currentStep ? steps.findIndex((s) => s.id === currentStep) : -1;
  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className={cn("border border-ink bg-paper", className)}>
      <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2">
        <span className="font-mono text-[10px] tracking-label uppercase text-muted">
          Pipeline
        </span>
        <span className="font-mono text-[10px] tracking-label uppercase text-subtle">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-cream mx-3 mt-3 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-accent"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>

      {/* Steps */}
      <ol className="mt-3">
        {steps.map((step, i) => {
          const state =
            currentIndex === -1
              ? "todo"
              : i < currentIndex
                ? "done"
                : i === currentIndex
                  ? "now"
                  : "todo";

          return (
            <li key={step.id} className="relative">
              <div
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 border-t border-ink/5 first:border-t-0 transition-colors",
                  state === "now" && "bg-ink text-paper",
                  state === "done" && "bg-ink/5",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-micro tracking-label uppercase flex items-center gap-2",
                    state === "now" ? "text-paper" : "text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] opacity-60",
                      state === "now" && "text-accent opacity-100",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step.label}
                </span>
                <span
                  className={cn(
                    "size-2 rounded-full transition-all duration-300",
                    state === "now" && "bg-accent scale-125",
                    state === "done" && "bg-ok",
                    state === "todo" && "bg-ink/20",
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
