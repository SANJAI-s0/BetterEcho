import os
import warnings
# Suppress Whisper FP16 CPU warning and Google SDK deprecation warning
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning, message=".*FP16.*")

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import whisper
import google.generativeai as genai
import tempfile
import numpy as np
from pydub import AudioSegment
from dotenv import load_dotenv

load_dotenv()

# ── Optional: Noise Reduction ──────────────────────────────────────────────────
try:
    import noisereduce as nr
    import soundfile as sf
    NOISE_REDUCTION = True
except ImportError:
    NOISE_REDUCTION = False
    print("⚠️  [BetterEcho] noisereduce not found. Run: pip install noisereduce soundfile")

# ── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ── Gemini ─────────────────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model_gemini = genai.GenerativeModel('gemini-1.5-flash')

# ── Whisper Context Prompt ─────────────────────────────────────────────────────
# Priming Whisper with South Indian English context dramatically improves accuracy
# for names and place names that the base model misrecognizes.
WHISPER_PROMPT = (
    "Classroom lecture in Indian English with South Indian accent. "
    "Indian names: Sanjai, Sanjay, Ravi, Priya, Kavya, Arjun, Ramesh, Kumar, Vijay, Anand. "
    "South Indian cities: Coimbatore, Chennai, Bengaluru, Madurai, Tirupur, Salem, Tirunelveli, Hyderabad, Mysuru. "
    "Technical academic vocabulary. Transcribe all proper nouns carefully."
)

# ── Gemini Correction Prompt ───────────────────────────────────────────────────
CORRECTION_PROMPT = """You are a specialized transcription corrector for Indian English speech.

The text below was transcribed from audio using Whisper AI. Fix ONLY clear transcription errors caused by:
1. South Indian name mishearings  (e.g., "Sanjay" → "Sanjai" if context suggests it)
2. Indian city/place name errors  (e.g., "Guaimbatul" → "Coimbatore")
3. South Indian accent-based phonetic mishearings
4. Technical/academic term errors

Rules:
- Correct ONLY obvious errors — do NOT rephrase, summarize, or add content
- Preserve ALL punctuation and sentence structure
- If unsure about a correction, leave the word as-is
- Return ONLY the corrected text — no labels, no explanation, no markdown

Raw transcript:
{transcript}"""

# ── Load Whisper ───────────────────────────────────────────────────────────────
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")  # Override with 'base' on free cloud tiers
print(f"\n🧠 [BetterEcho] Loading STT Engine (Whisper '{WHISPER_MODEL}')...")
if WHISPER_MODEL == "small":
    print("   ⏳ First run: downloads ~244MB model. Subsequent runs are instant.\n")
stt_model = whisper.load_model(WHISPER_MODEL)
print("✅ [BetterEcho] Engine ready!\n")

# ── Audio Preprocessing ────────────────────────────────────────────────────────
def preprocess_audio(webm_path: str) -> str:
    """
    Convert webm → 16kHz mono WAV and apply noise reduction.
    Returns the path to the cleaned WAV file.
    """
    out_path = webm_path.replace(".webm", "_clean.wav")

    # Step 1: Convert to 16kHz mono WAV (the optimal format for Whisper)
    audio = AudioSegment.from_file(webm_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio = audio.normalize()  # Normalize volume
    audio.export(out_path, format="wav")

    # Step 2: Noise Reduction (if noisereduce is installed)
    if NOISE_REDUCTION:
        data, rate = sf.read(out_path)
        # prop_decrease=0.8: removes 80% of background noise energy
        reduced = nr.reduce_noise(
            y=data, sr=rate,
            prop_decrease=0.8,
            stationary=True,  # Good for steady classroom background hum/AC
            n_fft=512
        )
        # Normalize to prevent clipping after filtering
        if np.abs(reduced).max() > 0:
            reduced = reduced / np.abs(reduced).max() * 0.95
        sf.write(out_path, reduced.astype(np.float32), rate)

    return out_path

# ── Gemini Correction Pass ─────────────────────────────────────────────────────
def correct_transcript(raw: str) -> str:
    """
    Use Gemini to fix Indian proper nouns and accent-based mishearings
    in the raw Whisper transcript.
    """
    if not raw or not raw.strip():
        return raw
    try:
        response = model_gemini.generate_content(
            CORRECTION_PROMPT.format(transcript=raw)
        )
        corrected = response.text.strip()
        return corrected if corrected else raw
    except Exception as e:
        print(f"⚠️  [BetterEcho] Gemini correction failed: {e}")
        return raw  # Gracefully fall back to raw Whisper output

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/app')
def serve_app():
    return send_from_directory(app.static_folder, 'app.html')

@app.route('/sessions')
def serve_sessions():
    return send_from_directory(app.static_folder, 'sessions.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file received"}), 400

    webm_tmp = None
    wav_tmp  = None
    try:
        # 1. Save uploaded audio blob
        audio_file = request.files['audio']
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            audio_file.save(tmp.name)
            webm_tmp = tmp.name

        # 2. Preprocess: convert to clean 16kHz mono WAV + noise reduction
        wav_tmp = preprocess_audio(webm_tmp)

        # 3. High-Accuracy Whisper transcription
        result = stt_model.transcribe(
            wav_tmp,
            language="en",              # Force English — prevents language confusion
            task="transcribe",
            initial_prompt=WHISPER_PROMPT,  # Indian English context primer
            condition_on_previous_text=True,
            temperature=0,              # Greedy decoding — most consistent output
            beam_size=5,                # Beam search → better than greedy alone
            fp16=False,                 # Explicit FP32 for CPU machines
            no_speech_threshold=0.6,
            compression_ratio_threshold=2.4,
        )

        raw_transcript = result['text'].strip()

        # 4. Gemini correction pass — fix Indian proper nouns
        final_transcript = correct_transcript(raw_transcript)

        return jsonify({
            "transcript": final_transcript,
            "raw_transcript": raw_transcript,  # exposed for debugging
        })

    except Exception as e:
        print(f"❌ [BetterEcho] Transcription error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Always clean up temp files
        for path in [webm_tmp, wav_tmp]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception:
                    pass

@app.route('/analyze', methods=['POST'])
def analyze_transcript():
    data = request.get_json()
    transcript = data.get('transcript', '')

    if not transcript:
        return jsonify({"error": "Empty transcript"}), 400

    prompt = f"""
    You are BetterEcho's AI Analysis Engine. Analyze this classroom lecture transcript.
    Provide a rich, structured response:

    ## Executive Summary
    (3-sentence summary of the lecture)

    ## Key Pillars
    (Top 5 main topics with a one-line explanation each, as a bullet list)

    ## Definitions & Concepts
    (Key terms and their definitions from the lecture, as a bullet list)

    ## Study Questions
    (3 thought-provoking questions based on the lecture content)

    ## Further Reading
    (2-3 suggested topics for deeper learning)

    Transcript:
    {transcript}
    """

    try:
        response = model_gemini.generate_content(prompt)
        return jsonify({"analysis": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
