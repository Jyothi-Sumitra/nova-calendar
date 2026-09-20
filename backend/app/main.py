from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy knows about them
from app.models.event import Event, Base


from app.database.connection import engine
from app.database.events import router as events_router

from app.api.nova import router as nova_router

from app.services.speech import transcribe_audio


# Create database tables if they don't already exist.
# This does NOT modify existing tables.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Calendar Assistant",
    description="AI-powered calendar and scheduling assistant",
    version="1.0.0"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

app.include_router(events_router)
app.include_router(nova_router)


# ---------------------------------------------------------
# Basic routes
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "AI Calendar Assistant API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# NOVA Voice
# ---------------------------------------------------------

@app.post("/voice/transcribe")
async def transcribe_voice(audio: UploadFile = File(...)):
    """NOVA voice bridge used by the calendar assistant's microphone control."""

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail="Please upload an audio recording."
        )

    try:
        text = transcribe_audio(
            audio.file,
            filename=audio.filename or "voice.webm",
            content_type=audio.content_type,
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        ) from error

    except Exception as error:
        print("VOICE TRANSCRIPTION ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="NOVA could not transcribe this recording."
        ) from error

    return {
        "text": text
    }