import sys
from pathlib import Path

# Ensure the backend directory is in sys.path so 'app' imports work in all execution environments (e.g. Vercel)
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# Import models so SQLAlchemy knows about them
from app.models.event import Event, Base
from app.models.note import Note
from app.models.todo import Todo
from app.models.habit import Habit
from app.models.user import User

from app.database.connection import engine
from app.database.events import router as events_router
from app.api.nova import router as nova_router
from app.api.notes import router as notes_router
from app.api.todos import router as todos_router
from app.api.habits import router as habits_router
from app.services.speech import transcribe_audio

app = FastAPI(
    title="AI Calendar Assistant",
    description="AI-powered calendar, notes, to-dos and scheduling assistant",
    version="1.0.0",
)

@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as _db_err:
        print("Database table initialization notice:", repr(_db_err))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nova-calendar.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel routes /api/* to the backend service without stripping /api.
# Keep the same /api prefix in FastAPI so production and local frontend calls match.
app.include_router(events_router, prefix="/api")
app.include_router(nova_router, prefix="/api")
app.include_router(notes_router, prefix="/api")
app.include_router(todos_router, prefix="/api")
app.include_router(habits_router, prefix="/api")

# Also include without prefix for direct root access
app.include_router(events_router)
app.include_router(nova_router)
app.include_router(notes_router)
app.include_router(todos_router)
app.include_router(habits_router)


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
@app.post("/voice/transcribe")
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
