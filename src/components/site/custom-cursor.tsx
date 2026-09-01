"use client";

import { motion, useMotionValue, useSpring, useVelocity, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Sleek, Precision HUD Cursor
 * Minimalist, compact, non-intrusive.
 */
export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hoverText, setHoverText] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for trailing HUD frame
  const smoothX = useSpring(mouseX, { stiffness: 350, damping: 26, mass: 0.1 });
  const smoothY = useSpring(mouseY, { stiffness: 350, damping: 26, mass: 0.1 });

  // Velocity for dynamic micro-tilt
  const velX = useVelocity(mouseX);
  const rotateReticle = useTransform(velX, [-800, 800], [-8, 8]);

  useEffect(() => {
    const hasPointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasPointer) return;

    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select, label, [data-cursor-hover]";

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest(interactiveSelector) as HTMLElement | null;
      if (el) {
        setHovering(true);
        const customText = el.getAttribute("data-cursor-text");
        if (customText) {
          setHoverText(customText);
        }
      }
    };

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(interactiveSelector)) {
        setHovering(false);
        setHoverText(null);
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [mouseX, mouseY, visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden mix-blend-difference">
      {/* Outer Spring HUD Frame (Small & Compact) */}
      <motion.div
        className="fixed top-0 left-0"
        style={{
          x: smoothX,
          y: smoothY,
          rotate: hovering ? 0 : rotateReticle,
        }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2 relative flex items-center justify-center">
          <motion.div
            animate={{
              width: hovering ? 24 : clicking ? 12 : 16,
              height: hovering ? 24 : clicking ? 12 : 16,
              borderRadius: hovering ? 4 : 2,
              opacity: hovering ? 0.9 : 0.6,
              borderColor: hovering ? "#ffffff" : "rgba(255,255,255,0.4)",
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative border border-solid flex items-center justify-center"
          >
            {/* Corner Markers */}
            <span className="absolute -top-0.5 -left-0.5 size-1 border-t border-l border-white" />
            <span className="absolute -top-0.5 -right-0.5 size-1 border-t border-r border-white" />
            <span className="absolute -bottom-0.5 -left-0.5 size-1 border-b border-l border-white" />
            <span className="absolute -bottom-0.5 -right-0.5 size-1 border-b border-r border-white" />

            {/* Custom hover text badge if specified */}
            <AnimatePresence>
              {hoverText && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="absolute -top-5 font-mono text-[8px] font-bold tracking-wider uppercase text-white bg-black/80 px-1 py-0.2 rounded"
                >
                  {hoverText}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Center Target Dot */}
      <motion.div
        className="fixed top-0 left-0"
        style={{ x: mouseX, y: mouseY }}
      >
        <motion.div
          animate={{
            scale: clicking ? 1.4 : hovering ? 0.8 : 1,
            opacity: 1,
          }}
          transition={{ duration: 0.1 }}
          className="size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_4px_#ffffff]"
        />
      </motion.div>
    </div>
  );
}
