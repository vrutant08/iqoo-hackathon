"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  downloadFilename?: string;
  className?: string;
}

export function CodeBlock({ code, language, filename, downloadFilename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename || filename || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("overflow-hidden border border-ink/10 bg-code text-code-fg", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="font-mono text-label tracking-label uppercase text-accent">
              {filename}
            </span>
          )}
          {language && (
            <span className="font-mono text-[10px] tracking-label uppercase text-white/30">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={copyToClipboard}
            whileTap={{ scale: 0.9 }}
            className="flex size-7 items-center justify-center text-white/40 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
          </motion.button>
          {downloadFilename && (
            <motion.button
              type="button"
              onClick={download}
              whileTap={{ scale: 0.9 }}
              className="flex size-7 items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Download file"
            >
              <Download className="size-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Code content */}
      <pre className="overflow-auto p-4 font-mono text-micro leading-relaxed text-code-fg/90 max-h-[24rem]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
