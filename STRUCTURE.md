---
title: BetterEcho — Project Structure
description: A complete file-by-file breakdown of the BetterEcho repository
---

# 📁 BetterEcho — Project Structure

> A detailed breakdown of every file and directory in the repository.

```
BetterEcho/
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: 3-stage pipeline (lint → Docker build → Render deploy)
│
├── backend/
│   ├── app.py                  # Core Flask application
│   │                           #  - Serves all 3 frontend pages
│   │                           #  - POST /transcribe: 4-layer STT pipeline
│   │                           #  - POST /analyze: Gemini AI semantic analysis
│   │
│   ├── gunicorn.conf.py        # Production WSGI server configuration
│   │                           #  - Single worker (Whisper model is not fork-safe)
│   │                           #  - 300s timeout for long audio processing
│   │                           #  - Reads PORT from environment (Render-compatible)
│   │
│   ├── requirements.txt        # Python package dependencies
│   │                           #  flask, flask-cors, openai-whisper, google-generativeai,
│   │                           #  pydub, noisereduce, soundfile, torch, torchaudio, gunicorn
│   │
│   ├── .env.example            # Template for environment variables (committed to git)
│   └── .env                    # Local secrets — NEVER committed (in .gitignore)
│
├── frontend/                   # Static files served by Flask from /
│   │
│   ├── index.html              # Page 1: Landing page
│   │                           #  - Hero section with animated wave visualizer
│   │                           #  - Feature cards (6 cards, scroll-triggered)
│   │                           #  - Stats counter section (GSAP ScrollTrigger)
│   │                           #  - CTA section linking to /app
│   │
│   ├── app.html                # Page 2: Main recorder workspace
│   │                           #  - Left sidebar: visualizer, timer, record button
│   │                           #  - Right workspace: Transcript + Analysis panels
│   │                           #  - Session title input, save & copy actions
│   │
│   ├── sessions.html           # Page 3: Session history
│   │                           #  - Search bar (filters by title)
│   │                           #  - Session list rendered from localStorage
│   │                           #  - Modal preview with transcript + analysis
│   │                           #  - Delete session functionality
│   │
│   ├── css/
│   │   └── style.css           # Full design system (750+ lines)
│   │                           #  - CSS Custom Properties (design tokens)
│   │                           #  - Shared: navbar, glass cards, buttons, tags
│   │                           #  - Landing: hero, wave bars, features grid, stats
│   │                           #  - App: sidebar layout, workspace panels, visualizer
│   │                           #  - Sessions: list view, search, modal overlay
│   │                           #  - SVG status icon utilities (.status-icon, .spin)
│   │                           #  - Fully responsive (breakpoint at 960px)
│   │
│   ├── js/
│   │   ├── nav.js              # Shared navbar component
│   │   │                       #  - injectNav(activePage): builds & injects nav HTML
│   │   │                       #  - Renders BetterEcho logo from /docs/logo.jpeg
│   │   │                       #  - Highlights the active page link
│   │   │
│   │   └── app.js              # Main recorder application logic
│   │                           #  - BetterEchoRecorder class
│   │                           #  - MediaRecorder API: start/stop audio capture
│   │                           #  - Web Audio API: real-time frequency visualizer
│   │                           #  - Sends audio to POST /transcribe
│   │                           #  - Displays corrected + raw (collapsible) transcript
│   │                           #  - Sends transcript to POST /analyze
│   │                           #  - Renders markdown-to-HTML analysis output
│   │                           #  - Saves sessions to localStorage
│   │                           #  - Copy to clipboard functionality
│   │
│   └── docs/
│       ├── logo.jpeg           # BetterEcho brand logo (brain + microphone)
│       └── icons/              # 13 hand-crafted Feather-style SVG icons
│           ├── mic.svg         # Microphone — STT feature card, CTA button
│           ├── brain.svg       # Brain — semantic analysis feature card
│           ├── wave.svg        # Sound wave — audio visualizer feature card
│           ├── book.svg        # Book — session history feature card
│           ├── lock.svg        # Padlock — privacy feature card
│           ├── bolt.svg        # Lightning — zero-config feature card, tag
│           ├── chip.svg        # Microchip — hero badge icon
│           ├── rocket.svg      # Rocket — CTA launch button
│           ├── graduation.svg  # Graduation cap — "For Students" tag
│           ├── check.svg       # Green checkmark — transcription success status
│           ├── error.svg       # Red X — transcription/analysis error status
│           ├── recording.svg   # Red mic — active recording status
│           ├── processing.svg  # Cyan spinner — transcribing/processing status
│           └── save.svg        # Cyan floppy disk — session saved status
│
├── Dockerfile                  # Production Docker image
│                               #  - Base: python:3.11-slim
│                               #  - Installs: ffmpeg, libsndfile1
│                               #  - Bakes Whisper model at build time (ARG WHISPER_MODEL)
│                               #  - CMD: gunicorn with gunicorn.conf.py
│
├── docker-compose.yml          # Local Docker Compose configuration
│                               #  - Uses 'small' model locally for better accuracy
│                               #  - Hot-reload volume for frontend/
│                               #  - Reads GEMINI_API_KEY from .env
│
├── render.yaml                 # Render Blueprint for cloud deployment
│                               #  - Configures Docker runtime
│                               #  - Sets WHISPER_MODEL=base (free tier safe)
│                               #  - Marks GEMINI_API_KEY as user-supplied secret
│                               #  - Enables autoDeploy on push to main
│
├── flow.mmd                    # Mermaid flowchart: full system data flow
│
├── STRUCTURE.md                # This file — project structure documentation
│
├── CODE_OF_CONDUCT.md          # Contributor Covenant Code of Conduct v2.1
│
├── .gitignore                  # Excludes: .env, .venv/, *.pt, *.webm, *.wav
│
├── .dockerignore               # Excludes from Docker build context:
│                               #  .venv, .env, *.pt (model weights), temp audio
│
├── run_backend.bat             # One-click Windows startup script
│                               #  - Creates venv, installs deps, launches app
│
└── README.md                   # Full project documentation with badges & TOC
```

---

## 🔄 Data Flow Summary

```
Audio (webm) → pydub (16kHz WAV) → noisereduce → Whisper STT
                                                      ↓
                                               raw transcript
                                                      ↓
                                           Gemini correction pass
                                                      ↓
                                            final transcript (UI)
                                                      ↓
                                     [optional] Gemini semantic analysis
                                                      ↓
                                          Summary + Pillars + Questions
```

---

## 🧰 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Flask serves frontend | No separate static server needed; single `python app.py` for full stack |
| Whisper runs locally | Audio privacy — no audio data leaves the user's machine |
| Gemini only for text | Text is less sensitive than raw audio; used only for correction + analysis |
| Single gunicorn worker | Whisper model is not thread/process safe; avoids memory duplication |
| Model baked into Docker | Avoids slow cold-start downloads on Render; improves startup time |
| `base` model on Render | Free tier has 512MB RAM; `small` (~466MB model) fits on paid tiers |
| localStorage for sessions | No database needed for MVP; works fully offline; instant reads |
| Dynamic navbar (nav.js) | DRY principle — shared component without build tooling or frameworks |
