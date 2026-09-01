# ⚡ ProtoPatch

> **Multimodal Developer Engine**  
> *From napkin sketch to running full-stack app in 15 seconds. From 5-second mobile bug recording to merged GitHub PR in 30 seconds.*

---

## 🚀 Overview

ProtoPatch is built for flagship mobile workflows to bridge two massive developer friction points:

1. **Genesis Friction (Sketch2Stack)**: 85% of software architecture starts on paper. ProtoPatch uses multimodal vision models to parse hand-drawn napkin wireframes and database schemas directly into live responsive Tailwind CSS interfaces, production Django ORM models, and Django REST Framework serializers.
2. **Maintenance Friction (ScreenToPatch)**: Testers waste hours reproducing mobile UI bugs. ProtoPatch accepts a screen recording or screenshot with an optional voice memo, transcribes the voice note, localizes the bug via AST code search across the target GitHub repository, and automatically opens a GitHub Pull Request with the exact fix.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TanStack Start / Router, Motion (Framer Motion), Tailwind CSS, Lucide Icons
- **Backend**: Django 6, Django REST Framework, Python 3.12+
- **AI / Multimodal**: Google Gemini 3.6 Flash Vision, Whisper Speech-to-Text
- **Code & AST**: Tree-sitter, Git / PyGithub automation

---

## 📂 Project Structure

```
├── backend/
│   ├── backend/
│   │   ├── api/                   # Django REST API endpoints & services
│   │   │   ├── services/
│   │   │   │   ├── ast_engine.py      # AST repository code search
│   │   │   │   ├── audio_service.py   # Whisper STT & Gemini audio
│   │   │   │   ├── git_service.py     # GitHub branch & PR dispatch
│   │   │   │   ├── sandbox_service.py # Sandboxed iframe preview
│   │   │   │   └── vision_service.py  # Gemini Multimodal Vision pipeline
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── protopatch_core/       # Django core settings & routing
│   │   ├── manage.py
│   │   └── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── src/
│   ├── components/
│   │   ├── app/                   # Working prototype UI components
│   │   │   ├── app-header.tsx         # Unified tool navigation
│   │   │   ├── audio-recorder.tsx     # Web Audio API real-time waveform recorder
│   │   │   ├── code-block.tsx         # Syntax highlighted code viewer
│   │   │   ├── diff-viewer.tsx        # Unified Git diff viewer
│   │   │   ├── file-dropzone.tsx      # Drag & drop wireframe upload
│   │   │   └── pipeline-progress.tsx  # Multi-stage AI pipeline tracker
│   │   └── site/                  # Landing page & brand system
│   │       ├── custom-cursor.tsx      # Architectural HUD reticle cursor
│   │       ├── floating-cta.tsx       # Minimalist persistent quick-action dock
│   │       ├── logo.tsx               # Vector ProtoPatch brand mark
│   │       ├── text-reveal.tsx        # Word-by-word clip mask text animation
│   │       └── ...
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx              # Landing page
│   │   ├── sketch.tsx             # Sketch2Stack live tool
│   │   └── patch.tsx              # ScreenToPatch live tool
│   ├── lib/
│   │   └── api-client.ts          # Typed frontend API bridge
│   └── styles.css
│
├── public/
│   ├── favicon.svg                # Brand icon
│   └── manifest.json              # PWA manifest
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend/backend

# Create & activate virtualenv
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment keys in backend/.env:
# GEMINI_API_KEY=your_key_here
# GITHUB_TOKEN=your_token_here

# Run migrations & start server (port 8000)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup

```bash
# In the root directory:
npm install

# Start Vite dev server (port 8080)
npm run dev
```

Visit **`http://localhost:8080`** to experience ProtoPatch live!
- **`http://localhost:8080/sketch`** — Sketch2Stack Creation Tool
- **`http://localhost:8080/patch`** — ScreenToPatch Heal Tool
