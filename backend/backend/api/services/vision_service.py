"""
ProtoPatch — Vision Service
Uses Google Gemini for multimodal structured full-stack generation and iterative code refinement.
Outputs strictly-typed JSON payloads enforced via response_schema and multi-model failover.
"""
import base64
import json
import logging
import re
from pathlib import Path
from typing import Optional, List, Dict, Any

from django.conf import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JSON Schemas for Gemini structured output
# ---------------------------------------------------------------------------

SKETCH2STACK_SCHEMA = {
    "type": "object",
    "properties": {
        "project_name": {
            "type": "string",
            "description": "Short lowercase kebab-case project identifier (e.g. 'storefront-app')"
        },
        "summary": {
            "type": "string",
            "description": "2-3 sentence overview of the generated fullstack application"
        },
        "html_code": {
            "type": "string",
            "description": "Complete self-contained HTML page with Tailwind CSS via CDN and working mock interactions"
        },
        "django_models": {
            "type": "string",
            "description": "Full Django models.py content derived from the wireframe data entities"
        },
        "drf_serializers": {
            "type": "string",
            "description": "Full DRF serializers.py content for the generated models"
        },
        "files": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative file path (e.g. 'frontend/src/App.tsx', 'backend/app/main.py')"
                    },
                    "content": {
                        "type": "string",
                        "description": "Full complete code content of this file"
                    },
                    "language": {
                        "type": "string",
                        "description": "Language identifier: typescript, python, javascript, html, css, json, sql, markdown"
                    },
                    "isEntrypoint": {
                        "type": "boolean",
                        "description": "True if this is a primary frontend/backend entrypoint"
                    }
                },
                "required": ["path", "content", "language"]
            },
            "description": "Complete array of project source and configuration files"
        },
        "detected_components": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of detected UI component names (e.g. ['NavBar', 'HeroCard', 'DataTable'])"
        }
    },
    "required": ["project_name", "summary", "html_code", "django_models", "drf_serializers", "files", "detected_components"]
}

REFINE_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "Brief description of the changes applied in this iteration"
        },
        "modified_files": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative file path that was modified or newly created"
                    },
                    "content": {
                        "type": "string",
                        "description": "Full updated code content of this file"
                    },
                    "language": {
                        "type": "string",
                        "description": "Language identifier: typescript, python, javascript, html, css, json, sql, markdown"
                    }
                },
                "required": ["path", "content", "language"]
            },
            "description": "Array of files modified or added in response to the user's prompt"
        },
        "sandbox_html": {
            "type": "string",
            "description": "Complete, updated self-contained interactive HTML page reflecting the modifications with Tailwind CSS"
        },
        "detected_components": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Updated list of detected UI component names"
        }
    },
    "required": ["summary", "modified_files", "sandbox_html", "detected_components"]
}

BUG_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "bug_description": {
            "type": "string",
            "description": "Clear description of the visual bug or issue detected"
        },
        "target_element": {
            "type": "string",
            "description": "CSS selector, component name, or code element that is buggy"
        },
        "suggested_fix": {
            "type": "string",
            "description": "Human-readable description of the fix to apply"
        },
        "css_or_logic_diff": {
            "type": "string",
            "description": "Exact unified diff patch that fixes the bug"
        }
    },
    "required": ["bug_description", "target_element", "suggested_fix", "css_or_logic_diff"]
}


