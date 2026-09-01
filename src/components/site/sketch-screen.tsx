"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Camera, Check, ShoppingBag, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { NapkinSketch } from "./napkin-sketch";
import { StatusBar } from "./status-bar";
import { useDemo, type SketchPhase, type SketchTab } from "./demo-context";

const GEN_LINES = [
  { delay: 0, text: "vision.parse(napkin.jpg)" },
  { delay: 0.18, text: "layout · product-card · 4 regions" },
  { delay: 0.38, text: 'ocr · "AURORA TEE" · "$48"' },
  { delay: 0.58, text: "emit · ProductCard.tsx" },
  { delay: 0.78, text: "emit · models.Product" },
  { delay: 0.98, text: "sandbox · hot-reload ok" },
];

export function SketchScreen() {
  const { sketchPhase, sketchTab, setSketchTab, play, running, addToBag, cartCount } = useDemo();

  return (
    <div className="relative flex h-full flex-col bg-paper">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="font-mono text-label tracking-label uppercase text-muted">Sketch2Stack</span>
        <span className="font-mono text-label tracking-label uppercase text-subtle">{labelFor(sketchPhase)}</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {sketchPhase === "idle" || sketchPhase === "capture" ? (
            <motion.div
              key="cam"
              layout
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <CameraView onShutter={play} capturing={sketchPhase === "capture"} />
            </motion.div>
          ) : null}
          {sketchPhase === "enhance" || sketchPhase === "scan" ? (
            <motion.div
              key="scan"
              layout
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
            >
              <ScanView phase={sketchPhase} />
            </motion.div>
          ) : null}
          {sketchPhase === "generate" ? (
            <motion.div
              key="gen"
              layout
              className="absolute inset-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.34 }}
            >
              <GenerateView />
            </motion.div>
          ) : null}
          {sketchPhase === "preview" ? (
            <motion.div
              key="prev"
              layout
              className="absolute inset-0"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
            >
              <PreviewView tab={sketchTab} onTab={setSketchTab} onAdd={addToBag} cartCount={cartCount} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {running ? (
        <div className="h-1 bg-cream overflow-hidden">
          <motion.div className="h-full bg-accent" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5.2, ease: "linear" }} />
        </div>
      ) : null}
    </div>
  );
}

function labelFor(phase: SketchPhase) {
  switch (phase) {
    case "idle":
      return "Ready";
    case "capture":
      return "Shutter";
    case "enhance":
      return "Ink boost";
    case "scan":
      return "Vision";
    case "generate":
      return "Compile";
    case "preview":
      return "Live";
  }
}

