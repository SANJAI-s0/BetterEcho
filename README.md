<div align="center">

<img src="frontend/docs/logo.jpeg" alt="BetterEcho Logo" width="100" />

# BetterEcho AI

**High-Accuracy Speech-to-Text & Semantic Understanding Pipeline for Classroom Note-Taking**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![OpenAI Whisper](https://img.shields.io/badge/Whisper-OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/SANJAI-s0/BetterEcho/actions)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

*Never miss a word in class — BetterEcho converts lectures to smart, structured notes using Whisper STT + Gemini AI.*

[**Live Demo**](https://betterecho-ai.onrender.com) · [**Report Bug**](https://github.com/SANJAI-s0/BetterEcho/issues) · [**Request Feature**](https://github.com/SANJAI-s0/BetterEcho/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Docker Usage](#-docker-usage)
- [Deployment on Render](#-deployment-on-render)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [Pages & Navigation](#-pages--navigation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Code of Conduct](#-code-of-conduct)
- [License](#-license)

---

## 🎯 Overview

**BetterEcho** is a classroom-first, AI-powered voice recorder designed to solve one critical student problem: **missing important information during fast-paced lectures**.

The system uses a **4-layer accuracy pipeline**:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 🌊 Audio Preprocessing | `pydub` + `noisereduce` | 16kHz mono conversion + 80% noise reduction |
| 🎙️ Speech-to-Text | OpenAI Whisper `small` | High-accuracy local transcription |
| 🧭 Context Priming | Whisper `initial_prompt` | Indian English names & places awareness |
| 🧠 AI Correction | Google Gemini 1.5 Flash | Fix proper nouns, accents & mishearings |

> **Example:** Raw Whisper output: *"I'm Sanjay, I'm coming from Guaimbatul"*
> After BetterEcho correction: *"I'm Sanjai, I'm coming from Coimbatore"* ✅

---

## ✨ Key Features

- 🎙️ **Real-time Audio Recording** with live frequency visualizer (Web Audio API)
- 🔊 **Noise Reduction** — removes AC hum, crowd noise & echo before STT processing
- 🤖 **Indian English Optimized** — handles South Indian names, cities & accent patterns
- 🧠 **Semantic Analysis** — auto-generates summaries, key pillars, definitions & study questions
- 💾 **Session History** — all sessions saved locally via `localStorage` with search & modal preview
- 🔒 **100% Private** — Whisper runs locally; your audio never leaves your device
- 🌐 **Single-Command Launch** — one `python app.py` serves the entire application
- 🐳 **Docker + CI/CD** — fully containerized with GitHub Actions and one-click Render deploys

---

## 🛠️ Tech Stack

### Backend
| Tool | Version | Role |
|------|---------|------|
| Python | 3.11+ | Runtime |
| Flask | 3.1 | Web framework + static file server |
| OpenAI Whisper | 20250625 | Local speech-to-text engine |
| Google Gemini | 1.5 Flash | Semantic analysis + transcript correction |
| pydub | 0.25 | Audio format conversion (webm → wav) |
| noisereduce | 3.0 | Background noise suppression |
| soundfile | 0.13 | Audio I/O for noise reduction pipeline |
| gunicorn | — | Production WSGI server |

### Frontend
| Tool | Role |
|------|------|
| Vanilla HTML5 | Semantic page structure |
| Vanilla CSS3 | Custom design system, glassmorphism, CSS Grid |
| Vanilla JavaScript | MediaRecorder API, Web Audio API, GSAP animations |
| GSAP 3.12 | Hero animations, scroll triggers, entrance effects |
| Font Awesome 6 | Navigation & UI icons |

### DevOps
| Tool | Role |
|------|------|
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline (lint → build → deploy) |
| Render | Cloud hosting (free tier supported) |
| FFmpeg | Audio codec support (installed in Docker image) |

---

## 🏗️ System Architecture

```
Browser (User)
    │
    ├──► GET  /          → Landing Page  (index.html)
    ├──► GET  /app       → Recorder Page (app.html)
    ├──► GET  /sessions  → History Page  (sessions.html)
    │
    ├──► POST /transcribe
    │       │
    │       ├─ [1] pydub:       webm → 16kHz mono WAV
    │       ├─ [2] noisereduce: Remove background noise
    │       ├─ [3] Whisper:     STT with Indian English prompt
    │       └─ [4] Gemini:      Correct proper nouns → Final text
    │
    └──► POST /analyze
            │
            └─ Gemini 1.5 Flash → Summary + Pillars + Definitions
                                   + Study Questions + Further Reading
```

See [`flow.mmd`](flow.mmd) for the full Mermaid flowchart.

---

## ✅ Prerequisites

| Requirement | Check Command | Install |
|------------|--------------|---------|
| Python 3.11+ | `python --version` | [python.org](https://python.org) |
| FFmpeg | `ffmpeg -version` | `winget install ffmpeg` |
| Git | `git --version` | [git-scm.com](https://git-scm.com) |
| Gemini API Key | — | [aistudio.google.com](https://aistudio.google.com/app/apikey) (Free) |

---

## 🚀 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SANJAI-s0/BetterEcho.git
cd BetterEcho
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

### 5. Run the Application
```bash
cd backend
python app.py
```

Open your browser at **[http://localhost:5000](http://localhost:5000)**

> **Note:** The first run downloads the Whisper `small` model (~244MB). Subsequent starts are instant.

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | — | Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com)) |
| `WHISPER_MODEL` | ❌ No | `small` | Whisper model size. Use `base` for Render free tier |
| `FLASK_ENV` | ❌ No | `development` | Set to `production` for deployment |
| `PORT` | ❌ No | `5000` | Port to listen on (auto-set by Render) |

---

## 🐳 Docker Usage

### Build & Run Locally
```bash
# Using Docker Compose (recommended for local testing)
docker compose up --build

# Or manually:
docker build -t betterecho .
docker run -p 5000:5000 -e GEMINI_API_KEY=your_key_here betterecho
```

### Build with a Different Model
```bash
# Use 'base' for lower memory usage (Render free tier)
docker build --build-arg WHISPER_MODEL=base -t betterecho:base .

# Use 'small' for higher accuracy (needs ~512MB+ RAM)
docker build --build-arg WHISPER_MODEL=small -t betterecho:small .
```

> The Whisper model is **baked into the Docker image** at build time to avoid re-downloading on every cold start.

---

## ☁️ Deployment on Render

### Automatic (via `render.yaml` Blueprint)

1. **Fork or push** this repo to your GitHub account
2. Go to [Render Dashboard](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. In **Environment Variables**, add:
   ```
   GEMINI_API_KEY = your_key_here
   ```
5. Click **Deploy** — done! 🎉

### Model Size on Render

| Render Plan | RAM | Recommended Model |
|------------|-----|------------------|
| Free | 512MB | `base` ✅ (set in render.yaml) |
| Starter | 512MB | `base` ✅ |
| Standard | 2GB | `small` ✅ (best accuracy) |

---

## 🔄 CI/CD Pipeline

Every `git push` to `main` triggers the 3-stage GitHub Actions pipeline:

```
Push to main
    │
    ├─ Stage 1: Quality Check
    │     └─ flake8 lint on backend/app.py
    │
    ├─ Stage 2: Docker Build Test
    │     └─ Builds image with 'tiny' model for speed
    │         Uses GitHub Actions cache to speed up rebuilds
    │
    └─ Stage 3: Deploy (only on main branch)
          └─ Calls RENDER_DEPLOY_HOOK_URL secret
              → Render rebuilds and redeploys automatically
```

### Required GitHub Secrets

| Secret | Where to Get |
|--------|-------------|
| `RENDER_DEPLOY_HOOK_URL` | Render Dashboard → Service → Settings → Deploy Hook |

---

## 📁 Project Structure

See [`STRUCTURE.md`](STRUCTURE.md) for a complete file-by-file breakdown.

```
BetterEcho/
├── .github/workflows/deploy.yml  ← CI/CD Pipeline
├── backend/                       ← Flask API + STT pipeline
│   ├── app.py                     ← Main application
│   ├── gunicorn.conf.py           ← Production server config
│   ├── requirements.txt           ← Python dependencies
│   └── .env.example               ← Environment template
├── frontend/                      ← Served by Flask
│   ├── index.html                 ← Landing page
│   ├── app.html                   ← Recorder workspace
│   ├── sessions.html              ← Session history
│   ├── css/style.css              ← Full design system
│   ├── js/{nav,app}.js            ← UI logic
│   └── docs/                      ← Logo + 13 SVG icons
├── Dockerfile                     ← Production Docker image
├── docker-compose.yml             ← Local Docker testing
├── render.yaml                    ← Render deployment blueprint
├── flow.mmd                       ← System flow diagram
└── STRUCTURE.md                   ← Project structure docs
```

---

## 🗺️ Pages & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero, features, stats (GSAP animated) |
| `/app` | Recorder | Sidebar + dual-panel workspace |
| `/sessions` | History | localStorage sessions with search & modal |

---

## 🗺️ Roadmap

- [ ] Real-time streaming transcription (WebSocket)
- [ ] Multi-language support (Tamil, Hindi, Telugu)
- [ ] PDF / Markdown export of study notes
- [ ] Speaker diarization (identify different speakers)
- [ ] Mobile PWA support
- [ ] User accounts with cloud sync (Supabase)

---

## 🤝 Contributing

Contributions are welcome! Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feat/your-feature-name

# 3. Commit your changes
git commit -m "feat: add your feature"

# 4. Push and open a Pull Request
git push origin feat/your-feature-name
```

Please follow this commit style:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `style:` — formatting, no logic change
- `refactor:` — code restructure

---

## 📜 Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Made with ❤️ for students everywhere.

**[⭐ Star this repo](https://github.com/SANJAI-s0/BetterEcho)** if BetterEcho helped you!

</div>