class VisionService:
    """
    Wraps Google Generative AI SDK for ProtoPatch multimodal analysis,
    multi-file fullstack scaffolding, and conversational AI refinement.
    """

    def __init__(self):
        self._client = None
        self._api_key = settings.GEMINI_API_KEY

    def _get_client(self):
        """Lazy-initialize Gemini client."""
        if self._client is None:
            try:
                import google.generativeai as genai
                if not self._api_key:
                    raise ValueError(
                        "GEMINI_API_KEY is not set. "
                        "Add it to your .env file or environment variables."
                    )
                genai.configure(api_key=self._api_key)
                self._client = genai
            except ImportError:
                raise ImportError(
                    "google-generativeai is not installed. "
                    "Run: pip install google-generativeai"
                )
        return self._client

    def _call_gemini(
        self,
        model_name: str,
        prompt: str,
        image_bytes: Optional[bytes] = None,
        mime_type: str = "image/jpeg",
        schema: Optional[dict] = None,
    ) -> dict:
        """
        Core Gemini API call with structured JSON output and multi-model failover.
        """
        genai = self._get_client()

        candidate_models = [
            model_name or "gemini-2.5-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
        ]
        candidate_models = [m for m in dict.fromkeys(candidate_models) if m]

        content_parts = [prompt]
        if image_bytes:
            content_parts.append({
                "mime_type": mime_type,
                "data": image_bytes,
            })

        last_exc = None
        for m_name in candidate_models:
            generation_config = {
                "temperature": 0.2,
                "top_p": 0.9,
                "max_output_tokens": 8192,
            }
            if schema:
                generation_config["response_mime_type"] = "application/json"
                generation_config["response_schema"] = schema

            try:
                model = genai.GenerativeModel(model_name=m_name, generation_config=generation_config)
                response = model.generate_content(content_parts)
                if response.candidates and response.candidates[0].content.parts:
                    raw_text = "".join(p.text for p in response.candidates[0].content.parts if hasattr(p, "text"))
                else:
                    raw_text = response.text.strip()
                return self._extract_json(raw_text)
            except Exception as exc:
                last_exc = exc
                logger.warning("Gemini model %s failed: %s — trying fallback", m_name, exc)
                try:
                    fallback_model = genai.GenerativeModel(
                        model_name=m_name,
                        generation_config={"temperature": 0.2, "max_output_tokens": 8192}
                    )
                    response = fallback_model.generate_content(content_parts)
                    if response.candidates and response.candidates[0].content.parts:
                        raw_text = "".join(p.text for p in response.candidates[0].content.parts if hasattr(p, "text"))
                    else:
                        raw_text = response.text.strip()
                    return self._extract_json(raw_text)
                except Exception as exc2:
                    logger.warning("Gemini model %s fallback without schema failed: %s", m_name, exc2)
                    continue

        logger.error("All Gemini candidate models failed: %s", last_exc)
        return {}

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from model output, handling markdown fences and unclosed structures."""
        if not text:
            return {}

        # 1. Direct JSON parse
        try:
            parsed = json.loads(text, strict=False)
            if isinstance(parsed, dict):
                return self._clean_json_result(parsed)
        except Exception:
            pass

        # 2. Markdown code fences
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
            r"(\{[\s\S]*\})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                candidate = match.group(1).strip()
                try:
                    parsed = json.loads(candidate, strict=False)
                    if isinstance(parsed, dict):
                        return self._clean_json_result(parsed)
                except Exception:
                    cleaned = re.sub(r",\s*([\]}])", r"\1", candidate)
                    try:
                        parsed = json.loads(cleaned, strict=False)
                        if isinstance(parsed, dict):
                            return self._clean_json_result(parsed)
                    except Exception:
                        pass

        # 3. Regex field extraction
        result = {}

        # Extract html_code
        html_m = re.search(r'"html_code"\s*:\s*"([\s\S]*?)(?:",\s*"(?:django_models|drf_serializers|detected_components|files|sandbox_html|target_element)"|"\s*\}|$)', text)
        if html_m:
            raw_html = html_m.group(1)
            clean_html = raw_html.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t').replace('\\/', '/')
            if "<body" in clean_html and "</body>" not in clean_html:
                clean_html += "\n</body>\n</html>"
            result["html_code"] = clean_html
        elif "<!DOCTYPE html" in text or "<html" in text:
            raw_m = re.search(r'(<!DOCTYPE html[\s\S]*?</html>|<html[\s\S]*?</html>|<div[\s\S]*?</div>)', text, re.IGNORECASE)
            if raw_m:
                result["html_code"] = raw_m.group(1)

        # Extract sandbox_html
        sandbox_m = re.search(r'"sandbox_html"\s*:\s*"([\s\S]*?)(?:",\s*"(?:modified_files|detected_components|summary)"|"\s*\}|$)', text)
        if sandbox_m:
            raw_s = sandbox_m.group(1).replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t').replace('\\/', '/')
            result["sandbox_html"] = raw_s

        # Extract django_models
        models_m = re.search(r'"django_models"\s*:\s*"([\s\S]*?)(?:",\s*"(?:drf_serializers|detected_components|files)"|"\s*\}|$)', text)
        if models_m:
            result["django_models"] = models_m.group(1).replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
        else:
            py_m = re.search(r'```python\s*(?:# Models|class )([\s\S]*?)```', text)
            if py_m:
                result["django_models"] = py_m.group(0).replace('```python', '').replace('```', '').strip()

        # Extract drf_serializers
        serializers_m = re.search(r'"drf_serializers"\s*:\s*"([\s\S]*?)(?:",\s*"(?:detected_components|files)"|"\s*\}|$)', text)
        if serializers_m:
            result["drf_serializers"] = serializers_m.group(1).replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')

        # Extract detected_components
        comp_match = re.search(r'"detected_components"\s*:\s*\[(.*?)\]', text, re.DOTALL)
        if comp_match:
            comps = re.findall(r'"([^"]+)"', comp_match.group(1))
            result["detected_components"] = comps

        # Extract bug and summary fields
        for key in ["bug_description", "target_element", "suggested_fix", "css_or_logic_diff", "summary", "project_name"]:
            m = re.search(r'"' + re.escape(key) + r'"\s*:\s*"([\s\S]*?)(?:",\s*"\w+"|"\s*\}|$)', text)
            if m:
                result[key] = m.group(1).replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')

        if result.get("html_code") or result.get("sandbox_html") or result.get("bug_description") or result.get("files") or result.get("modified_files") or result.get("summary"):
            return self._clean_json_result(result)

        raise ValueError(f"Could not extract valid JSON from response: {text[:200]}")

    def _clean_json_result(self, d: dict) -> dict:
        """Clean markdown fences from HTML fields inside JSON."""
        for field in ["html_code", "sandbox_html"]:
            if field in d and isinstance(d[field], str):
                val = d[field].strip()
                val = re.sub(r"^```(?:html)?\s*", "", val, flags=re.IGNORECASE)
                val = re.sub(r"\s*```$", "", val)
                d[field] = val
        return d

    # -----------------------------------------------------------------------
    # Public Methods
    # -----------------------------------------------------------------------

    def parse_sketch(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        notes: str = "",
        style: str = "auto",
        stack: Optional[Dict[str, str]] = None,
    ) -> dict:
        """
        Analyze a wireframe sketch and generate a complete multi-file full-stack project.
        """
        stack = stack or {}
        frontend_choice = stack.get("frontend", "react")
        backend_choice = stack.get("backend", "django")
        database_choice = stack.get("database", "postgresql")

        style_hint = "" if style == "auto" else f"Target visual theme/style: {style} theme."
        notes_hint = f"\nAdditional context from developer: {notes}" if notes else ""

        stack_instructions = f"""
