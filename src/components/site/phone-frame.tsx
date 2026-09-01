"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import { RotateCw, Smartphone, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isAppOpen?: boolean;
  onExitApp?: () => void;
}

export function PhoneFrame({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  isAppOpen = false,
  onExitApp,
}: PhoneFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasPlayedEntrance, setHasPlayedEntrance] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Spring for swipe gestures
  const dragX = useMotionValue(0);
  const springX = useSpring(dragX, { stiffness: 400, damping: 32 });

  // Trigger smooth 3D turnaround showcase on initial view
  useEffect(() => {
    if (hasPlayedEntrance) return;
    const timer = setTimeout(() => {
      // Turn around to show iQOO back, then flip to front
      setIsFlipped(true);
      setTimeout(() => {
        setIsFlipped(false);
        setHasPlayedEntrance(true);
      }, 1400);
    }, 600);
    return () => clearTimeout(timer);
  }, [hasPlayedEntrance]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Subtle clamped tilt
    setTilt({
      x: Math.max(-2.5, Math.min(2.5, py * -4)),
      y: Math.max(-2.5, Math.min(2.5, px * 5)),
    });
  }

  function onLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      {/* 3D Phone Perspective Container */}
      <div className="relative touch-pan-y" style={{ perspective: "1800px" }}>
        <motion.div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          drag={!isFlipped ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          style={{
            x: springX,
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateX: tilt.x,
            rotateY: (isFlipped ? 180 : 0) + tilt.y,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 24,
          }}
          className="relative mx-auto h-phone w-phone cursor-grab active:cursor-grabbing rounded-phone shadow-phone"
        >
          {/* ========================================================= */}
          {/* FRONT FACE (iQOO Screen / Wallpaper / Launched App)       */}
          {/* ========================================================= */}
          <div
            className="absolute inset-0 overflow-hidden rounded-phone bg-slate-950 border border-slate-700/80 shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
            }}
          >
            {/* Inner Bezels & Display */}
            <div className="relative h-full w-full overflow-hidden rounded-[1.85rem] bg-black">
              {children}

              {/* Exit to iQOO Home Indicator / Tap bar when app is running */}
              {isAppOpen && onExitApp && (
                <motion.button
                  type="button"
                  onClick={onExitApp}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-white/20 text-[9px] font-mono text-white uppercase tracking-wider shadow-lg hover:bg-orange-600 transition-colors"
                  title="Return to iQOO Home Screen"
                >
                  <span className="size-1.5 rounded-full bg-orange-500" />
                  iQOO Home
                </motion.button>
              )}
            </div>

            {/* Specular Light Flare Overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-phone opacity-[0.06]"
              style={{
                background: `radial-gradient(420px 280px at 50% 25%, white, transparent 65%)`,
              }}
            />
          </div>

          {/* ========================================================= */}
          {/* BACK FACE (Authentic iQOO Chassis with Camera & Logo)     */}
          {/* ========================================================= */}
          <div
            className="absolute inset-0 overflow-hidden rounded-phone shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Authentic iQOO Back image */}
            <img
              src="/iqoo-back.png"
              alt="iQOO Back Edition"
              className="h-full w-full object-cover pointer-events-none select-none"
            />

            {/* Glossy highlight layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/25 pointer-events-none rounded-phone" />

            {/* Click to Flip Front badge */}
            <button
              type="button"
              onClick={toggleFlip}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/30 text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xl hover:bg-orange-600 transition-colors"
            >
              <RotateCw className="size-3" /> Flip to Screen
            </button>
          </div>
        </motion.div>
      </div>

      {/* 3D Flip & Showcase Controls */}
      <div className="mt-4 flex items-center gap-3">
        <motion.button
          type="button"
          onClick={toggleFlip}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-ink/20 bg-paper hover:bg-ink hover:text-paper font-mono text-[10px] uppercase tracking-wider text-muted transition-all shadow-sm"
        >
          <RotateCw className="size-3 text-accent" />
          <span>{isFlipped ? "View Front Display" : "Turn Around · iQOO Back"}</span>
        </motion.button>
      </div>
    </div>
  );
}
