# NOVA Calendar 🤖📅

> **NOVA** is a voice-powered AI calendar assistant that lets you manage your schedule using natural language instead of wrestling with forms and menus.

NOVA combines a React calendar interface, FastAPI backend, Supabase authentication and PostgreSQL, speech-to-text, and an LLM-powered intent layer to turn requests such as:

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

Example requests:

```
"What do I have tomorrow?"
"Add a gym session tomorrow at 5 PM."
"Move my study schedule to 7 PM."
"Delete my gym event."
"Can I schedule a meeting at 6 PM?"
```

### 🔐 Authentication

NOVA uses **Supabase Auth**.

Current login methods:
- Email/password
- Google OAuth

Each authenticated user receives a Supabase user ID, which is used to scope calendar data.

### 📅 User-specific calendars

Events belong to the authenticated user. The backend scopes listing, creation, updates, deletion, conflict checks, free-slot checks, and NOVA commands to that user's UUID.

### ⚡ Conflict detection

Before creating or rescheduling an event, NOVA checks the user's existing schedule so overlapping events can be handled instead of blindly created.

### 🗄️ Supabase PostgreSQL

Production calendar data is stored in PostgreSQL through Supabase. Local development can use SQLite through SQLAlchemy.

### 🖥️ Interactive calendar UI

The React frontend provides a visual calendar while NOVA provides a natural-language interface over the same calendar data.

## 🧠 Architecture

```
                    ┌─────────────────────┐
                    │      User           │
                    │  Voice / Text       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │  Calendar + NOVA UI │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             Voice endpoint        Calendar API
                    │                     │
                    ▼                     │
              Speech-to-text             │
                    │                     │
                    ▼                     │
              NOVA LLM layer             │
                    │                     │
                    ▼                     ▼
              Intent extraction ──► Calendar Service
                                         │
                                         ▼
                                  SQLAlchemy ORM
                                         │
                                         ▼
                                  Supabase PostgreSQL
```

The LLM understands the user's request and produces a structured calendar intent. It does **not** directly execute SQL. Backend calendar services remain the source of truth for ownership checks, conflict detection, validation, and database changes.

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

## 📂 Project Structure

```
nova-calendar/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── calendar_agent.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── events.py
│   │   │   └── nova.py
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── events.py
│   │   ├── models/
│   │   │   ├── event.py
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   ├── event.py
│   │   │   └── agent.py
│   │   └── services/
│   │       ├── scheduling.py
│   │       ├── nova.py
│   │       └── speech.py
│   ├── requirements.txt
│   └── ...
│
└── README.md
```

## 🔐 Authentication Flow

```
Browser
   ↓
Supabase session
   ↓
Authorization: Bearer <access token>
   ↓
FastAPI
   ↓
Supabase Auth validation
   ↓
Authenticated user UUID
   ↓
User-scoped calendar operation
```

Google OAuth is handled by Supabase Auth, so NOVA does not implement Google's OAuth protocol directly.

## 🧩 NOVA Intent Layer

Natural-language requests are converted into structured intents:

```
GET_EVENTS
GET_NEXT_EVENT
CREATE_EVENT
RESCHEDULE_EVENT
DELETE_EVENT
UNKNOWN
```

Example:

```json
{
  "intent": "CREATE_EVENT",
  "title": "Gym",
  "date": "2026-09-21",
  "start_time": "17:00",
  "duration_minutes": 60
}
```

The backend passes the structured intent to controlled calendar services.

## 🛡️ Security Design

NOVA follows a backend-controlled architecture.

```
User request
    ↓
LLM
    ↓
Structured intent
    ↓
Validated backend service
    ↓
Authenticated user scope
    ↓
Database operation
```

Calendar endpoints require an authenticated Supabase access token, and event queries are filtered using the authenticated user's UUID.

Secrets such as API keys and database credentials should be stored in environment variables and never committed to the repository.

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

## 🌐 Production

Production frontend:

https://nova-calendar.vercel.app

Vercel routes `/api/*` requests to the FastAPI backend and serves the React application for frontend routes.

## 🗺️ Roadmap

- [ ] Recurring events
- [ ] Richer natural-language date/time handling
- [ ] Calendar day and agenda views
- [ ] Improved event search
- [ ] More detailed voice feedback
- [ ] Notifications and reminders
- [ ] Time-zone-aware scheduling
- [ ] Calendar integrations
- [ ] Smarter free-time planning
- [ ] Mobile-friendly experience

## 💡 Why NOVA?

Traditional calendar applications make users translate their intentions into forms: title, date, start time, end time, location, save.

NOVA flips that interaction around.

The user describes **what they want**, and the assistant translates it into a structured, validated calendar operation.

That makes the calendar feel less like a database form and more like a conversation.

## 👩‍💻 Author

**Jyothi Sumitra**

GitHub: https://github.com/Jyothi-Sumitra

## 📄 License

Add the project's preferred license here when one is selected.
