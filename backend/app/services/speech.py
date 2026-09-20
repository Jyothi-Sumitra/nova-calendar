import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()


def transcribe_audio(audio_file, filename: str = "voice.webm", content_type: str = "audio/webm") -> str:
    """Transcribe a browser-recorded audio file with NOVA's Whisper service."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    client = Groq(api_key=api_key)
    transcription = client.audio.transcriptions.create(
        file=(filename, audio_file, content_type),
        model="whisper-large-v3-turbo",
        language="en",
        response_format="json",
        temperature=0.0,
    )
    return transcription.text
