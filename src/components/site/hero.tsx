"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./button";
import { useDemo } from "./demo-context";
import { TextReveal, RevealBlock } from "./text-reveal";

const PILLS = ["Sketch2Stack", "ScreenToPatch", "iQOO Hackathon"];

export function Hero() {
  const { setMode, play } = useDemo();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const blobX = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const blobScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section id="overview" ref={ref} className="relative overflow-hidden scroll-mt-16">
      <motion.div style={{ y: gridY }} className="pointer-events-none absolute inset-0 paper-grid opacity-70" />
      {/* morphing blobs - LAYERED inspiration but protopatch palette */}
      <motion.div style={{ x: blobX, scale: blobScale }} className="pointer-events-none absolute -right-16 top-[38%] hidden size-[380px] bg-accent/8 blur-[1px] morph-blob lg:block" />
      <motion.div style={{ x: useTransform(scrollYProgress, [0, 1], [0, -18]) }} className="pointer-events-none absolute -left-12 bottom-8 hidden size-[220px] bg-ink/[0.04] morph-blob lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }} className="flex flex-wrap gap-2">
          {PILLS.map((pill, i) => (
            <motion.span
              key={pill}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.32 }}
              className="inline-flex h-7 items-center rounded-pill border border-ink/15 bg-paper px-3 font-mono text-label tracking-label uppercase text-muted"
            >
              {pill}
            </motion.span>
          ))}
        </motion.div>

        <div className="relative mt-8 sm:mt-9">
          {/* Word-by-word text reveal animation on the hero heading */}
          <h1 className="max-w-full font-display text-display font-black uppercase leading-display tracking-display text-ink">
            <span className="block">
              <TextReveal delay={0.1} staggerChildren={0.06}>From Napkin</TextReveal>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>
                <TextReveal delay={0.25} staggerChildren={0.06}>To Patch</TextReveal>
                <span className="text-accent">.</span>
              </span>
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  borderRadius: [
                    "50%",
                    "44% 56% 58% 42% / 52% 44% 56% 48%",
                    "56% 44% 42% 58% / 46% 58% 42% 54%",
                    "50%",
                  ],
                }}
                transition={{
                  scale: { type: "spring", stiffness: 260, damping: 18, delay: 0.42 },
                  borderRadius: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 },
                }}
                className="size-10 shrink-0 bg-ink sm:size-14 lg:size-[4.2rem]"
              />
            </span>
          </h1>
          {/* subtle dot system like LABS. in reference */}
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.58 }} aria-hidden className="absolute right-[18%] top-[56%] hidden size-3 rounded-full bg-accent lg:block" />
        </div>

        <RevealBlock delay={0.4} className="mt-10 grid gap-6 border-t border-ink/10 pt-8 sm:mt-12 sm:gap-8 sm:pt-10 lg:grid-cols-12 lg:items-end">
          <p className="max-w-xl text-sub leading-body text-muted lg:col-span-7">
            Official portal for the multimodal developer engine that turns hand-drawn wireframes into live full-stack apps, and five-second bug recordings into autonomous GitHub pull requests.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/sketch">
                <Button
                  size="lg"
                  icon={<ArrowRight className="size-4" />}
                >
                  Launch Sketch2Stack
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/patch">
                <Button
                  size="lg"
                  variant="outline"
                >
                  Launch ScreenToPatch <span aria-hidden className="ml-1">↗</span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}
