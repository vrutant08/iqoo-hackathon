"use client";

import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  className?: string;
}

const BAR_COUNT = 24;

export function AudioRecorder({ onRecorded, className }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Visualize live audio input using Web Audio API AnalyserNode
  const startVisualizer = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      // Map frequency bins to our bar count
      const binSize = Math.floor(dataArray.length / BAR_COUNT);
      const newBars: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        // Average a few bins per bar
        let sum = 0;
        for (let j = 0; j < binSize; j++) {
          sum += dataArray[i * binSize + j] ?? 0;
        }
        const avg = sum / binSize;
        // Scale 0-255 → 4-100 (min height 4%)
        const height = Math.max(4, (avg / 255) * 100);
        newBars.push(height);
      }
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    // Animate bars back down
    setBars(new Array(BAR_COUNT).fill(4));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecorded(blob);
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
        stopVisualizer();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setRecording(true);
      setDuration(0);

      // Start real-time audio visualization
      startVisualizer(stream);

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }, [onRecorded, startVisualizer, stopVisualizer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    setHasRecording(false);
    setDuration(0);
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopVisualizer();
    };
  }, [stopVisualizer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className={cn("border border-ink/20 bg-paper overflow-hidden", className)}>
      <div className="flex items-center gap-3 p-4">
        <AnimatePresence mode="wait">
          {recording ? (
            <motion.button
              key="stop"
              type="button"
              onClick={stopRecording}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.9 }}
              className="flex size-11 shrink-0 items-center justify-center bg-danger text-white"
              aria-label="Stop recording"
            >
              <Square className="size-4 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              key="start"
              type="button"
              onClick={startRecording}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center transition-colors",
                hasRecording ? "bg-ok text-white" : "bg-ink text-paper hover:bg-accent",
              )}
              aria-label="Start recording"
            >
              <Mic className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="font-mono text-label tracking-label uppercase text-muted">
              {recording
                ? "Recording…"
                : hasRecording
                  ? "Voice memo recorded"
                  : "Optional voice memo"}
            </p>
            <div className="flex items-center gap-2">
              {recording && (
                <motion.span
                  className="size-2 rounded-full bg-danger"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  aria-hidden
                />
              )}
              <span className="font-mono text-micro tabular-nums text-subtle">
                {formatTime(duration)}
              </span>
              {hasRecording && !recording && (
                <motion.button
                  type="button"
                  onClick={clearRecording}
                  whileTap={{ scale: 0.9 }}
                  className="flex size-6 items-center justify-center text-subtle hover:text-danger transition-colors"
                  aria-label="Clear recording"
                >
                  <Trash2 className="size-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live audio waveform — responsive to voice input */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 64, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border-t border-ink/10 bg-code px-4 overflow-hidden"
          >
            <div className="flex items-end justify-center gap-[2px] h-full py-2">
              {bars.map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  animate={{
                    height: `${height}%`,
                    backgroundColor:
                      height > 60
                        ? "var(--color-accent)"
                        : height > 30
                          ? "var(--color-ok)"
                          : "rgba(255,255,255,0.25)",
                  }}
                  transition={{
                    height: { duration: 0.06, ease: "linear" },
                    backgroundColor: { duration: 0.15 },
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static waveform indicator for completed recording */}
      {hasRecording && !recording && (
        <div className="border-t border-ink/10 bg-cream/50 px-4 py-2">
          <div className="flex items-end justify-center gap-[2px] h-8">
            {Array.from({ length: BAR_COUNT }).map((_, i) => {
              // Generate a deterministic "waveform" shape from recording duration
              const h = 15 + Math.sin(i * 0.7 + duration) * 12 + Math.cos(i * 1.3) * 8;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-ok/40"
                  style={{ height: `${Math.max(10, Math.min(90, h))}%` }}
                />
              );
            })}
          </div>
          <p className="text-center font-mono text-[10px] tracking-label uppercase text-subtle mt-1">
            ✓ {formatTime(duration)} recorded
          </p>
        </div>
      )}
    </div>
  );
}