function CameraView({ onShutter, capturing }: { onShutter: () => void; capturing: boolean }) {
  const doShutter = () => {
    try {
      navigator.vibrate?.(18);
    } catch {}
    onShutter();
  };
  return (
    <div className="relative flex h-full flex-col bg-ink">
      <motion.div
        layoutId="napkin-morph"
        className="relative mx-3 mt-1 min-h-0 flex-1 overflow-hidden rounded-md bg-cream"
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <motion.div
          className="absolute inset-0 origin-center p-4"
          animate={{ rotate: capturing ? 0 : -4, scale: capturing ? 1 : 1.1 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        >
          <div className="h-full w-full shadow-md">
            <NapkinSketch />
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-6 border border-paper/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 border border-paper/70" />
        <AnimatePresence>
          {capturing ? <motion.div className="shutter-flash pointer-events-none absolute inset-0 bg-paper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /> : null}
        </AnimatePresence>
      </motion.div>
      <div className="flex items-center justify-center gap-8 py-4">
        <Sparkles className="size-4 text-paper/50" />
        <motion.button
          type="button"
          onClick={doShutter}
          aria-label="Capture sketch"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.04 }}
          className="size-14 rounded-full border-4 border-paper bg-paper/20 flex items-center justify-center"
        >
          <motion.span className="block size-10 rounded-full bg-paper" animate={{ scale: capturing ? 0.72 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
        </motion.button>
        <Camera className="size-4 text-paper/50" />
      </div>
    </div>
  );
}

function ScanView({ phase }: { phase: SketchPhase }) {
  return (
    <div className="relative h-full bg-cream p-3">
      <motion.div layoutId="napkin-morph" className="relative h-full overflow-hidden border border-ink/20 bg-paper" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
        <NapkinSketch enhanced={phase !== "enhance"} />
        {phase === "scan" ? (
          <>
            <motion.div className="scan-line pointer-events-none absolute right-3 left-3 h-px bg-accent" initial={{ top: "8%" }} animate={{ top: ["8%", "88%", "8%"] }} transition={{ duration: 1.45, repeat: Infinity, ease: "easeInOut" }} />
            <Box className="left-[18%] top-[12%] h-[28%] w-[64%]" delay="0.1s" />
            <Box className="left-[18%] top-[44%] h-[8%] w-[48%]" delay="0.35s" />
            <Box className="left-[18%] top-[68%] h-[10%] w-[54%]" delay="0.55s" />
          </>
        ) : (
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-3 left-3 right-3 bg-ink px-3 py-2 font-mono text-label tracking-label uppercase text-paper">
            Adaptive threshold · boosting ink
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function Box({ className, delay }: { className: string; delay: string }) {
  return <div className={cn("pointer-events-none absolute border border-accent/90", className)} style={{ animation: `ink-pop 280ms var(--ease-out-soft) ${delay} both` }} />;
}

function GenerateView() {
  return (
    <div className="flex h-full flex-col bg-code px-4 py-3 text-code-fg">
      <p className="font-mono text-label tracking-label uppercase text-accent">Dual emit</p>
      <ul className="mt-4 space-y-2 font-mono text-micro">
        {GEN_LINES.map((line) => (
          <motion.li key={line.text} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: line.delay, duration: 0.25 }} className="text-code-fg/90">
            <span className="text-accent">›</span> {line.text}
          </motion.li>
        ))}
      </ul>
      <motion.div className="mt-auto h-1 bg-white/10 overflow-hidden rounded-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.9, ease: "easeInOut" }} />
      </motion.div>
    </div>
  );
}

function PreviewView({ tab, onTab, onAdd, cartCount }: { tab: SketchTab; onTab: (t: SketchTab) => void; onAdd: () => void; cartCount: number }) {
  const tabs: Array<{ id: SketchTab; label: string }> = [
    { id: "ui", label: "Live UI" },
    { id: "models", label: "models.py" },
    { id: "api", label: "REST" },
  ];
  return (
    <div className="flex h-full flex-col">
      <LayoutGroup>
        <div className="flex border-b border-ink/10 relative">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn("relative h-9 flex-1 font-mono text-label tracking-label uppercase overflow-hidden", tab === t.id ? "text-paper" : "text-muted hover:text-ink")}
            >
              {tab === t.id && <motion.div layoutId="sketch-tab" className="absolute inset-0 bg-ink" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.24 }}
            className="h-full"
          >
            {tab === "ui" ? <LiveCard onAdd={onAdd} cartCount={cartCount} /> : tab === "models" ? <CodePane code={MODELS} /> : <CodePane code={API} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function LiveCard({ onAdd, cartCount }: { onAdd: () => void; cartCount: number }) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between pb-3">
        <span className="font-display text-sm font-black uppercase tracking-tight">Aurora</span>
        <span className="relative">
          <ShoppingBag className="size-4" />
          <AnimatePresence>
            {cartCount > 0 ? (
              <motion.span
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex size-4 items-center justify-center bg-accent font-mono text-label text-accent-fg"
              >
                {cartCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </div>
      <motion.div layoutId="napkin-morph" className="aspect-4/3 border border-ink bg-cream overflow-hidden" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
        <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
          <rect width="160" height="120" fill="#e8e8e0" />
          <circle cx="118" cy="38" r="22" fill="#ff4400" />
          <path d="M20 96 L70 52 L110 78 L160 40 V120 H20 Z" fill="#111" />
        </svg>
      </motion.div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-black uppercase leading-tight">Aurora Tee</p>
          <div className="mt-1 flex items-center gap-0.5 text-ink">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3 fill-ink" />
            ))}
          </div>
        </div>
        <p className="font-mono text-sm tabular-nums">$48</p>
      </div>
      <motion.button
        type="button"
        onClick={() => {
          try {
            navigator.vibrate?.(12);
          } catch {}
          onAdd();
        }}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-ink font-mono text-label tracking-label uppercase text-paper transition-colors hover:bg-accent"
      >
        <AnimatePresence mode="wait">
          {cartCount > 0 ? (
            <motion.span key="added" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
              <Check className="size-3.5" /> Added · {cartCount}
            </motion.span>
          ) : (
            <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Add to bag
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function CodePane({ code }: { code: string }) {
  return <pre className="h-full overflow-auto bg-code p-3 font-mono text-label leading-relaxed text-code-fg">{code}</pre>;
}

const MODELS = `class Product(models.Model):
    name = models.CharField(
        max_length=120)
    price = models.DecimalField(
        max_digits=8, decimal_places=2)
    stock = models.PositiveIntegerField(
        default=0)
    rating = models.DecimalField(
        max_digits=3, decimal_places=2)`;

const API = `@router.register("products")
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_fields = ["stock"]

# GET  /api/products
# POST /api/products`;