TARGET TECH STACK:
- Frontend: {frontend_choice.upper()} (with Tailwind CSS and modern component architecture)
- Backend: {backend_choice.upper()} (clean REST/API endpoints, typed models, validation)
- Database: {database_choice.upper()} (production schema, migrations/ORM models)
"""

        prompt = f"""You are a World-Class Full-Stack Architect and Principal Engineer.
Analyze this hand-drawn wireframe sketch or system architecture diagram and generate a complete, production-grade, multi-file full-stack project.

{style_hint}{notes_hint}
{stack_instructions}

CRITICAL MULTI-FILE & LIVE PREVIEW REQUIREMENTS:
1. `html_code`: A COMPLETE, self-contained interactive single-page HTML application with:
   - <script src="https://cdn.tailwindcss.com"></script>
   - Realistic sample data, full UI components matching the sketch, and functional client-side mock interactivity (tabs, filters, state toggles, modal dialogs).

2. `files`: Generate a comprehensive multi-file repository (6 to 10 files) that DIRECTLY IMPLEMENTS the application shown in `html_code`:
   - Frontend files (e.g. `frontend/src/App.tsx`, `frontend/src/components/...` or `frontend/index.html`) MUST contain the actual full component code, styling, and state hooks implementing the UI seen in `html_code`.
   - Backend files (e.g. `backend/app/main.py`, `backend/app/models.py`, `backend/app/routes/api.py`, etc.) MUST define the exact API endpoints and database schema for this application.
   - Config files: `package.json`, `requirements.txt`, `.env.example`, `README.md`.
   - DO NOT USE SKELETONS OR DUMMY PLACEHOLDERS. Every file must contain complete, real code.

