"use client";

import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bug,
  GitPullRequest,
  ExternalLink,
  Target,
  Wrench,
  FileCode,
  Mic,
  Sparkles,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { screenToPatch, type ScreenToPatchResponse } from "@/lib/api-client";
import { AppHeader } from "@/components/app/app-header";
import { FileDropzone } from "@/components/app/file-dropzone";
import { AudioRecorder } from "@/components/app/audio-recorder";
import { DiffViewer } from "@/components/app/diff-viewer";
import { PipelineProgress } from "@/components/app/pipeline-progress";

export const Route = createFileRoute("/patch")({ component: PatchPage });

const STEPS = [
  { id: "upload", label: "Ingest media" },
  { id: "transcribe", label: "Whisper STT" },
  { id: "vision", label: "Bug analysis" },
  { id: "ast", label: "AST locate" },
  { id: "diff", label: "Write diff" },
  { id: "pr", label: "Open PR" },
];

function PatchPage() {
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [repoUrl, setRepoUrl] = useState("https://github.com/vrutant08/iqoo-hackathon");
  const [branch, setBranch] = useState("main");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<ScreenToPatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHeal = useCallback(async () => {
    if (!screenshotFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setCurrentStep("upload");
      await delay(400);
      setCurrentStep("transcribe");
      await delay(500);
      setCurrentStep("vision");

      const response = await screenToPatch({
        screenshot: screenshotFile,
        audio: audioBlob || undefined,
        repoUrl,
        branch: branch || undefined,
        notes: notes || undefined,
      });

      setCurrentStep("ast");
      await delay(400);
      setCurrentStep("diff");
      await delay(400);
      setCurrentStep("pr");
      await delay(300);

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  }, [screenshotFile, audioBlob, repoUrl, branch, notes]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader title="ScreenToPatch" subtitle="Bug → Merged PR in 30s" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          {/* Left panel — Input */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="font-mono text-label tracking-label uppercase text-muted">
                01 · Report a bug
              </p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                Heal the glitch<span className="text-accent">.</span>
              </h2>
              <p className="mt-2 text-sm text-muted max-w-md">
                Upload a screenshot of the visual bug, record an optional voice memo describing it,
                and point to the GitHub repo. The AI will analyze, locate, and create a Pull Request.
              </p>
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                Bug screenshot *
              </label>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                label="Drop bug screenshot here"
                hint="Screenshot of the UI bug · JPEG/PNG/WebP"
                onFile={setScreenshotFile}
                disabled={loading}
              />
            </div>

            {/* Voice memo */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                <Mic className="size-3 inline mr-1" />
                Voice memo
              </label>
              <AudioRecorder onRecorded={setAudioBlob} />
            </div>

            {/* Repo URL */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                GitHub repo URL *
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full border border-ink/20 bg-paper px-3 py-2.5 font-mono text-micro text-ink placeholder:text-subtle/60 focus:border-ink focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                Base branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full border border-ink/20 bg-paper px-3 py-2.5 font-mono text-micro text-ink placeholder:text-subtle/60 focus:border-ink focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-mono text-label tracking-label uppercase text-muted mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. 'The checkout button clips on mobile viewport'"
                className="w-full resize-none border border-ink/20 bg-paper px-3 py-2.5 font-mono text-micro text-ink placeholder:text-subtle/60 focus:border-ink focus:outline-none min-h-[4rem]"
                disabled={loading}
                maxLength={2000}
              />
            </div>

            {/* Heal button */}
            <motion.button
              type="button"
              onClick={handleHeal}
              disabled={!screenshotFile || !repoUrl || loading}
              whileHover={screenshotFile && !loading ? { y: -1 } : undefined}
              whileTap={screenshotFile && !loading ? { scale: 0.97 } : undefined}
              className={cn(
                "flex w-full items-center justify-center gap-2 h-12 font-mono text-label tracking-label uppercase transition-all duration-200",
                screenshotFile && repoUrl && !loading
                  ? "bg-ink text-paper hover:bg-accent hover:text-accent-fg hover:shadow-[0_6px_20px_rgb(255_68_0/0.25)]"
                  : "bg-ink/20 text-ink/40 cursor-not-allowed",
              )}
            >
              {loading ? (
                <>
                  <Sparkles className="size-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Bug className="size-4" /> Heal & Create PR
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

          {/* Right panel — Results */}
          <div className="lg:col-span-7 lg:sticky lg:top-[88px]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  className="space-y-4"
                >
                  {/* PR Link — Top banner */}
                  {result.pr_url && (
                    <motion.a
                      href={result.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center justify-between gap-3 bg-ink text-paper p-4 group hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GitPullRequest className="size-5 text-ok" />
                        <div>
                          <p className="font-mono text-label tracking-label uppercase">
                            {result.pr_number ? `Pull Request #${result.pr_number}` : "View on GitHub"}
                          </p>
                          <p className="font-mono text-[10px] text-paper/60 mt-0.5">
                            {result.branch_name}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="size-4 text-paper/50 group-hover:text-paper transition-colors" />
                    </motion.a>
                  )}

                  {/* Bug Description */}
                  <ResultCard
                    icon={Bug}
                    label="Bug Detected"
                    accentClass="text-danger"
                  >
                    <p className="text-sm text-ink/80">{result.bug_description}</p>
                  </ResultCard>

                  {/* Target Element */}
                  {result.target_element && (
                    <ResultCard icon={Target} label="Target Element" accentClass="text-accent">
                      <code className="inline-block bg-code px-2 py-1 font-mono text-micro text-code-fg">
                        {result.target_element}
                      </code>
                    </ResultCard>
                  )}

                  {/* Suggested Fix */}
                  {result.suggested_fix && (
                    <ResultCard icon={Wrench} label="Suggested Fix" accentClass="text-ok">
                      <p className="text-sm text-ink/80">{result.suggested_fix}</p>
                    </ResultCard>
                  )}

                  {/* Voice Transcript */}
                  {result.transcript && (
                    <ResultCard icon={Mic} label="Voice Transcript" accentClass="text-subtle">
                      <blockquote className="border-l-2 border-accent/30 pl-3 text-sm text-muted italic">
                        "{result.transcript}"
                      </blockquote>
                    </ResultCard>
                  )}

                  {/* Unified Diff */}
                  <DiffViewer diff={result.css_or_logic_diff} />

                  {/* Matched Files */}
                  {result.file_matches.length > 0 && (
                    <ResultCard icon={FileCode} label="Matched Files" accentClass="text-muted">
                      <ul className="space-y-2">
                        {result.file_matches.map((match, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-2 border-b border-ink/5 pb-2 last:border-b-0 last:pb-0"
                          >
                            <div>
                              <code className="font-mono text-micro text-ink">
                                {match.file_path}
                              </code>
                              <span className="ml-2 font-mono text-[10px] text-subtle">
                                Line {match.start_line}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "font-mono text-[10px] tracking-label uppercase shrink-0",
                                match.score > 80 ? "text-ok" : match.score > 50 ? "text-accent" : "text-subtle",
                              )}
                            >
                              {Math.round(match.score)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </ResultCard>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[28rem] border-2 border-dashed border-ink/10 relative"
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
                      className="size-20 bg-danger/5 flex items-center justify-center"
                    >
                      <Bug className="size-8 text-subtle" />
                    </motion.div>
                    <p className="font-display text-xl font-black uppercase tracking-tight">
                      Report a bug
                    </p>
                    <p className="text-sm text-muted max-w-xs">
                      Upload a screenshot, record a voice note, and let the AI create a GitHub PR
                      with the fix.
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

function ResultCard({
  icon: Icon,
  label,
  accentClass,
  children,
}: {
  icon: typeof Bug;
  label: string;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink/10 bg-paper p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("size-4", accentClass)} />
        <span className="font-mono text-label tracking-label uppercase text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
