"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Loader2, Wand2, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface VibeChatBarProps {
  onPrompt: (prompt: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const SUGGESTION_CHIPS = [
  { id: "dark_mode", text: "🌗 Add Dark Mode Toggle" },
  { id: "checkout", text: "💳 Add Stripe Checkout Flow" },
  { id: "auth", text: "🔐 Add JWT Auth & Login Modal" },
  { id: "search", text: "🔍 Add Search & Filter Controls" },
  { id: "export", text: "📊 Add CSV Export & Analytics Chart" },
  { id: "mobile", text: "📱 Add Mobile Drawer & Touch Gestures" },
];

export function VibeChatBar({ onPrompt, loading = false, disabled = false, className }: VibeChatBarProps) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading || disabled) return;
    onPrompt(trimmed);
    setPrompt("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chipText: string) => {
    if (loading || disabled) return;
    onPrompt(chipText);
  };

  return (
    <div className={cn("space-y-2.5 rounded-none border border-ink/20 bg-paper p-3 shadow-lg", className)}>
      {/* Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        <div className="flex items-center gap-1 text-muted uppercase tracking-wider font-semibold text-[10px] shrink-0 mr-1">
          <Wand2 className="size-3 text-accent" /> Quick Ideas:
        </div>
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleChipClick(chip.text)}
            disabled={loading || disabled}
            className="shrink-0 px-2.5 py-1 bg-cream/70 border border-ink/15 text-ink hover:border-accent hover:bg-accent/10 hover:text-accent transition-all text-xs font-mono disabled:opacity-50"
          >
            {chip.text}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              loading
                ? "AI is updating your full-stack codebase..."
                : "Vibe Code prompt: 'Add pagination to the table', 'Make hero cards interactive'..."
            }
            disabled={loading || disabled}
            className="w-full border border-ink/20 bg-paper px-4 py-2.5 pr-10 font-mono text-xs text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-accent/60 pointer-events-none" />
        </div>

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading || disabled}
          whileTap={{ scale: 0.96 }}
          className={cn(
            "flex items-center justify-center gap-2 px-5 py-2.5 bg-ink text-paper font-mono text-xs font-bold uppercase tracking-wider transition-all",
            prompt.trim() && !loading && !disabled
              ? "bg-accent hover:bg-accent/90 text-white shadow"
              : "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Refining...</span>
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              <span>Refine Code</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