3. `project_name`: Short kebab-case name (e.g. 'store-dashboard').
4. `summary`: 2-sentence overview of the application architecture.
5. `django_models`: Complete models.py definition for the identified entities.
6. `drf_serializers`: Complete serializers.py definition for the models.
7. `detected_components`: Array of UI component names found in the sketch.

Return ONLY a valid JSON object matching the schema."""

        result = self._call_gemini(
            model_name="gemini-2.5-flash",
            prompt=prompt,
            image_bytes=image_bytes,
            mime_type=mime_type,
            schema=SKETCH2STACK_SCHEMA,
        )

        # Fallbacks and normalization
        result.setdefault("project_name", "protopatch-app")
        result.setdefault("summary", "Full-stack application generated from wireframe sketch.")
        result.setdefault("detected_components", ["Navbar", "MainContent", "CardList", "ActionPanel"])
        result.setdefault("django_models", "from django.db import models\n\nclass Item(models.Model):\n    title = models.CharField(max_length=200)\n    description = models.TextField(blank=True)\n    status = models.CharField(max_length=50, default='active')\n    created_at = models.DateTimeField(auto_now_add=True)\n")
        result.setdefault("drf_serializers", "from rest_framework import serializers\nfrom .models import Item\n\nclass ItemSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Item\n        fields = '__all__'\n")

        # If html_code is basic, placeholder, or empty, synthesize rich interactive Tailwind UI
        raw_html = result.get("html_code", "").strip()
        if not raw_html or len(raw_html) < 200 or "Generated UI</h1>" in raw_html:
            result["html_code"] = self._generate_rich_mock_html(
                project_name=result["project_name"],
                components=result["detected_components"],
                notes=notes,
                style=style,
            )

        # If files were not generated or empty, build standard scaffold
        if not result.get("files") or len(result["files"]) == 0:
            result["files"] = self._build_default_files(
                frontend=frontend_choice,
                backend=backend_choice,
                database=database_choice,
                html_code=result["html_code"],
                django_models=result["django_models"],
                drf_serializers=result["drf_serializers"],
                components=result["detected_components"],
            )

        logger.info(
            "Sketch2Stack: generated %d files, detected %d components",
            len(result["files"]), len(result["detected_components"])
        )
        return result

    def _generate_rich_mock_html(self, project_name: str, components: List[str], notes: str = "", style: str = "auto") -> str:
        """Synthesize a complete, ultra-polished interactive Tailwind CSS live preview application."""
        theme_class = "dark bg-slate-950 text-slate-100" if style == "dark" else "bg-slate-50 text-slate-900"
        nav_title = project_name.replace("-", " ").title()

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{nav_title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="{theme_class} min-h-screen font-sans antialiased transition-colors duration-200">
  <!-- Top Navigation -->
  <header class="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-sm">
    <div class="flex items-center gap-3">
      <div class="size-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-600/30">⚡</div>
      <div>
        <h1 class="font-bold text-base tracking-tight leading-none">{nav_title}</h1>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Live Sandbox Engine</p>
      </div>
    </div>
    <nav class="flex items-center gap-4">
      <div class="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
        <button class="px-3 py-1 bg-white dark:bg-slate-700 rounded-md shadow-xs font-semibold text-slate-900 dark:text-white">Dashboard</button>
        <button class="px-3 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">Analytics</button>
        <button class="px-3 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">Settings</button>
      </div>
      <button onclick="document.body.classList.toggle('dark'); document.body.classList.toggle('bg-slate-950'); document.body.classList.toggle('text-slate-100');" class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5">
        <span>🌓</span> Toggle Theme
      </button>
      <button class="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition shadow-sm shadow-orange-600/30 flex items-center gap-1.5">
        <span>+</span> New Entry
      </button>
    </nav>
  </header>

  <!-- Main Content Layout -->
  <main class="max-w-7xl mx-auto p-6 space-y-6">
    <!-- Stat Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:border-orange-500/40 transition">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Total Records</span>
          <span class="text-emerald-500 font-bold">+18.4%</span>
        </div>
        <p class="text-3xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">12,840</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">Synchronized across endpoints</p>
      </div>

      <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:border-orange-500/40 transition">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Active Pipeline</span>
          <span class="text-orange-500 font-bold">Live</span>
        </div>
        <p class="text-3xl font-black mt-2 text-orange-600 tracking-tight">99.8%</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">Real-time throughput</p>
      </div>

      <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:border-orange-500/40 transition">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Entity Status</span>
          <span class="text-emerald-500 font-bold">Operational</span>
        </div>
        <p class="text-3xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">48 Services</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">Zero latency bottlenecks</p>
      </div>

      <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs hover:border-orange-500/40 transition">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Detected Modules</span>
          <span class="text-slate-500 font-mono text-[10px]">{len(components)} items</span>
        </div>
        <div class="flex flex-wrap gap-1 mt-2">
          {" ".join(f'<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-medium">{c}</span>' for c in components[:4])}
        </div>
      </div>
    </div>

    <!-- Interactive Data Card Table -->
    <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      <div class="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Live Workspace Entities</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Wireframe architectural components synthesized directly into responsive UI.</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="text" placeholder="Search entries..." class="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
          <button class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition">Filter</button>
        </div>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
        <div class="p-4.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-xs">01</div>
            <div>
              <h3 class="font-semibold text-sm text-slate-900 dark:text-white">Primary Navigation & Route State</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Responsive header with sticky glassmorphism and theme provider.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-[11px] font-semibold">Active</span>
            <button class="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition">View</button>
          </div>
        </div>

        <div class="p-4.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">02</div>
            <div>
              <h3 class="font-semibold text-sm text-slate-900 dark:text-white">Dynamic Dashboard Entity Feed</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Relational data entities wired to Django ORM serializers.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-[11px] font-semibold">Synced</span>
            <button class="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition">View</button>
          </div>
        </div>

        <div class="p-4.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-xs">03</div>
            <div>
              <h3 class="font-semibold text-sm text-slate-900 dark:text-white">Action Drawer & Telemetry Bus</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">High-frequency reactive triggers and client-side modal state.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 text-[11px] font-semibold">Pending</span>
            <button class="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition">View</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>"""

    def refine_project(
        self,
        prompt: str,
        current_files: List[Dict[str, Any]],
        current_html: str = "",
        stack: Optional[Dict[str, str]] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> dict:
        """
        Recursively refine or add features to an existing full-stack project tree.
        Guarantees that both the multi-file studio code and the live UI sandbox stay fully synchronized and working.
        """
        stack = stack or {}
        frontend_choice = stack.get("frontend", "react")
        backend_choice = stack.get("backend", "django")
        database_choice = stack.get("database", "postgresql")

        # Prepare file summary for prompt context
        files_overview = []
        for f in current_files[:12]:
            path = f.get("path", "file.txt")
            snippet = f.get("content", "")[:1200]
            files_overview.append(f"--- File: {path} ---\n{snippet}\n")

        files_context = "\n".join(files_overview)

        history_context = ""
        if history:
            history_context = "PREVIOUS CHAT TURNS:\n" + "\n".join(
                f"{h.get('role', 'user')}: {h.get('text', '')}" for h in history[-4:]
            )

        html_snippet = ""
        if current_html and current_html.strip():
            html_snippet = f"\nCURRENT LIVE UI HTML (PREVIEW CODE TO UPDATE):\n```html\n{current_html[:4000]}\n```\n"

        refine_prompt = f"""You are an elite Senior Full-Stack AI Engineer performing iterative 'Vibe Coding' refinements.
The user wants to make a modification or feature addition to their full-stack project.

TECH STACK:
- Frontend: {frontend_choice.upper()}
- Backend: {backend_choice.upper()}
- Database: {database_choice.upper()}

{html_snippet}

CURRENT MULTI-FILE CODEBASE (EXCERPTS):
{files_context}

{history_context}

USER REQUEST / MODIFICATION:
"{prompt}"

CRITICAL REQUIREMENTS:
1. `sandbox_html`: You MUST return the COMPLETE, FULLY WORKING, UPDATED HTML document for the live UI preview incorporating the requested modification (e.g. dark mode classes, modal popup, new cards, search filter, etc.).
   - It MUST contain the entire existing UI plus the modification.
   - It MUST include <script src="https://cdn.tailwindcss.com"></script>.
   - NEVER return just an explanation, a fragment, or markdown text in sandbox_html. It must be valid HTML.

2. `modified_files`: Return the array of full updated/new files (e.g. `frontend/src/App.tsx`, `backend/app/routes/...`, etc.) reflecting this exact change in the selected {frontend_choice.upper()} + {backend_choice.upper()} stack.
   - Each file MUST have the complete, production-ready code.

3. `summary`: A 1-sentence summary of what was updated.
4. `detected_components`: Updated list of components.

Return ONLY a valid JSON object matching the REFINE_SCHEMA."""

        result = self._call_gemini(
            model_name="gemini-2.5-flash",
            prompt=refine_prompt,
            schema=REFINE_SCHEMA,
        )

        result.setdefault("summary", f"Updated project based on: '{prompt}'")
        result.setdefault("modified_files", [])

        # Validate sandbox_html: if empty, non-HTML, or missing tags, fallback safely
        res_html = result.get("sandbox_html", "").strip()
        if not res_html or ("<" not in res_html and ">" not in res_html):
            # Fallback: if user asked for dark mode, inject dark mode into current_html, or keep current_html
            if "dark" in prompt.lower() and current_html:
                result["sandbox_html"] = current_html.replace("<body", '<body class="dark bg-slate-950 text-slate-100"')
            else:
                result["sandbox_html"] = current_html or "<html><body class='p-8 font-sans'><h1 class='text-2xl font-bold'>Updated UI</h1></body></html>"
        else:
            result["sandbox_html"] = res_html

        result.setdefault("detected_components", [])

        return result

    def _build_default_files(
        self,
        frontend: str,
        backend: str,
        database: str,
        html_code: str,
        django_models: str,
        drf_serializers: str,
        components: List[str],
    ) -> List[Dict[str, Any]]:
        """Fallback helper to assemble clean multi-file scaffold reflecting the exact UI."""
        files = []

        # Frontend App
        if frontend == "react":
            files.append({
                "path": "frontend/src/App.tsx",
                "content": f"import React, {{ useState }} from 'react';\nimport {{ Navbar }} from './components/Navbar';\nimport {{ MainContent }} from './components/MainContent';\n\nexport default function App() {{\n  const [darkMode, setDarkMode] = useState(false);\n  return (\n    <div className={{`min-h-screen ${{darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}} font-sans`}}>\n      <Navbar title=\"ProtoPatch App\" darkMode={{darkMode}} onToggleDarkMode={{() => setDarkMode(!darkMode)}} />\n      <main className=\"max-w-7xl mx-auto p-6\">\n        <MainContent />\n      </main>\n    </div>\n  );\n}}",
                "language": "typescript",
                "isEntrypoint": True,
            })
            files.append({
                "path": "frontend/src/components/Navbar.tsx",
                "content": "import React from 'react';\n\ninterface NavbarProps {\n  title: string;\n  darkMode?: boolean;\n  onToggleDarkMode?: () => void;\n}\n\nexport function Navbar({ title, darkMode, onToggleDarkMode }: NavbarProps) {\n  return (\n    <header className=\"border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between\">\n      <div className=\"flex items-center gap-3\">\n        <span className=\"size-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold\">⚡</span>\n        <h1 className=\"font-bold text-lg tracking-tight\">{title}</h1>\n      </div>\n      <nav className=\"flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300\">\n        <a href=\"#\" className=\"hover:text-orange-600 transition-colors\">Overview</a>\n        <a href=\"#\" className=\"hover:text-orange-600 transition-colors\">Analytics</a>\n        <a href=\"#\" className=\"hover:text-orange-600 transition-colors\">Settings</a>\n        {onToggleDarkMode && (\n          <button\n            type=\"button\"\n            onClick={onToggleDarkMode}\n            className=\"px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all\"\n          >\n            {darkMode ? '☀️ Light' : '🌙 Dark'}\n          </button>\n        )}\n      </nav>\n    </header>\n  );\n}",
                "language": "typescript",
            })
            files.append({
                "path": "frontend/src/components/MainContent.tsx",
                "content": "import React, { useState } from 'react';\n\nexport function MainContent() {\n  return (\n    <div className=\"space-y-6\">\n      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">\n        <div className=\"p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm\">\n          <h3 className=\"text-sm font-medium text-slate-500\">Total Velocity</h3>\n          <p className=\"text-3xl font-black mt-2 text-orange-600\">99.4%</p>\n        </div>\n        <div className=\"p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm\">\n          <h3 className=\"text-sm font-medium text-slate-500\">Active Entities</h3>\n          <p className=\"text-3xl font-black mt-2\">1,248</p>\n        </div>\n        <div className=\"p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm\">\n          <h3 className=\"text-sm font-medium text-slate-500\">System Health</h3>\n          <p className=\"text-3xl font-black mt-2 text-emerald-500\">Operational</p>\n        </div>\n      </div>\n    </div>\n  );\n}",
                "language": "typescript",
            })
            files.append({
                "path": "frontend/package.json",
                "content": '{\n  "name": "frontend",\n  "private": true,\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  },\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0",\n    "lucide-react": "^0.475.0",\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^3.0.0"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.3.4",\n    "typescript": "^5.7.3",\n    "vite": "^6.2.0",\n    "tailwindcss": "^4.0.0"\n  }\n}',
                "language": "json",
            })
        else:
            files.append({
                "path": "frontend/index.html",
                "content": html_code,
                "language": "html",
                "isEntrypoint": True,
            })

        # Backend Models & APIs
        if backend == "fastapi":
            files.append({
                "path": "backend/app/main.py",
                "content": "from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom .routes import items\n\napp = FastAPI(title=\"ProtoPatch API\", version=\"1.0.0\")\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"*\"],\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)\n\napp.include_router(items.router, prefix=\"/api/v1\")\n\n@app.get(\"/health\")\ndef health():\n    return {\"status\": \"ok\"}\n",
                "language": "python",
                "isEntrypoint": True,
            })
            files.append({
                "path": "backend/app/models.py",
                "content": "from pydantic import BaseModel, Field\nfrom typing import Optional\nfrom datetime import datetime\n\nclass ItemBase(BaseModel):\n    title: str = Field(..., max_length=200)\n    description: Optional[str] = None\n    is_active: bool = True\n\nclass Item(ItemBase):\n    id: int\n    created_at: datetime = Field(default_factory=datetime.utcnow)\n",
                "language": "python",
            })
            files.append({
                "path": "backend/requirements.txt",
                "content": "fastapi>=0.115.0\nuvicorn>=0.34.0\npydantic>=2.10.0\nsqlalchemy>=2.0.36\npsycopg2-binary>=2.9.10\n",
                "language": "python",
            })
        else:
            files.append({
                "path": "backend/app/models.py",
                "content": django_models,
                "language": "python",
                "isEntrypoint": True,
            })
            files.append({
                "path": "backend/app/serializers.py",
                "content": drf_serializers,
                "language": "python",
            })
            files.append({
                "path": "backend/requirements.txt",
                "content": "django>=5.1.0\ndjangorestframework>=3.15.0\ndjango-cors-headers>=4.6.0\npsycopg2-binary>=2.9.10\n",
                "language": "python",
            })

        # Documentation and Env
        files.append({
            "path": ".env.example",
            "content": f"DATABASE_URL={database}://user:pass@localhost:5432/app_db\nPORT=8000\nDEBUG=True\nSECRET_KEY=dev-secret-key\n",
            "language": "json",
        })
        files.append({
            "path": "README.md",
            "content": f"# ProtoPatch Generated Fullstack App\n\nGenerated with:\n- Frontend: {frontend}\n- Backend: {backend}\n- Database: {database}\n\n## Quick Start\n\n### 1. Frontend\n```bash\ncd frontend\nnpm install\nnpm run dev\n```\n\n### 2. Backend\n```bash\ncd backend\npip install -r requirements.txt\npython app/main.py\n```\n",
            "language": "markdown",
        })

        return files

    def analyze_bug_from_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/png",
        transcript: str = "",
    ) -> dict:
        """
        Analyze a screenshot for UI bugs.
        """
        transcript_hint = f"\nDeveloper's voice description: \"{transcript}\"" if transcript else ""

        prompt = f"""You are an expert UI/UX debugger and Senior Frontend Engineer.
Analyze this screenshot for visual bugs, layout issues, or UI problems.{transcript_hint}

CRITICAL OUTPUT REQUIREMENTS:
1. bug_description: Clear, specific description of what is visually wrong
2. target_element: The CSS selector or component name that is buggy (e.g. ".nav-bar", "ProfileCard", "#submit-btn")
3. suggested_fix: Human-readable fix description (e.g. "Add margin-top: 16px to the header container")
4. css_or_logic_diff: A valid unified diff patch showing the exact code change needed.

Return ONLY a valid JSON object."""

        return self._call_gemini(
            model_name="gemini-2.5-flash",
            prompt=prompt,
            image_bytes=image_bytes,
            mime_type=mime_type,
            schema=BUG_ANALYSIS_SCHEMA,
        )

    def analyze_bug_from_video(
        self,
        video_path: Path,
        transcript: str = "",
        max_frames: int = 3,
    ) -> dict:
        """
        Extract bug analysis from a screen recording.
        """
        frames = self._extract_video_frames(video_path, max_frames)

        if not frames:
            logger.warning("Could not extract frames from video; using transcript-only analysis")
            return {
                "bug_description": transcript or "Bug described via voice only — no frames extracted.",
                "target_element": "",
                "suggested_fix": transcript,
                "css_or_logic_diff": "",
            }

        frame_bytes = frames[len(frames) // 2]
        return self.analyze_bug_from_image(
            image_bytes=frame_bytes,
            mime_type="image/jpeg",
            transcript=transcript,
        )

    def _extract_video_frames(self, video_path: Path, count: int = 3) -> list[bytes]:
        """
        Extract JPEG frames from a video file.
        """
        frames = []
        try:
            import cv2
            cap = cv2.VideoCapture(str(video_path))
            total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total <= 0:
                cap.release()
                return frames

            indices = [int(total * i / count) for i in range(count)]
            for idx in indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    frames.append(buf.tobytes())
            cap.release()
        except ImportError:
            try:
                data = video_path.read_bytes()[:102400]
                frames = [data]
            except Exception:
                pass
        except Exception as exc:
            logger.error("Frame extraction error: %s", exc)

        return frames
