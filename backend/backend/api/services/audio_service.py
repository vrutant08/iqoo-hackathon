"""
ProtoPatch — Audio Service
Speech-to-text transcription engine with fallback chain.

Primary:  faster-whisper (local, CPU, no internet required)
Fallback: Google Gemini audio understanding API
"""
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class AudioService:
    """
    Transcribes audio files from mobile microphone recordings.
    Handles WebM, WAV, MP3, OGG, M4A formats.

    Falls back gracefully:
    1. faster-whisper (local)
    2. Gemini audio API
    3. Returns empty string (silent failure)
    """

    def __init__(self, model_size: Optional[str] = None):
        from django.conf import settings
        self.model_size = model_size or getattr(settings, "WHISPER_MODEL_SIZE", "tiny")
        self._whisper_model = None

    def _load_whisper(self):
        """Lazy-load faster-whisper model (downloads once, cached)."""
        if self._whisper_model is None:
            try:
                from faster_whisper import WhisperModel
                logger.info("Loading faster-whisper model: %s", self.model_size)
                self._whisper_model = WhisperModel(
                    self.model_size,
                    device="cpu",
                    compute_type="int8",  # Fastest on CPU
                )
                logger.info("faster-whisper loaded successfully")
            except ImportError:
                logger.warning("faster-whisper not installed — will use Gemini fallback")
            except Exception as exc:
                logger.warning("faster-whisper load failed: %s", exc)
        return self._whisper_model

    def _ensure_wav(self, audio_path: Path) -> Path:
        """
        Convert audio to WAV 16kHz mono if needed (faster-whisper works best with WAV).
        Uses ffmpeg if available, otherwise returns original path.
        """
        if audio_path.suffix.lower() == ".wav":
            return audio_path

        if shutil.which("ffmpeg"):
            wav_path = audio_path.with_suffix(".converted.wav")
            try:
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-i", str(audio_path),
                        "-ar", "16000", "-ac", "1", "-vn",
                        str(wav_path),
                    ],
                    capture_output=True,
                    check=True,
                    timeout=30,
                )
                logger.info("Converted audio to WAV: %s", wav_path)
                return wav_path
            except Exception as exc:
                logger.warning("ffmpeg conversion failed: %s — using original", exc)

        return audio_path

    def _transcribe_whisper(self, audio_path: Path) -> Optional[str]:
        """Transcribe using faster-whisper (local CPU inference)."""
        model = self._load_whisper()
        if model is None:
            return None

        try:
            processed_path = self._ensure_wav(audio_path)
            segments, info = model.transcribe(
                str(processed_path),
                beam_size=5,
                language=None,   # Auto-detect language
                vad_filter=True, # Voice activity detection — skip silence
                vad_parameters={"min_silence_duration_ms": 300},
            )

            text_parts = []
            for segment in segments:
                text_parts.append(segment.text.strip())

            transcript = " ".join(text_parts).strip()
            logger.info(
                "Whisper transcribed (lang=%s, %.1fs): %s chars",
                info.language, info.duration, len(transcript)
            )
            return transcript

        except Exception as exc:
            logger.warning("faster-whisper transcription error: %s", exc)
            return None

    def _transcribe_gemini(self, audio_path: Path) -> Optional[str]:
        """Fallback: transcribe via Gemini audio understanding."""
        try:
            from django.conf import settings
            import google.generativeai as genai

            if not settings.GEMINI_API_KEY:
                return None

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-3.6-flash")

            audio_bytes = audio_path.read_bytes()
            suffix = audio_path.suffix.lower()
            mime_map = {
                ".webm": "audio/webm",
                ".wav": "audio/wav",
                ".mp3": "audio/mpeg",
                ".ogg": "audio/ogg",
                ".m4a": "audio/mp4",
                ".aac": "audio/aac",
            }
            mime_type = mime_map.get(suffix, "audio/webm")

            response = model.generate_content([
                "Transcribe this audio recording verbatim. "
                "Return ONLY the transcription text, nothing else.",
                {"mime_type": mime_type, "data": audio_bytes},
            ])

            transcript = response.text.strip()
            logger.info("Gemini audio transcription: %d chars", len(transcript))
            return transcript

        except Exception as exc:
            logger.warning("Gemini audio transcription failed: %s", exc)
            return None

    def transcribe(self, audio_path: Path) -> str:
        """
        Main transcription entry point with fallback chain.

        Args:
            audio_path: Path to audio file (WebM/WAV/MP3/OGG/M4A)

        Returns:
            Transcribed text string, or empty string if all methods fail.
        """
        if not audio_path.exists():
            logger.error("Audio file not found: %s", audio_path)
            return ""

        file_size = audio_path.stat().st_size
        logger.info("Transcribing audio: %s (%d bytes)", audio_path.name, file_size)

        if file_size == 0:
            logger.warning("Empty audio file")
            return ""

        # --- Primary: faster-whisper ---
        transcript = self._transcribe_whisper(audio_path)
        if transcript:
            return transcript

        # --- Fallback: Gemini ---
        logger.info("Falling back to Gemini for audio transcription")
        transcript = self._transcribe_gemini(audio_path)
        if transcript:
            return transcript

        logger.warning("All transcription methods failed — returning empty string")
        return ""
