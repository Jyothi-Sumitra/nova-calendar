from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine
from app.database.events import router as events_router
from app.api.nova import router as nova_router
from app.services.speech import transcribe_audio

app = FastAPI(
    title="AI Calendar Assistant",
    description="AI-powered calendar and scheduling assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nova-calendar.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel routes /api/* to the backend service without stripping /api.
# Keep the same /api prefix in FastAPI so production and local frontend calls match.
app.include_router(events_router, prefix="/api")
app.include_router(nova_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "AI Calendar Assistant API is running!"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/health/db")
def database_health_check():
    """Temporary production diagnostic for the active SQLAlchemy database."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database_driver": engine.url.drivername,
            "database_name": engine.url.database,
        }
    except Exception as error:
        return {
            "status": "unhealthy",
            "database_driver": engine.url.drivername,
            "error_type": type(error).__name__,
            "error": str(error),
        }


@app.post("/api/voice/transcribe")
async def transcribe_voice(audio: UploadFile = File(...)):
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail="Please upload an audio recording.",
        )

    try:
        text = transcribe_audio(
            audio.file,
            filename=audio.filename or "voice.webm",
            content_type=audio.content_type,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        print("VOICE TRANSCRIPTION ERROR:", repr(error))
        raise HTTPException(
            status_code=502,
            detail="NOVA could not transcribe this recording.",
        ) from error

    return {"text": text}
