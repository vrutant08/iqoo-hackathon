"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Play, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useDemo } from "./demo-context";
import { PhoneFrame } from "./phone-frame";
import { IqooHomeScreen } from "./iqoo-home-screen";
import { PatchScreen } from "./patch-screen";
import { SketchScreen } from "./sketch-screen";

const SKETCH_STEPS = [
  { id: "capture", label: "Capture" },
  { id: "enhance", label: "Ink enhance" },
  { id: "scan", label: "Vision parse" },
  { id: "generate", label: "Dual emit" },
  { id: "preview", label: "Hot reload" },
] as const;

const PATCH_STEPS = [
  { id: "bug", label: "Spot glitch" },
  { id: "record", label: "Voice + video" },
  { id: "transcribe", label: "Whisper" },
  { id: "ast", label: "AST locate" },
  { id: "diff", label: "Write diff" },
  { id: "pr", label: "Open PR" },
] as const;

export function DemoStage() {
  const { mode, setMode, play, reset, running, sketchPhase, patchPhase, jumpTo } =
    useDemo();
  const [appOpen, setAppOpen] = useState(false);

  const steps = mode === "sketch" ? SKETCH_STEPS : PATCH_STEPS;
  const phase = mode === "sketch" ? sketchPhase : patchPhase;
  const activeIndex = steps.findIndex((s) => s.id === phase);
  const progress = phase === "idle" ? 0 : activeIndex === -1 ? 100 : ((activeIndex + 1) / steps.length) * 100;

  const handlePlaySequence = () => {
    setAppOpen(true);
    play();
  };

  const handleModeSwitch = (m: "sketch" | "patch") => {
    setMode(m);
    setAppOpen(true);
  };

  const handleJumpTo = (stepId: string) => {
    setAppOpen(true);
    jumpTo(stepId as any);
  };

  const handleReset = () => {
    reset();
    setAppOpen(false);
  };

  return (
    <section id="demo" className="border-t border-ink scroll-mt-16">
      <LayoutGroup>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-start lg:gap-6 lg:py-20">
          {/* controls */}
          <div className="relative z-10 lg:col-span-3 lg:sticky lg:top-[72px]">
            <p className="font-mono text-label tracking-label uppercase text-muted">00 · Live engine</p>
            <h2 className="mt-3 font-display text-section font-black uppercase leading-section tracking-section">
              Run it on the device.
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted">
              Tap the <strong>&ldquo;ProtoPatch Studio&rdquo;</strong> widget on the iQOO display to launch the live engine, or control the pipeline sequence below.
            </p>

            <div className="mt-8 flex flex-col border border-ink overflow-hidden lg:flex-col">
              <ModeBtn active={mode === "sketch"} onClick={() => handleModeSwitch("sketch")} kicker="Mode 01" label="Sketch2Stack" />
              <ModeBtn active={mode === "patch"} onClick={() => handleModeSwitch("patch")} kicker="Mode 02" label="ScreenToPatch" />
            </div>

            {/* scrubbable timeline */}
            <div className="mt-6 border border-ink bg-paper">
              <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2">
                <span className="font-mono text-[10px] tracking-label uppercase text-muted">Pipeline</span>
                <span className="font-mono text-[10px] tracking-label uppercase text-subtle">{Math.round(progress)}%</span>
              </div>
              <div className="relative h-1.5 bg-cream mx-3 mt-3 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-accent"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                />
                <motion.div
                  className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-ink border-2 border-paper shadow"
                  animate={{ left: `calc(${progress}% - 5px)` }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
              </div>
              <ol className="mt-3">
                {steps.map((step, i) => {
                  const state = phase === "idle" ? "todo" : i < activeIndex ? "done" : i === activeIndex ? "now" : "todo";
                  return (
                    <li key={step.id} className="relative">
                      <button
                        type="button"
                        aria-label={`Jump to ${step.label}`}
                        onClick={() => handleJumpTo(step.id)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left border-t border-ink/5 first:border-t-0 transition-colors",
                          state === "now" && "bg-ink text-paper",
                          state === "done" && "bg-ink/5 hover:bg-ink/10",
                          state === "todo" && "hover:bg-cream",
                        )}
                      >
                        <span className={cn("font-mono text-micro tracking-label uppercase flex items-center gap-2", state === "now" ? "text-paper" : "text-ink")}>
                          <span className={cn("text-[10px] opacity-60", state === "now" && "text-accent opacity-100")}>{String(i + 1).padStart(2, "0")}</span>
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
                      </button>
                      {state === "now" && (
                        <motion.div layoutId="active-row" className="absolute inset-0 -z-10 bg-ink" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-5 flex gap-2">
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button onClick={handlePlaySequence} disabled={running} icon={<Play className="size-3.5 fill-current" />} className="w-full justify-center">
                  {running ? "Running" : "Play sequence"}
                </Button>
              </motion.div>
              <Button variant="outline" onClick={handleReset} icon={<RotateCcw className="size-3.5" />}>
                Reset
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-subtle">
              <Sparkles className="size-3 text-accent" /> Tap ProtoPatch Studio on iQOO display
            </p>
          </div>

          {/* iQOO Phone 3D Device Container */}
          <div className="flex items-center justify-center py-2 lg:col-span-5 lg:sticky lg:top-[88px]">
            <PhoneFrame
              onSwipeLeft={() => handleModeSwitch("patch")}
              onSwipeRight={() => handleModeSwitch("sketch")}
              isAppOpen={appOpen}
              onExitApp={() => setAppOpen(false)}
            >
              <AnimatePresence mode="wait">
                {!appOpen ? (
                  <motion.div
                    key="iqoo-home"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-full"
                  >
                    <IqooHomeScreen
                      onLaunchApp={(targetMode) => {
                        if (targetMode) handleModeSwitch(targetMode);
                        setAppOpen(true);
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, scale: 0.88, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    {mode === "sketch" ? <SketchScreen /> : <PatchScreen />}
                  </motion.div>
                )}
              </AnimatePresence>
            </PhoneFrame>
          </div>

          {/* sidecar - desktop */}
          <aside className="hidden lg:col-span-4 lg:block lg:sticky lg:top-[88px]">
            <div className="h-[clamp(30rem,42vw,36rem)]">
              <OutputPanel />
            </div>
          </aside>

          {/* sidecar - mobile drawer */}
          <div className="lg:hidden">
            <MobileOutput />
          </div>
        </div>
      </LayoutGroup>
    </section>
  );
}

function ModeBtn({ active, onClick, kicker, label }: { active: boolean; onClick: () => void; kicker: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 px-4 py-3.5 text-left transition-colors duration-200 overflow-hidden border-b border-ink last:border-b-0",
        active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-cream",
      )}
    >
      {active && <motion.div layoutId="mode-bg" className="absolute inset-0 bg-ink" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
      <span className={cn("relative block font-mono text-label tracking-label uppercase", active ? "text-paper/55" : "text-subtle")}>{kicker}</span>
      <span className="relative mt-1 block font-display text-base font-black uppercase leading-tight">{label}</span>
    </button>
  );
}

function OutputPanel() {
  const { mode, sketchPhase, patchPhase, sketchTab, setSketchTab } = useDemo();
  return (
    <div className="flex h-full min-h-96 flex-col border border-ink bg-code text-code-fg overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
        <span className="font-mono text-label tracking-label uppercase">Sidecar</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-label uppercase text-white/40">{mode}</span>
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-micro leading-relaxed">
        <AnimatePresence mode="wait">
          <motion.div key={mode + sketchPhase + patchPhase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {mode === "sketch" ? <SketchLog phase={sketchPhase} tab={sketchTab} onTab={setSketchTab} /> : <PatchLog phase={patchPhase} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileOutput() {
  const { mode, sketchPhase, patchPhase, sketchTab, setSketchTab } = useDemo();
  const isActive = sketchPhase !== "idle" || patchPhase !== "idle";
  return (
    <div className="border border-ink bg-code text-code-fg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-mono text-label tracking-label uppercase">Sidecar</span>
        <span className={cn("size-1.5 rounded-full", isActive ? "bg-accent" : "bg-white/20")} />
      </div>
      <div className="p-4 font-mono text-micro leading-relaxed">
        {mode === "sketch" ? <SketchLog phase={sketchPhase} tab={sketchTab} onTab={setSketchTab} /> : <PatchLog phase={patchPhase} />}
      </div>
    </div>
  );
}

function SketchLog({ phase, tab, onTab }: { phase: string; tab: string; onTab: (t: "ui" | "models" | "api") => void }) {
  if (phase === "idle") {
    return <p className="text-code-fg/60">Point the camera at a paper wireframe. Tap &ldquo;Try the APP&rdquo; on the device or play the sequence.</p>;
  }
  if (phase === "preview") {
    return (
      <div>
        <p className="text-accent">sandbox mounted ✓</p>
        <p className="mt-2">ProductCard.tsx · models.py · /api/products</p>
        <div className="mt-4 flex gap-2">
          {(["ui", "models", "api"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTab(t)}
              className={cn("relative h-8 border px-3 uppercase tracking-label text-label overflow-hidden", tab === t ? "border-accent text-accent-fg" : "border-white/20 text-code-fg")}
            >
              {tab === t && <motion.div layoutId="tab-pill" className="absolute inset-0 bg-accent" />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
        <pre className="mt-4 whitespace-pre-wrap text-code-fg/80">
          {tab === "models"
            ? "class Product(models.Model):\n    name = CharField(120)\n    price = DecimalField(8,2)\n    stock = PositiveIntegerField()"
            : tab === "api"
              ? "GET  /api/products\nPOST /api/products\n\nViewSet + serializer ready."
              : "Live UI is interactive on-device.\nAdd to bag increments cart."}
        </pre>
      </div>
    );
  }
  return (
    <p>
      <span className="text-accent">›</span> phase {phase}
      {"\n"}streaming vision tokens…
    </p>
  );
}

function PatchLog({ phase }: { phase: string }) {
  if (phase === "idle") {
    return <p className="text-code-fg/60">A clipped checkout CTA is already on-screen. Record a voice note or play the sequence to open PR #14.</p>;
  }
  if (phase === "pr") {
    return (
      <div>
        <p className="text-accent">pull request opened ✓</p>
        <p className="mt-2">github.com/protopatch/demo/pull/14</p>
        <p className="mt-4 text-code-fg/80">
          branch fix/ai-patch-14{"\n"}+ overflow-visible pb-6{"\n"}+ mb-4 safe-area
        </p>
      </div>
    );
  }
  return (
    <p>
      <span className="text-accent">›</span> phase {phase}
      {"\n"}locating CheckoutFooter.tsx
    </p>
  );
}
