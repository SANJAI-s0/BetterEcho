class BetterEchoApp {
    constructor() {
        this.recorder = null;
        this.chunks = [];
        this.stream = null;
        this.isRecording = false;
        this.timerInterval = null;
        this.seconds = 0;
        this.transcript = "";
        this.analysis = "";
        this.audioCtx = null;
        this.analyser = null;
        this.animId = null;

        // DOM 
        this.toggleBtn      = document.getElementById('toggle-record');
        this.recordIcon     = document.getElementById('record-icon');
        this.timer          = document.getElementById('rec-timer');
        this.statusPill     = document.getElementById('status-pill');
        this.transcriptOut  = document.getElementById('transcript-output');
        this.analysisOut    = document.getElementById('analysis-output');
        this.analyzeBtn     = document.getElementById('analyze-btn');
        this.saveBtn        = document.getElementById('save-session-btn');
        this.copyBtn        = document.getElementById('copy-btn');
        this.copyAnalysisBtn= document.getElementById('copy-analysis-btn');
        this.canvas         = document.getElementById('visualizer');
        this.sessionTitle   = document.getElementById('session-title');
        this.tabs           = document.querySelectorAll('.workspace-tab');
        this.panels         = document.querySelectorAll('.workspace-panel');

        // Default session name
        this.sessionTitle.value = `Session – ${new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}`;

        this.init();
    }

    init() {
        this.toggleBtn.addEventListener('click', () => this.handleRecord());
        this.analyzeBtn.addEventListener('click', () => this.runAnalysis());
        this.saveBtn.addEventListener('click', () => this.saveSession());
        this.copyBtn.addEventListener('click', () => this.copy(this.transcript));
        this.copyAnalysisBtn.addEventListener('click', () => this.copy(this.analysis));

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchPanel(tab.dataset.panel));
        });

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.drawIdle();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    drawIdle() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const bars = 50;
        for (let i = 0; i < bars; i++) {
            const h = Math.random() * 20 + 4;
            ctx.fillStyle = 'rgba(6,182,212,0.15)';
            const bw = (this.canvas.width / bars) * 0.7;
            ctx.fillRect((i / bars) * this.canvas.width, this.canvas.height / 2 - h / 2, bw, h);
        }
    }

    switchPanel(panelId) {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.panels.forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-panel="${panelId}"]`).classList.add('active');
        document.getElementById(panelId).classList.add('active');
    }

    async handleRecord() {
        if (!this.isRecording) await this.startRec();
        else await this.stopRec();
    }

    async startRec() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            alert('BetterEcho needs microphone access. Please allow it in your browser.');
            return;
        }

        this.recorder = new MediaRecorder(this.stream);
        this.chunks = [];
        this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
        this.recorder.onstop = () => this.processAudio();
        this.recorder.start();

        this.isRecording = true;
        this.toggleBtn.classList.add('recording');
        this.recordIcon.className = 'fas fa-stop';
        this.setStatus('<img src="/docs/icons/recording.svg" class="status-icon"> Recording in Progress...', 'danger');

        this.startTimer();
        this.startVisualizer();
    }

    async stopRec() {
        this.recorder.stop();
        this.stream.getTracks().forEach(t => t.stop());
        this.isRecording = false;
        this.toggleBtn.classList.remove('recording');
        this.recordIcon.className = 'fas fa-microphone';
        this.setStatus('<img src="/docs/icons/processing.svg" class="status-icon spin"> Processing with BetterEcho AI...', 'cyan');
        this.stopTimer();
        this.stopVisualizer();
    }

    setStatus(text, color) {
        const colors = {
            cyan: ['rgba(6,182,212,0.08)', 'rgba(6,182,212,0.2)', '#06b6d4'],
            danger: ['rgba(244,63,94,0.08)', 'rgba(244,63,94,0.2)', '#f43f5e'],
            success: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.2)', '#10b981'],
        };
        const [bg, border, text_color] = colors[color] || colors.cyan;
        this.statusPill.style.background = bg;
        this.statusPill.style.border = `1px solid ${border}`;
        this.statusPill.style.color = text_color;
        this.statusPill.innerHTML = text;
    }

    startTimer() {
        this.seconds = 0;
        this.timerInterval = setInterval(() => {
            this.seconds++;
            const m = Math.floor(this.seconds / 60);
            const s = (this.seconds % 60).toString().padStart(2, '0');
            this.timer.textContent = `${m}:${s}`;
        }, 1000);
    }

    stopTimer() { clearInterval(this.timerInterval); }

    startVisualizer() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        this.audioCtx.createMediaStreamSource(this.stream).connect(this.analyser);
        this.analyser.fftSize = 128;

        const data = new Uint8Array(this.analyser.frequencyBinCount);
        const ctx = this.canvas.getContext('2d');

        const draw = () => {
            this.animId = requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(data);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const bw = this.canvas.width / data.length;
            data.forEach((v, i) => {
                const h = (v / 255) * this.canvas.height;
                const pct = i / data.length;
                ctx.fillStyle = `hsl(${180 + pct * 60}, 80%, ${40 + pct * 20}%)`;
                ctx.fillRect(i * bw, this.canvas.height - h, bw - 1, h);
            });
        };
        draw();
    }

    stopVisualizer() {
        cancelAnimationFrame(this.animId);
        if (this.audioCtx) this.audioCtx.close();
        this.drawIdle();
    }

    async processAudio() {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', blob, 'session.webm');

        try {
            const res  = await fetch('/transcribe', { method: 'POST', body: form });
            const data = await res.json();

            if (data.transcript) {
                this.transcript = data.transcript;

                // Show corrected transcript; optionally show raw for comparison
                let displayHTML = `<p style="line-height:1.9;">${data.transcript}</p>`;
                if (data.raw_transcript && data.raw_transcript !== data.transcript) {
                    displayHTML += `
                        <details style="margin-top:1.5rem;color:var(--text-dim);font-size:0.85rem;">
                            <summary style="cursor:pointer;color:var(--text-mid);margin-bottom:0.5rem;">View raw Whisper output (before AI correction)</summary>
                            <p style="line-height:1.8;opacity:0.7;">${data.raw_transcript}</p>
                        </details>`;
                }

                this.transcriptOut.innerHTML = displayHTML;
                this.analyzeBtn.disabled = false;
                this.saveBtn.disabled = false;
                this.setStatus('<img src="/docs/icons/check.svg" class="status-icon"> Transcription Complete!', 'success');
            } else {
                this.setStatus('<img src="/docs/icons/error.svg" class="status-icon"> Transcription Failed', 'danger');
            }
        } catch {
            this.setStatus('<img src="/docs/icons/error.svg" class="status-icon"> Server Unreachable', 'danger');
        }
    }

    async runAnalysis() {
        if (!this.transcript) return;

        this.switchPanel('analysis-panel');
        this.analyzeBtn.disabled = true;
        this.analysisOut.innerHTML = `
            <div class="placeholder-msg">
                <i class="fas fa-cog fa-spin"></i>
                BetterEcho AI is processing your lecture...<br>Extracting pillars, definitions & study questions.
            </div>`;

        try {
            const res  = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: this.transcript })
            });
            const data = await res.json();

            if (data.analysis) {
                this.analysis = data.analysis;
                const html = data.analysis
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^\- (.*$)/gim, '<li>$1</li>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\n\s*\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');
                this.analysisOut.innerHTML = `<div class="analysis-content"><p>${html}</p></div>`;
            } else {
                this.analysisOut.innerHTML = `<div class="placeholder-msg"><img src="/docs/icons/error.svg" style="width:18px;margin-bottom:0.5rem;"> Analysis Failed. Check your Gemini API key in .env</div>`;
            }
        } catch {
            this.analysisOut.innerHTML = `<div class="placeholder-msg"><img src="/docs/icons/error.svg" style="width:18px;margin-bottom:0.5rem;"> Could not reach AI server.</div>`;
        } finally {
            this.analyzeBtn.disabled = false;
        }
    }

    saveSession() {
        const session = {
            title:      this.sessionTitle.value || 'Untitled Session',
            date:       new Date().toISOString(),
            transcript: this.transcript,
            analysis:   this.analysis,
        };
        const sessions = JSON.parse(localStorage.getItem('betterecho_sessions') || '[]');
        sessions.unshift(session);
        localStorage.setItem('betterecho_sessions', JSON.stringify(sessions));
        this.setStatus('<img src="/docs/icons/save.svg" class="status-icon"> Session Saved!', 'success');

        // GSAP flash animation on save
        if (window.gsap) {
            gsap.fromTo('#status-pill', { scale: 1.1 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
        }
    }

    copy(text) {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied to clipboard!'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new BetterEchoApp();
});
