"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type EngineMode = "sketch" | "patch";
export type SketchPhase =
  | "idle"
  | "capture"
  | "enhance"
  | "scan"
  | "generate"
  | "preview";
export type PatchPhase =
  | "idle"
  | "bug"
  | "record"
  | "transcribe"
  | "ast"
  | "diff"
  | "pr";
export type SketchTab = "ui" | "models" | "api";

const SKETCH_SEQUENCE: Array<{ phase: SketchPhase; ms: number }> = [
  { phase: "capture", ms: 480 },
  { phase: "enhance", ms: 1100 },
  { phase: "scan", ms: 1700 },
  { phase: "generate", ms: 1900 },
  { phase: "preview", ms: 0 },
];

const PATCH_SEQUENCE: Array<{ phase: PatchPhase; ms: number }> = [
  { phase: "bug", ms: 700 },
  { phase: "record", ms: 2400 },
  { phase: "transcribe", ms: 1000 },
  { phase: "ast", ms: 1700 },
  { phase: "diff", ms: 1500 },
  { phase: "pr", ms: 0 },
];

type DemoContextValue = {
  mode: EngineMode;
  sketchPhase: SketchPhase;
  patchPhase: PatchPhase;
  sketchTab: SketchTab;
  running: boolean;
  cartCount: number;
  setMode: (mode: EngineMode) => void;
  setSketchTab: (tab: SketchTab) => void;
  play: (mode?: EngineMode) => void;
  reset: () => void;
  addToBag: () => void;
  jumpTo: (phase: SketchPhase | PatchPhase) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<EngineMode>("sketch");
  const [sketchPhase, setSketchPhase] = useState<SketchPhase>("idle");
  const [patchPhase, setPatchPhase] = useState<PatchPhase>("idle");
  const [sketchTab, setSketchTab] = useState<SketchTab>("ui");
  const [running, setRunning] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const timers = useRef<number[]>([]);
  const modeRef = useRef<EngineMode>(mode);
  modeRef.current = mode;

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setRunning(false);
    setSketchPhase("idle");
    setPatchPhase("idle");
    setSketchTab("ui");
    setCartCount(0);
  }, [clearTimers]);

  const setMode = useCallback(
    (next: EngineMode) => {
      clearTimers();
      setRunning(false);
      modeRef.current = next;
      setModeState(next);
      setSketchPhase("idle");
      setPatchPhase("idle");
      setSketchTab("ui");
    },
    [clearTimers],
  );

  const play = useCallback(
    (next?: EngineMode) => {
      const m = next === "sketch" || next === "patch" ? next : modeRef.current;
      if (m !== modeRef.current) {
        modeRef.current = m;
        setModeState(m);
      }
      clearTimers();
      setRunning(true);
      setCartCount(0);
      setSketchTab("ui");

      if (m === "sketch") {
        setSketchPhase("idle");
        let elapsed = 40;
        for (const step of SKETCH_SEQUENCE) {
          const id = window.setTimeout(() => {
            setSketchPhase(step.phase);
            if (step.phase === "preview") setRunning(false);
          }, elapsed);
          timers.current.push(id);
          elapsed += step.ms;
        }
      } else {
        setPatchPhase("idle");
        let elapsed = 40;
        for (const step of PATCH_SEQUENCE) {
          const id = window.setTimeout(() => {
            setPatchPhase(step.phase);
            if (step.phase === "pr") setRunning(false);
          }, elapsed);
          timers.current.push(id);
          elapsed += step.ms;
        }
      }
    },
    [clearTimers],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  const jumpTo = useCallback(
    (phase: SketchPhase | PatchPhase) => {
      clearTimers();
      setRunning(false);
      const isSketch = (
        [
          "idle",
          "capture",
          "enhance",
          "scan",
          "generate",
          "preview",
        ] as const
      ).includes(phase as SketchPhase);
      if (isSketch) {
        modeRef.current = "sketch";
        setModeState("sketch");
        setSketchPhase(phase as SketchPhase);
        setPatchPhase("idle");
        if (phase === "preview") setCartCount(1);
      } else {
        modeRef.current = "patch";
        setModeState("patch");
        setPatchPhase(phase as PatchPhase);
        setSketchPhase("idle");
      }
    },
    [clearTimers],
  );

  const addToBag = useCallback(() => {
    setCartCount((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      sketchPhase,
      patchPhase,
      sketchTab,
      running,
      cartCount,
      setMode,
      setSketchTab,
      play,
      reset,
      addToBag,
      jumpTo,
    }),
    [
      mode,
      sketchPhase,
      patchPhase,
      sketchTab,
      running,
      cartCount,
      setMode,
      play,
      reset,
      addToBag,
      jumpTo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
