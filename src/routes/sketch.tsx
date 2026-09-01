"use client";

import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  Camera,
  Sparkles,
  Eye,
  Code,
  Server,
  Download,
  ChevronDown,
  FolderTree,
  Monitor,
  Smartphone,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  sketch2stack,
  refineProject,
  downloadProjectZip,
  type Sketch2StackResponse,
  type StyleOption,
  type StackSelection,
} from "@/lib/api-client";
import { AppHeader } from "@/components/app/app-header";
import { FileDropzone } from "@/components/app/file-dropzone";
import { CodeBlock } from "@/components/app/code-block";
import { PipelineProgress } from "@/components/app/pipeline-progress";
import { StackSelector } from "@/components/app/stack-selector";
import { FileTreeExplorer } from "@/components/app/file-tree-explorer";
import { VibeChatBar } from "@/components/app/vibe-chat-bar";

export const Route = createFileRoute("/sketch")({ component: SketchPage });

const STEPS = [
  { id: "upload", label: "Upload sketch" },
  { id: "enhance", label: "Ink enhance" },
  { id: "vision", label: "Vision parse" },
  { id: "generate", label: "Scaffold Full-Stack" },
  { id: "preview", label: "Live workspace" },
];

const STYLES: { value: StyleOption; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "material", label: "Material" },
  { value: "ios", label: "iOS" },
  { value: "minimal", label: "Minimal" },
];

type ResultTab = "preview" | "files" | "models" | "api";

function SketchPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleOption>("auto");
  const [stack, setStack] = useState<StackSelection>({
    frontend: "react",
    backend: "django",
    database: "postgresql",
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<Sketch2StackResponse | null>(null);
  const [refineSummary, setRefineSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultTab>("preview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [cameraMode, setCameraMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode(true);
    } catch {
      cameraInputRef.current?.click();
    }
  }, []);

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "sketch-capture.jpg", { type: "image/jpeg" });
          setImageFile(file);
          setCameraMode(false);
          streamRef.current?.getTracks().forEach((t) => t.stop());
        }
      },
      "image/jpeg",
      0.92,
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRefineSummary(null);
    setChatHistory([]);

    try {
      setCurrentStep("upload");
      await delay(300);
      setCurrentStep("enhance");
      await delay(400);
      setCurrentStep("vision");

      const response = await sketch2stack(imageFile, {
        notes: notes || undefined,
        style,
        stack,
      });

      setCurrentStep("generate");
      await delay(500);
      setCurrentStep("preview");
      await delay(200);

      setResult(response);
      setTab(response.files && response.files.length > 0 ? "files" : "preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  }, [imageFile, notes, style, stack]);

  const handleRefine = useCallback(
    async (refinePrompt: string) => {
      if (!result?.files || refining) return;
      setRefining(true);
      setError(null);

      try {
        const historyPayload = [
          ...chatHistory,
          { role: "user", text: refinePrompt },
        ];

        const currentHtml = result.html_code || result.sandbox_html || "";
        const response = await refineProject({
          prompt: refinePrompt,
          currentFiles: result.files,
          currentHtml,
          stack,
          history: historyPayload,
        });

        // Update result state with new files & sandbox HTML
        const newSandboxHtml = response.sandbox_html || result.sandbox_html;
        setResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            files: response.all_files && response.all_files.length > 0 ? response.all_files : prev.files,
            sandbox_html: newSandboxHtml,
            html_code: response.sandbox_html || prev.html_code,
            detected_components: response.detected_components?.length
              ? response.detected_components
              : prev.detected_components,
          };
        });

        // Trigger iframe update if loaded
        if (iframeRef.current && newSandboxHtml) {
          iframeRef.current.srcdoc = newSandboxHtml;
        }

        setRefineSummary(response.summary || `Applied: "${refinePrompt}"`);
        setChatHistory([
          ...historyPayload,
          { role: "assistant", text: response.summary || "Refined full-stack files." },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refinement failed. Please try again.");
      } finally {
        setRefining(false);
      }
    },
    [result, refining, stack, chatHistory],
  );

  const handleDownloadZip = useCallback(async () => {
    if (!result?.files || result.files.length === 0) return;
    try {
      await downloadProjectZip(result.project_name || "protopatch-app", result.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }, [result]);

  const tabs: { id: ResultTab; label: string; icon: typeof Eye; count?: number }[] = [
    { id: "files", label: "Multi-File Studio", icon: FolderTree, count: result?.files?.length },
    { id: "preview", label: "Live UI", icon: Eye },
    { id: "models", label: "models.py", icon: Code },
    { id: "api", label: "serializers.py", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader title="Sketch2Stack" subtitle="Vibe-Code Full-Stack Architectures in Seconds" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          {/* Left panel — Input & Architecture Setup */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="font-mono text-label tracking-label uppercase text-muted">
                01 · Upload & Configure
              </p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                Design your stack<span className="text-accent">.</span>
              </h2>
              <p className="mt-2 text-sm text-muted max-w-md">
                Upload a napkin sketch or wireframe, pick your language and framework stack, and let AI generate a complete multi-file repository with live preview.
              </p>
            </div>

            {/* Camera/Upload toggle */}
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={() => setCameraMode(false)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-10 font-mono text-label tracking-label uppercase border transition-colors",
                  !cameraMode ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-ink/20 hover:border-ink",
                )}
              >
                <Download className="size-3.5 rotate-180" /> Upload
              </motion.button>
              <motion.button
                type="button"
                onClick={startCamera}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-10 font-mono text-label tracking-label uppercase border transition-colors",
                  cameraMode ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-ink/20 hover:border-ink",
                )}
              >
                <Camera className="size-3.5" /> Camera
              </motion.button>
            </div>

            {/* Camera view */}
            <AnimatePresence>
              {cameraMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border border-ink"
                >
                  <div className="relative bg-ink">
                    <video ref={videoRef} className="w-full aspect-4/3 object-cover" playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-6 border border-paper/30 pointer-events-none" />
                    <div className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 border border-paper/50 pointer-events-none" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <motion.button
                        type="button"
                        onClick={captureFromCamera}
                        whileTap={{ scale: 0.88 }}
                        className="size-14 rounded-full border-4 border-paper bg-paper/20 flex items-center justify-center"
                      >
                        <span className="block size-10 rounded-full bg-paper" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Native device camera input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImageFile(f);
                  setCameraMode(false);
                }
              }}
            />

            {/* File dropzone */}
            {!cameraMode && (
              <FileDropzone
                accept="image/jpeg,image/png,image/webp,image/*"
                label="Drop wireframe or architecture sketch"
                hint="JPEG, PNG, or WebP · Max 10MB"
                value={imageFile}
                onFile={setImageFile}
                disabled={loading || refining}
              />
            )}

            {/* Stack Selection Matrix */}
            <StackSelector value={stack} onChange={setStack} disabled={loading || refining} />

            {/* Style selector */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                UI Visual Theme
              </label>
              <div className="relative">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as StyleOption)}
                  className="w-full appearance-none border border-ink/20 bg-paper px-3 py-2.5 pr-8 font-mono text-micro uppercase tracking-label text-ink focus:border-ink focus:outline-none"
                  disabled={loading || refining}
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-subtle pointer-events-none" />
              </div>
            </div>

            {/* Developer Notes */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                Developer Notes / Context (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. 'E-commerce storefront with product list, checkout drawer, and admin dashboard'"
                className="w-full resize-none border border-ink/20 bg-paper px-3 py-2.5 font-mono text-micro text-ink placeholder:text-subtle/60 focus:border-ink focus:outline-none min-h-[4.5rem]"
                disabled={loading || refining}
                maxLength={2000}
              />
            </div>

            {/* Generate Full Stack button */}
            <motion.button
              type="button"
              onClick={handleGenerate}
              disabled={!imageFile || loading || refining}
              whileHover={imageFile && !loading && !refining ? { y: -1 } : undefined}
              whileTap={imageFile && !loading && !refining ? { scale: 0.97 } : undefined}
              className={cn(
                "flex w-full items-center justify-center gap-2 h-12 font-mono text-label tracking-label uppercase transition-all duration-200",
                imageFile && !loading && !refining
                  ? "bg-ink text-paper hover:bg-accent hover:text-accent-fg hover:shadow-[0_6px_20px_rgb(255_68_0/0.25)]"
                  : "bg-ink/20 text-ink/40 cursor-not-allowed",
              )}
            >
              {loading ? (
                <>
                  <Sparkles className="size-4 animate-spin" /> Scaffolding Project…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate Multi-File Stack
                </>
              )}
            </motion.button>

            {/* Pipeline progress */}
            <AnimatePresence>
              {loading && currentStep && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <PipelineProgress steps={STEPS} currentStep={currentStep} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-danger/30 bg-danger/5 p-4"
              >
                <p className="font-mono text-label tracking-label uppercase text-danger">Error</p>
                <p className="mt-1 text-sm text-danger/80">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right panel — Multi-File Studio & Live Workspace */}
          <div className="lg:col-span-7 space-y-4">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  className="space-y-4"
                >
                  {/* Summary & Refine notification */}
                  {refineSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 border border-ok/30 bg-ok/10 px-3.5 py-2 font-mono text-xs text-ok-fg"
                    >
                      <CheckCircle2 className="size-4 text-ok shrink-0" />
                      <span className="truncate">{refineSummary}</span>
                    </motion.div>
                  )}

                  {/* Project info & detected components */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
                        {result.project_name || "ProtoPatch App"}
                      </span>
                      <span className="text-muted/40">/</span>
                      {result.detected_components.map((comp) => (
                        <span
                          key={comp}
                          className="inline-flex items-center border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10px] uppercase text-muted"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>

                    {result.files && result.files.length > 0 && (
                      <motion.button
                        type="button"
                        onClick={handleDownloadZip}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-semibold text-accent hover:underline"
                      >
                        <Download className="size-3.5" /> Export .ZIP
                      </motion.button>
                    )}
                  </div>

                  {/* Tab bar */}
                  <LayoutGroup>
                    <div className="flex border border-ink overflow-hidden">
                      {tabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTab(t.id)}
                          className={cn(
                            "relative flex-1 flex items-center justify-center gap-1.5 h-10 font-mono text-label tracking-label uppercase overflow-hidden transition-colors text-xs",
                            tab === t.id ? "text-paper" : "text-muted hover:text-ink",
                          )}
                        >
                          {tab === t.id && (
                            <motion.div
                              layoutId="sketch-result-tab"
                              className="absolute inset-0 bg-ink"
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            />
                          )}
                          <t.icon className="relative size-3.5" />
                          <span className="relative">{t.label}</span>
                          {t.count !== undefined && (
                            <span className={cn("relative ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold", tab === t.id ? "bg-accent text-white" : "bg-ink/10 text-ink")}>
                              {t.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </LayoutGroup>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Tab 1: Multi-File Explorer */}
                      {tab === "files" && result.files && (
                        <FileTreeExplorer
                          files={result.files}
                          projectName={result.project_name || "protopatch-app"}
                          onDownloadZip={handleDownloadZip}
                        />
                      )}

                      {/* Tab 2: Live UI Sandbox */}
                      {tab === "preview" && (
                        <div className="border border-ink overflow-hidden bg-paper">
                          {/* Live preview toolbar */}
                          <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2 bg-cream">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-label tracking-label uppercase text-muted">
                                Live UI Sandbox
                              </span>
                              <span className="flex items-center gap-1.5 font-mono text-[10px] text-subtle">
                                <span className="size-1.5 rounded-full bg-ok" /> Interactive
                              </span>
                            </div>

                            {/* Viewport switchers */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewport("desktop")}
                                className={cn(
                                  "p-1 border transition-colors",
                                  viewport === "desktop" ? "border-ink bg-ink text-paper" : "border-ink/15 text-muted hover:border-ink/40"
                                )}
                                title="Desktop Viewport"
                              >
                                <Monitor className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewport("mobile")}
                                className={cn(
                                  "p-1 border transition-colors",
                                  viewport === "mobile" ? "border-ink bg-ink text-paper" : "border-ink/15 text-muted hover:border-ink/40"
                                )}
                                title="Mobile Viewport"
                              >
                                <Smartphone className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (iframeRef.current) {
                                    iframeRef.current.srcdoc = result.sandbox_html;
                                  }
                                }}
                                className="p-1 border border-ink/15 text-muted hover:border-ink/40 transition-colors ml-1"
                                title="Reload sandbox"
                              >
                                <RotateCcw className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className={cn("p-4 flex justify-center bg-slate-950/10 transition-all", viewport === "mobile" && "px-8")}>
                            <iframe
                              ref={iframeRef}
                              srcDoc={result.sandbox_html}
                              className={cn(
                                "bg-white shadow-xl transition-all duration-300 border border-ink/15",
                                viewport === "desktop" ? "w-full min-h-[30rem]" : "w-[375px] min-h-[600px] rounded-2xl shadow-2xl border-4 border-slate-800"
                              )}
                              sandbox="allow-scripts"
                              title="Generated UI Preview"
                            />
                          </div>
                        </div>
                      )}

                      {/* Tab 3: models.py */}
                      {tab === "models" && (
                        <CodeBlock
                          code={result.django_models}
                          language="Python"
                          filename="models.py"
                          downloadFilename="models.py"
                        />
                      )}

                      {/* Tab 4: serializers.py */}
                      {tab === "api" && (
                        <CodeBlock
                          code={result.drf_serializers}
                          language="Python"
                          filename="serializers.py"
                          downloadFilename="serializers.py"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Vibe-Coding Recursive Prompt Dock */}
                  {result.files && (
                    <div className="pt-2">
                      <VibeChatBar
                        onPrompt={handleRefine}
                        loading={refining}
                        disabled={loading}
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[32rem] border-2 border-dashed border-ink/10"
                >
                  <div className="paper-grid absolute inset-0 opacity-20 pointer-events-none" />
                  <div className="relative flex flex-col items-center gap-4 p-8 text-center">
                    <motion.div
                      animate={{
                        borderRadius: [
                          "50%",
                          "44% 56% 58% 42% / 52% 44% 56% 48%",
                          "56% 44% 42% 58% / 46% 58% 42% 54%",
                          "50%",
                        ],
                      }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="size-20 bg-ink/5 flex items-center justify-center"
                    >
                      <Sparkles className="size-8 text-subtle" />
                    </motion.div>
                    <p className="font-display text-xl font-black uppercase tracking-tight">
                      Full-Stack Vibe-Coding Studio
                    </p>
                    <p className="text-sm text-muted max-w-sm">
                      Upload any napkin sketch or wireframe diagram. Choose React, Next.js, Vue, FastAPI, Django, or Express to generate a complete multi-file project with live preview and conversational AI refinement.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
