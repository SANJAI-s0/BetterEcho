import os

# Production Gunicorn Configuration for BetterEcho

# Bind to PORT from environment (Render sets this automatically)
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Single worker — Whisper model is large and not fork-safe
workers = 1
worker_class = "sync"

# Long timeout for transcription processing (large audio files can take 60–120s)
timeout = 300

# Pre-load the app (and Whisper model) before forking — avoids duplicate memory
preload_app = True

# Logging
accesslog = "-"
errorlog  = "-"
loglevel  = "info"

# Keep connections alive for 2 seconds
keepalive = 2
