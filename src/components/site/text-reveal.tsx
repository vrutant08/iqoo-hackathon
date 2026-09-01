"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Text reveal that animates words sliding up from below a clip mask
 * as the element scrolls into view. Professional staggered effect.
 */
export function TextReveal({
  children,
  className,
  delay = 0,
  staggerChildren = 0.04,
  once = true,
}: {
  children: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });

  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={
              inView
                ? { y: "0%", opacity: 1 }
                : { y: "110%", opacity: 0 }
            }
            transition={{
              duration: 0.55,
              delay: delay + i * staggerChildren,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

/**
 * Entire block that fades + slides up when scrolled into view.
 * Great for paragraphs, cards, sections.
 */
export function RevealBlock({
  children,
  className,
  delay = 0,
  once = true,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px" });

  const initial = {
    opacity: 0,
    y: direction === "up" ? 30 : 0,
    x: direction === "left" ? -30 : direction === "right" ? 30 : 0,
    filter: "blur(4px)",
  };

  const visible = {
    opacity: 1,
    y: 0,
    x: 0,
    filter: "blur(0px)",
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? visible : initial}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Character-by-character reveal for short high-impact headings.
 */
export function CharReveal({
  children,
  className,
  delay = 0,
  staggerChildren = 0.02,
  once = true,
}: {
  children: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });

  return (
    <span ref={ref} className={className}>
      {children.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={
            inView
              ? { opacity: 1, y: 0, rotateX: 0 }
              : { opacity: 0, y: 20, rotateX: -90 }
          }
          transition={{
            duration: 0.4,
            delay: delay + i * staggerChildren,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}
