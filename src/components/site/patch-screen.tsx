"use client";

import { AnimatePresence, motion } from "motion/react";
import { GitPullRequest, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "./status-bar";
import { useDemo, type PatchPhase } from "./demo-context";

export function PatchScreen() {
  const { patchPhase, play } = useDemo();
  return (
    <div className="relative flex h-full flex-col bg-paper">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="font-mono text-label tracking-label uppercase text-muted">ScreenToPatch</span>
        <span className="font-mono text-label tracking-label uppercase text-subtle">{labelFor(patchPhase)}</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {patchPhase === "idle" || patchPhase === "bug" || patchPhase === "record" ? (
            <motion.div key="bug" layout className="absolute inset-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              <BugView recording={patchPhase === "record"} highlight={patchPhase !== "idle"} onRecord={play} />
            </motion.div>
          ) : null}
          {patchPhase === "transcribe" ? (
            <motion.div key="tr" layout className="absolute inset-0" initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0 }}>
              <TranscribeView />
            </motion.div>
          ) : null}
          {patchPhase === "ast" ? (
            <motion.div key="ast" layout className="absolute inset-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AstView />
            </motion.div>
          ) : null}
          {patchPhase === "diff" ? (
            <motion.div key="diff" layout className="absolute inset-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DiffView />
            </motion.div>
          ) : null}
          {patchPhase === "pr" ? (
            <motion.div key="pr" layout className="absolute inset-0" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <PrView />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function labelFor(phase: PatchPhase) {
  switch (phase) {
    case "idle": return "Ready";
    case "bug": return "Glitch";
    case "record": return "Rec 0:05";
    case "transcribe": return "Whisper";
    case "ast": return "AST scan";
    case "diff": return "Diff";
    case "pr": return "PR #14";
  }
}

function BugView({ recording, highlight, onRecord }: { recording: boolean; highlight: boolean; onRecord: () => void }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-paper">
      <div className="px-4 pt-1">
        <p className="font-display text-lg font-black uppercase leading-tight">Checkout</p>
        <p className="font-mono text-label tracking-label uppercase text-muted">Aurora tee · qty 1</p>
      </div>
      <div className="mx-4 mt-3 border border-ink/15 p-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">$48.00</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span>Shipping</span>
          <span className="font-mono tabular-nums">$6.00</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/15 pt-2 font-display text-base font-black">
          <span>Total</span>
          <span className="font-mono">$54.00</span>
        </div>
      </div>
      <p className="px-4 pt-3 text-micro text-muted">Deliver to 14 Market St · ETA Friday</p>
      <div className={cn("relative mt-auto h-28 overflow-hidden", highlight && "ring-2 ring-inset ring-accent")}>
        {/* CTA morph: clipped -> fixed */}
        <motion.button
          type="button"
          tabIndex={-1}
          layoutId="cta-morph"
          animate={{ y: highlight ? 0 : 18, height: highlight ? 48 : 36 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-center bg-ink font-mono text-label tracking-label uppercase text-paper"
          style={{ y: highlight ? 0 : 18 } as any}
        >
          Place order
        </motion.button>
        {!highlight && <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-paper to-transparent pointer-events-none" />}
      </div>
      <AnimatePresence>
        {recording ? (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="absolute inset-x-0 bottom-0 bg-ink/96 px-4 py-3 text-paper">
            <div className="flex items-center gap-2">
              <span className="rec-dot size-2 rounded-full bg-accent" />
              <span className="font-mono text-label tracking-label uppercase">Recording</span>
            </div>
            <div className="mt-2 flex h-8 items-end gap-0.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-accent"
                  animate={{ scaleY: [0.35, 1, 0.55, 0.9, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: (i % 8) * 0.07 }}
                  style={{ height: `${10 + ((i * 37) % 22)}px`, transformOrigin: "bottom" }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-micro leading-snug text-paper/80">“The submit button is clipped on Android screens.”</p>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.(15); } catch {}
              onRecord();
            }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06, y: -2 }}
            className="absolute bottom-16 right-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-phone"
            aria-label="Record bug"
          >
            <Mic className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function TranscribeView() {
  return (
    <div className="flex h-full flex-col bg-code p-4 text-code-fg">
      <p className="font-mono text-label tracking-label uppercase text-accent">Whisper · 98.4%</p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 font-sans text-sm leading-relaxed">
        The submit button is clipped on Android screens.
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }} className="mt-6 space-y-2 font-mono text-micro text-code-fg/70">
        <p>intent · overflow clip</p>
        <p>target · btn.place-order</p>
        <p>fix · safe-area + mb-4</p>
      </motion.div>
    </div>
  );
}

const FILES = [
  { name: "src/", kind: "dir" as const, hit: false },
  { name: "  components/", kind: "dir" as const, hit: false },
  { name: "    CartSheet.tsx", kind: "file" as const, hit: false },
  { name: "    CheckoutFooter.tsx", kind: "file" as const, hit: true },
  { name: "    ProductCard.tsx", kind: "file" as const, hit: false },
  { name: "  styles.css", kind: "file" as const, hit: false },
];

function AstView() {
  return (
    <div className="flex h-full flex-col bg-code p-4 text-code-fg">
      <p className="font-mono text-label tracking-label uppercase text-accent">Tree-sitter scan</p>
      <ul className="mt-4 space-y-1 font-mono text-micro">
        {FILES.map((f, i) => (
          <motion.li
            key={f.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className={cn("px-2 py-1 rounded-sm", f.hit && "bg-accent text-accent-fg")}
          >
            {f.hit ? "▸ " : "  "}{f.name}
          </motion.li>
        ))}
      </ul>
      <p className="mt-auto font-mono text-label tracking-label uppercase text-subtle">Match · line 42</p>
    </div>
  );
}

function DiffView() {
  return (
    <div className="h-full overflow-auto bg-code p-3 font-mono text-label leading-relaxed text-code-fg">
      <p className="text-subtle">CheckoutFooter.tsx</p>
      <motion.p initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mt-2 text-danger">- overflow-hidden pb-0</motion.p>
      <motion.p initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 }} className="text-add">+ overflow-visible pb-6</motion.p>
      <motion.p initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.16 }} className="mt-2 text-danger">- className=&quot;btn-submit&quot;</motion.p>
      <motion.p initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.24 }} className="text-add">+ className=&quot;btn-submit mb-4&quot;</motion.p>
      <p className="mt-3 text-subtle">safe-area-inset-bottom applied ✓</p>
    </div>
  );
}

function PrView() {
  return (
    <div className="flex h-full flex-col bg-paper p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
        <GitPullRequest className="size-4 text-ok" />
        <span className="font-mono text-label tracking-label uppercase text-ok">Open · merged</span>
      </motion.div>
      <h3 className="mt-3 font-display text-xl font-black uppercase leading-tight">Fix clipped checkout CTA</h3>
      <p className="mt-1 font-mono text-micro text-muted">proto.patch/fix/ai-patch-14</p>
      <div className="mt-4 space-y-2 border border-ink/15 p-3 text-micro leading-relaxed text-muted">
        <p><span className="font-medium text-ink">Bug.</span> Place Order is clipped on Android viewports.</p>
        <p><span className="font-medium text-ink">Fix.</span> Restore overflow and add safe-area padding.</p>
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-auto flex h-11 items-center justify-center bg-ok font-mono text-label tracking-label uppercase text-paper">
        Review PR #14
      </motion.div>
    </div>
  );
}
