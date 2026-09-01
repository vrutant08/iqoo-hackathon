"use client";

import { motion, AnimatePresence } from "motion/react";
import { Upload, Check, Image } from "lucide-react";
import { useCallback, useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept: string;
  label: string;
  hint?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  preview?: boolean;
  value?: File | null;
}

export function FileDropzone({ accept, label, hint, onFile, disabled, preview = true, value }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(value ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setFile(value);
      if (value && preview && value.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(value));
      } else if (!value) {
        setPreviewUrl(null);
      }
    }
  }, [value, preview]);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      if (preview && f.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(f));
      }
      onFile(f);
    },
    [onFile, preview],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-200",
        dragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-ink/20 bg-paper hover:border-ink/40 hover:bg-cream/50",
        disabled && "pointer-events-none opacity-50",
        file ? "min-h-[10rem]" : "min-h-[12rem]",
      )}
      whileHover={!disabled ? { y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 p-4"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-32 w-auto rounded-sm border border-ink/10 object-contain shadow-sm"
              />
            ) : (
              <div className="flex size-16 items-center justify-center bg-ink/5">
                <Image className="size-6 text-muted" />
              </div>
            )}
            <div className="flex items-center gap-2 font-mono text-label tracking-label uppercase">
              <Check className="size-3 text-ok" />
              <span className="text-ink max-w-[200px] truncate">{file.name}</span>
              <span className="text-subtle">({(file.size / 1024).toFixed(0)}KB)</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreviewUrl(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="font-mono text-[10px] tracking-label uppercase text-accent hover:underline"
            >
              Replace file
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 p-6"
          >
            <motion.div
              animate={dragging ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
              className="flex size-12 items-center justify-center border border-ink/10 bg-cream"
            >
              <Upload className="size-5 text-muted" />
            </motion.div>
            <p className="text-center font-mono text-label tracking-label uppercase text-muted">
              {label}
            </p>
            {hint && (
              <p className="text-center font-mono text-[10px] tracking-wide text-subtle">
                {hint}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paper grid background */}
      <div className="pointer-events-none absolute inset-0 paper-grid opacity-30" />
    </motion.div>
  );
}
