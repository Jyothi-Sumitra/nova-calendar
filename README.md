# NOVA Calendar 🤖📅

**NOVA** is a voice-powered AI calendar assistant that lets you manage your schedule using natural language instead of wrestling with forms and menus.

🔗 Live Link: https://nova-calendar.vercel.app/

NOVA can converts a LLM-powered intent layer to turn requests such as:

- “What do I have tomorrow?”
- “Schedule gym at 6 PM.”
- “Move my study session to 8 PM.”
- “Delete my meeting tomorrow.”
- “Do I have anything at 5 PM?”

into controlled calendar operations.

## ✨ Features

### 🎙️ Natural-language voice assistant

Speak to NOVA instead of manually filling out event forms.

```
Voice input
    ↓
Speech-to-text
    ↓
Natural-language transcript
    ↓
NOVA intent extraction
    ↓
Calendar service
    ↓
Database
    ↓
Calendar + NOVA response
```

### 💬 Calendar commands

NOVA supports:
- **Get events**
- **Get the next event**
- **Create events**
- **Reschedule events**
- **Delete events**
- **Conflict-aware scheduling**

### 📅 User-specific calendars

Events belong to the authenticated user. The backend scopes listing, creation, updates, deletion, conflict checks, free-slot checks, and NOVA commands to that user's UUID.

### ⚡ Conflict detection

Before creating or rescheduling an event, NOVA checks the user's existing schedule so overlapping events can be handled instead of blindly created.

### 🗄️ Supabase PostgreSQL

Production calendar data is stored in PostgreSQL through Supabase. Local development can use SQLite through SQLAlchemy.

### 🖥️ Interactive calendar UI

The React frontend provides a visual calendar while NOVA provides a natural-language interface over the same calendar data.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Supabase JavaScript client

### Backend
- FastAPI
- Python
- SQLAlchemy
- Pydantic
- Uvicorn

### AI
- Groq
- Whisper speech-to-text
- LLM-based calendar intent extraction

### Database & Authentication
- Supabase
- PostgreSQL
- Supabase Auth
- SQLAlchemy

### Deployment
- Vercel

## ⚙️ Local Development

### 1. Clone

```bash
git clone https://github.com/Jyothi-Sumitra/nova-calendar.git
cd nova-calendar
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Backend

```bash
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Configure the backend environment variables required by the application, including database and AI service credentials.

### 4. Run frontend

From `frontend/`:

```bash
npm run dev
```

The Vite development server normally runs on `http://localhost:5173`.

## 💡 Why NOVA?

Traditional calendar applications make users translate their intentions into forms: title, date, start time, end time, location, save.

NOVA flips that interaction around.

The user describes **what they want**, and the assistant translates it into a structured, validated calendar operation.
That makes the calendar feel less like a database form and more like a conversation.

## 👩‍💻 Author

**Jyothi Sumitra**

LinkedIn: https://www.linkedin.com/in/jyothi-sumitra-vaddi-208971356/

GitHub: https://github.com/Jyothi-Sumitra
