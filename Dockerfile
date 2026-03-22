# ──────────────────────────────────────────────────────────────────────────────
# BetterEcho AI — Dockerfile
# Python Flask + OpenAI Whisper + Google Gemini
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# ── System dependencies ────────────────────────────────────────────────────────
# ffmpeg is required by Whisper and pydub for audio decoding
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# ── App directory ──────────────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python dependencies ────────────────────────────────────────────────
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download Whisper model at build time ───────────────────────────────────
# Baking the model into the image avoids re-downloading on every cold start.
# Default: 'base' (works within Render's 512MB free tier)
# Override at build time: docker build --build-arg WHISPER_MODEL=small .
ARG WHISPER_MODEL=base
ENV WHISPER_MODEL=${WHISPER_MODEL}
RUN python -c "import whisper; whisper.load_model('${WHISPER_MODEL}')"

# ── Copy application code ──────────────────────────────────────────────────────
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# ── Working directory for gunicorn ─────────────────────────────────────────────
WORKDIR /app/backend

# ── Expose port ───────────────────────────────────────────────────────────────
EXPOSE 5000

# ── Launch with Gunicorn (production WSGI server) ──────────────────────────────
CMD ["gunicorn", "app:app", "--config", "gunicorn.conf.py"]
