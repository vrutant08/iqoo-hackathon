# ProtoPatch — proto.patch

> **From Napkin Prototype to Merged Patch in 30 Seconds.**

ProtoPatch is a production-grade, mobile-first multimodal developer velocity engine built for the **iQOO National Hackathon — Productivity Track**.

---

## ⚡ Dual-Engine Architecture

| Mode | Trigger | Output |
|------|---------|--------|
| **⚡ Sketch2Stack** | Photo of hand-drawn wireframe | Live Tailwind HTML + Django `models.py` + DRF `serializers.py` |
| **🩺 ScreenToPatch** | Screen recording + voice memo of a UI bug | GitHub Pull Request with unified diff |

---

## 🚀 Quick Start (Windows)

### Step 1 — Configure Environment

```bash
# Copy the environment template
copy protopatch\.env.example protopatch\.env

# Edit .env with your keys:
# GEMINI_API_KEY=your_key_here   (required — get at aistudio.google.com)
# GITHUB_TOKEN=ghp_xxx           (optional — for PR creation)
```

### Step 2 — Start Backend

```batch
# Double-click or run in terminal:
protopatch\run_backend.bat
```

This auto-creates a virtualenv, installs all dependencies, and starts Django on `http://0.0.0.0:8000`.

### Step 3 — Start Frontend

```batch
# In a second terminal or double-click:
protopatch\run_frontend.bat
```

This opens `http://localhost:3000` in your browser automatically.

### Step 4 — Test on Mobile (iQOO)

1. Ensure your phone is on the **same WiFi** as your laptop
2. Run `ipconfig | findstr IPv4` to get your laptop's LAN IP
3. Open `http://YOUR_LAN_IP:3000` in Chrome on your iQOO
4. Tap **"Add to Home Screen"** for full PWA experience

---

## 📁 Project Structure

```
protopatch/
├── backend/
│   ├── manage.py
│   ├── protopatch_core/
│   │   ├── settings.py          # Django settings, CORS, .env loading
│   │   └── urls.py              # Root URL routing
│   ├── api/
│   │   ├── views.py             # Sketch2StackView + ScreenToPatchView
│   │   ├── serializers.py       # Input/output validation
│   │   └── services/
│   │       ├── vision_service.py  # Gemini 1.5 Flash VLM
│   │       ├── audio_service.py   # faster-whisper STT
│   │       ├── ast_engine.py      # Tree-sitter AST code search
│   │       ├── git_service.py     # PyGithub PR automation
│   │       └── sandbox_service.py # HTML sanitizer + iframe builder
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── index.html           # Mobile-first PWA (Tailwind CDN)
│   │   ├── manifest.json        # PWA install metadata
│   │   └── service-worker.js    # Offline cache strategy
│   └── src/
│       ├── app.js               # State machine + API orchestration
│       └── components/
│           ├── CameraCapture.js   # Touch camera + contrast boost
│           ├── ScreenRecorder.js  # Screen + voice capture
│           ├── LiveSandbox.js     # iframe hot-reload manager
│           └── PRStatusCard.js    # PR badge + diff viewer
├── demo_fixtures/
│   └── buggy_react_component.jsx  # Test component with intentional bugs
├── run_backend.bat              # 1-click backend launcher
├── run_frontend.bat             # 1-click frontend launcher
└── .env.example                 # Environment template
```

---

## 🔌 API Endpoints

### `POST /api/sketch2stack/`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File (JPEG/PNG) | ✅ | Wireframe photo |
| `notes` | String | ❌ | Extra context for AI |
| `style` | Choice | ❌ | `auto/dark/light/material/ios/minimal` |

**Response:**
```json
{
  "success": true,
  "html_code": "<!DOCTYPE html>...",
  "django_models": "from django.db import models...",
  "drf_serializers": "from rest_framework import serializers...",
  "detected_components": ["NavBar", "HeroCard", "DataTable"],
  "sandbox_html": "<!-- sanitized iframe-ready HTML -->"
}
```

### `POST /api/screentopatch/`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `screenshot` | File (JPEG/PNG) | ✅* | Screenshot of bug |
| `video` | File (WebM/MP4) | ✅* | Screen recording |
| `audio` | File (WebM/WAV/MP3) | ❌ | Voice memo |
| `repo_url` | URL | ✅ | GitHub repo URL |
| `branch` | String | ❌ | Base branch (default: `main`) |
| `notes` | String | ❌ | Bug description text |

*Either `screenshot` or `video` required.

**Response:**
```json
{
  "success": true,
  "bug_description": "The price badge clips outside the container...",
  "target_element": ".price-badge",
  "suggested_fix": "Change top: -8px to top: 8px",
  "css_or_logic_diff": "--- a/src/...\n+++ b/src/...\n@@...",
  "transcript": "The badge is overlapping the image corner",
  "pr_url": "https://github.com/org/repo/pull/42",
  "pr_number": 42,
  "branch_name": "fix/protopatch-1234567890",
  "file_matches": [...]
}
```

### `GET /api/health/`

```json
{
  "success": true,
  "status": "ok",
  "version": "1.0.0",
  "gemini_configured": true,
  "github_configured": true
}
```

---

## 🧪 Running Tests

```bash
cd protopatch/backend
.venv\Scripts\activate
python manage.py test api.tests.test_pipeline -v 2
```

Expected: **14 tests pass** with mocked services (no API keys required).

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio key. Get at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GITHUB_TOKEN` | For PR | GitHub PAT with `repo` scope |
| `WHISPER_MODEL_SIZE` | ❌ | `tiny/base/small` (default: `tiny`, ~39MB) |
| `DJANGO_SECRET_KEY` | ❌ | Auto-generated insecure key in dev mode |
| `DJANGO_DEBUG` | ❌ | `True/False` (default: `True`) |
| `CORS_ALLOWED_ORIGINS` | ❌ | Comma-separated allowed origins |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Django 5.0 + Django REST Framework 3.15 |
| VLM | Google Gemini 1.5 Flash (structured JSON output) |
| Speech-to-Text | faster-whisper (tiny model, CPU, offline) + Gemini fallback |
| AST Parsing | tree-sitter-languages (pre-compiled, no C compiler) |
| Git Automation | PyGithub + dulwich (pure Python) |
| HTML Sandbox | bleach + iframe srcdoc + postMessage |
| Frontend | Vanilla JS PWA + Tailwind CSS CDN |
| Mobile | MediaStream API (camera + mic + screen) |
| Offline | Service Worker + Cache API |

---

## 🏆 Hackathon Demo Flow

1. **Draw a Kanban board** on paper with columns: Todo / In Progress / Done
2. Open ProtoPatch on iQOO → **Sketch2Stack** tab
3. Tap "Camera" → aim at sketch → tap "Capture"
4. Select style "Dark" → tap **"Generate Stack"**
5. See live Tailwind HTML preview + Django models + DRF serializers in seconds!

6. Switch to **ScreenToPatch** tab
7. Enter `https://github.com/your-org/demo-repo`
8. Upload `demo_fixtures/buggy_react_component.jsx` screenshot
9. Record a voice memo: _"The price badge is clipping outside the product card on mobile"_
10. Tap **"Heal & Create PR"**
11. Watch the GitHub PR appear with unified diff, branch, and structured report!

---

*Built with ❤️ for the iQOO National Hackathon 2024*
