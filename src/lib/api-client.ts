/**
 * ProtoPatch API Client
 *
 * Typed service layer for communicating with the Django backend.
 * All endpoints are proxied through Vite dev server at /api/*.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthResponse {
  success: boolean;
  status: string;
  version: string;
  modes: string[];
  gemini_configured: boolean;
  github_configured: boolean;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  isEntrypoint?: boolean;
}

export interface StackSelection {
  frontend: "react" | "nextjs" | "vue" | "html_tailwind";
  backend: "fastapi" | "django" | "express_ts" | "go_gin";
  database: "postgresql" | "sqlite" | "mongodb";
}

export interface Sketch2StackResponse {
  success: boolean;
  project_name?: string;
  summary?: string;
  stack?: StackSelection;
  files?: ProjectFile[];
  html_code: string;
  django_models: string;
  drf_serializers: string;
  detected_components: string[];
  sandbox_html: string;
  error?: string;
}

export interface RefineProjectResponse {
  success: boolean;
  summary: string;
  modified_files: ProjectFile[];
  all_files: ProjectFile[];
  sandbox_html: string;
  detected_components: string[];
  error?: string;
}

export interface ScreenToPatchResponse {
  success: boolean;
  bug_description: string;
  target_element: string;
  suggested_fix: string;
  css_or_logic_diff: string;
  transcript: string;
  pr_url: string;
  pr_number: number | null;
  branch_name: string;
  file_matches: FileMatch[];
  error?: string;
}

export interface FileMatch {
  file_path: string;
  start_line: number;
  end_line: number;
  snippet: string;
  score: number;
  match_type: string;
}

export type StyleOption = "auto" | "dark" | "light" | "material" | "ios" | "minimal";

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

function getApiBase(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!envUrl) return "/api";
  const cleaned = envUrl.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const API_BASE = getApiBase();

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export { ApiError };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  try {
    const response = await fetch(`${API_BASE}${normalizedUrl}`, options);
    let data: any = {};
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || `Server returned status ${response.status}` };
    }

    if (!response.ok || data.success === false) {
      throw new ApiError(
        data.error
          ? typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error)
          : `Request failed (${response.status})`,
        response.status,
        data,
      );
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err.name === "TypeError" && err.message?.toLowerCase().includes("fetch")) {
      throw new ApiError(
        "Backend server is waking up or unreachable. Please wait 10-15 seconds and try again.",
        503,
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API Functions
// ---------------------------------------------------------------------------

/** Check backend health and configuration status. */
export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health/");
}

/** Sketch2Stack: Upload a wireframe image, get multi-file generated code. */
export async function sketch2stack(
  image: File,
  options?: {
    notes?: string;
    style?: StyleOption;
    stack?: Partial<StackSelection>;
  },
): Promise<Sketch2StackResponse> {
  const form = new FormData();
  form.append("image", image);
  if (options?.notes) form.append("notes", options.notes);
  if (options?.style) form.append("style", options.style);
  if (options?.stack?.frontend) form.append("stack_frontend", options.stack.frontend);
  if (options?.stack?.backend) form.append("stack_backend", options.stack.backend);
  if (options?.stack?.database) form.append("stack_database", options.stack.database);

  return request<Sketch2StackResponse>("/sketch2stack/", {
    method: "POST",
    body: form,
  });
}

/** Conversational AI refinement ('Vibe Coding' iterative prompt). */
export async function refineProject(options: {
  prompt: string;
  currentFiles: ProjectFile[];
  currentHtml?: string;
  stack?: Partial<StackSelection>;
  history?: { role: string; text: string }[];
}): Promise<RefineProjectResponse> {
  return request<RefineProjectResponse>("/sketch2stack/refine/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      current_files: options.currentFiles,
      current_html: options.currentHtml || "",
      stack: options.stack || {},
      history: options.history || [],
    }),
  });
}

/** Download complete project as a bundled .zip archive. */
export async function downloadProjectZip(projectName: string, files: ProjectFile[]): Promise<void> {
  const response = await fetch(`${API_BASE}/sketch2stack/export-zip/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: projectName,
      files,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate project zip");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName || "protopatch-app"}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** ScreenToPatch: Upload a bug screenshot/video + optional audio, get diff and PR. */
export async function screenToPatch(options: {
  screenshot?: File;
  video?: File;
  audio?: Blob;
  repoUrl: string;
  branch?: string;
  notes?: string;
}): Promise<ScreenToPatchResponse> {
  const form = new FormData();
  if (options.screenshot) form.append("screenshot", options.screenshot);
  if (options.video) form.append("video", options.video);
  if (options.audio) form.append("audio", options.audio, "voice-memo.webm");
  form.append("repo_url", options.repoUrl);
  if (options.branch) form.append("branch", options.branch);
  if (options.notes) form.append("notes", options.notes);
  return request<ScreenToPatchResponse>("/screentopatch/", {
    method: "POST",
    body: form,
  });
}
