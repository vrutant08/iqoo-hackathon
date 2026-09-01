"use client";

import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Battery,
  Wifi,
  Sun,
  Flame,
  Camera,
  Flashlight,
  Activity,
  Layers,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

interface IqooHomeScreenProps {
  onLaunchApp: (mode?: "sketch" | "patch") => void;
}

export function IqooHomeScreen({ onLaunchApp }: IqooHomeScreenProps) {
  const [time, setTime] = useState("12:00");
  const [dateStr, setDateStr] = useState("Wednesday, Aug 27");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white select-none font-sans">
      {/* Authentic iQOO Wallpaper Graphic */}
      <img
        src="/iqoo-front.png"
        alt="iQOO Wallpaper"
        className="absolute inset-0 h-full w-full object-cover pointer-events-none scale-[1.02]"
      />

      {/* Atmospheric Glass Vignette & Depth Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

      {/* ========================================================= */}
      {/* TOP STATUS BAR & CAMERA                                   */}
      {/* ========================================================= */}
      <div className="relative z-30 flex items-center justify-between px-5 pt-3 text-[11px] font-mono text-white/90">
        <span className="font-semibold tracking-tight">{time}</span>

        {/* Center Punch Hole Camera with optical depth */}
        <div className="size-3.5 rounded-full bg-black border border-white/20 shadow-inner flex items-center justify-center">
          <div className="size-1 rounded-full bg-blue-900/90 shadow-sm" />
        </div>

        <div className="flex items-center gap-1.5 opacity-90">
          <Wifi className="size-3" />
          <span className="text-[9px] font-bold tracking-tighter">5G</span>
          <div className="flex items-center gap-0.5">
            <span className="text-[8px] font-mono text-white/75">98%</span>
            <Battery className="size-3.5" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DYNAMIC ISLAND / LIVE ACTIVITY PILL                      */}
      {/* ========================================================= */}
      <div className="relative z-30 mt-1 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-1">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-orange-500" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-orange-400 font-bold">
              ProtoPatch
            </span>
          </div>
          <span className="h-2.5 w-px bg-white/20" />
          <div className="flex items-center gap-1 text-[9px] font-mono text-white/80">
            <Activity className="size-2.5 text-orange-400 animate-pulse" />
            <span>Dual Engine Ready</span>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* MAIN LOCK SCREEN CONTENT                                  */}
      {/* ========================================================= */}
      <div className="relative z-20 flex h-[calc(100%-4.5rem)] flex-col justify-between p-5 pb-6">
        {/* Clock, Date & OriginOS Weather Pill */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center pt-3"
        >
          <h1 className="font-display text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            {time}
          </h1>
          <p className="font-medium text-[12px] text-white/90 mt-0.5 drop-shadow">
            {dateStr}
          </p>

          {/* Performance Mode & Weather Badges */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-mono text-white/90">
              <Sun className="size-2.5 text-amber-400" />
              28°C Sunny
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-[9px] font-mono text-orange-300 font-semibold">
              <Flame className="size-2.5 text-orange-400" />
              Monster Mode
            </span>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* REFINED PROTOPATCH INTERACTIVE WIDGET                     */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-2.5"
        >
          {/* Main Glassmorphic Studio Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onLaunchApp()}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-2xl border border-white/20 p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] hover:border-orange-500/50 transition-all cursor-pointer"
          >
            {/* Ambient Inner Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/5 to-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* 3D App Icon Badge */}
                <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.4)] border border-white/30">
                  <Zap className="size-5 text-white fill-current drop-shadow" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5 items-center justify-center rounded-full bg-slate-950 border border-white/40">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  </span>
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-black tracking-tight text-white group-hover:text-amber-300 transition-colors uppercase">
                      ProtoPatch Studio
                    </span>
                  </div>
                  <span className="block font-mono text-[10px] text-white/70 tracking-wide">
                    Tap to Launch Dual-Engine
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-orange-500 border border-white/20 group-hover:border-orange-400 group-hover:text-white transition-all shadow-md">
                <ArrowRight className="size-4 text-white transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Quick Engine Switcher Chips */}
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunchApp("sketch");
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-black/40 hover:bg-orange-600/30 border border-white/10 hover:border-orange-500/40 text-[9px] font-mono text-white/90 transition-colors"
                title="Launch Sketch2Stack Genesis Engine"
              >
                <Zap className="size-2.5 text-orange-400" />
                <span>Sketch2Stack</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunchApp("patch");
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-black/40 hover:bg-orange-600/30 border border-white/10 hover:border-orange-500/40 text-[9px] font-mono text-white/90 transition-colors"
                title="Launch ScreenToPatch Healing Engine"
              >
                <Layers className="size-2.5 text-amber-400" />
                <span>ScreenToPatch</span>
              </button>
            </div>
          </motion.div>

          {/* Quick Lock Screen Footer Controls */}
          <div className="flex items-center justify-between px-1 text-white/70 pt-1">
            {/* Flashlight button */}
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 hover:bg-white/20 transition-colors shadow"
              title="Flashlight"
            >
              <Flashlight className="size-4 text-white/80" />
            </button>

            {/* Swipe up unlock hint */}
            <div className="flex flex-col items-center gap-0.5 opacity-60">
              <ChevronUp className="size-3.5 animate-bounce" />
              <span className="font-mono text-[8px] uppercase tracking-widest">
                Swipe up to open
              </span>
            </div>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => onLaunchApp("sketch")}
              className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 hover:bg-white/20 transition-colors shadow"
              title="Quick Camera Wireframe Capture"
            >
              <Camera className="size-4 text-white/80" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM GESTURE INDICATOR BAR                              */}
      {/* ========================================================= */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-white/60 shadow-sm" />
    </div>
  );
}
