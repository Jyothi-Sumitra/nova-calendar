from uuid import UUID
from datetime import datetime, time, timedelta
import re

from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.note import Note
from app.models.todo import Todo
from app.schemas.agent import CalendarIntent
from app.services.scheduling import (
    find_all_conflicts,
    get_conflict_details,
)

WEEKDAYS = {
    day.lower(): index
    for index, day in enumerate(
        ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
    )
}


def _date(value: str | None, now: datetime) -> datetime.date | None:
    if not value:
        return None
    value = value.strip().lower()
    if value == "today":
        return now.date()
    if value in {"tomorrow", "tmrw"}:
        return (now + timedelta(days=1)).date()
    if value in {"yesterday"}:
        return (now - timedelta(days=1)).date()
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        pass
    match = re.fullmatch(
        r"(?:next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
        value,
    )
    if match:
        target = WEEKDAYS[match.group(1)]
        days = (target - now.weekday()) % 7
        if value.startswith("next "):
            days = days or 7
        return (now + timedelta(days=days)).date()
    return None


def _time(value: str | None) -> time | None:
    if not value:
        return None
    value = value.strip().lower().replace(".", "")

    # Common time aliases
    if value in {"morning"}:
        return time(9, 0)
    if value in {"noon", "midday", "lunch"}:
        return time(12, 30)
    if value in {"afternoon"}:
        return time(14, 0)
    if value in {"evening"}:
        return time(18, 0)
    if value in {"night", "tonight"}:
        return time(19, 30)

    for pattern in ("%H:%M", "%H", "%I:%M %p", "%I %p", "%I%p"):
        try:
            return datetime.strptime(value, pattern).time()
        except ValueError:
            continue
    return None


def _event_payload(event: Event) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "location": event.location,
        "category": event.category,
        "priority": event.priority,
    }


def _format_time(val) -> str:
    """Format datetime, time, or ISO string to human-friendly 12-hour format."""
    if not val:
        return ""
    if isinstance(val, datetime):
        return val.strftime("%I:%M %p").lstrip("0")
    if isinstance(val, time):
        return val.strftime("%I:%M %p").lstrip("0")
    if isinstance(val, str):
        if "T" in val:
            try:
                return datetime.fromisoformat(val).strftime("%I:%M %p").lstrip("0")
            except Exception:
                return val[11:16]
        return val
    return str(val)


def _clean_conflict(c: dict) -> dict:
    """Serialize raw datetime objects in conflict dicts for JSON safety."""
    s = c.get("start_time")
    e = c.get("end_time")
    return {
        "event_id": c.get("event_id") or c.get("id"),
        "title": c.get("title", "Event"),
        "start_time": s.isoformat() if isinstance(s, datetime) else str(s or ""),
        "end_time": e.isoformat() if isinstance(e, datetime) else str(e or ""),
    }


def _find_matching_event(
    db: Session,
    query: str | None,
    target_date: datetime.date | None = None,
    target_time: time | None = None,
    now: datetime | None = None,
) -> list[Event]:
    """Smartly match events by keyword, time of day, relative position (next/last), or date."""
    now = now or datetime.now()
    events = (
        db.query(Event)
        .filter(Event.status != "cancelled")
        .order_by(Event.start_time)
        .all()
    )
    if not events:
        return []

    query_str = (query or "").strip().lower()

    # 1. Relative keyword: next
    if query_str in {"next", "next meeting", "next event", "upcoming"}:
        future_events = [e for e in events if e.start_time >= now]
        return [future_events[0]] if future_events else [events[0]]

    # 2. Relative keyword: last / most recent
    if query_str in {"last", "last meeting", "last event", "previous", "most recent"}:
        by_id = sorted(events, key=lambda e: e.id, reverse=True)
        return [by_id[0]]

    # 3. Time-based matching (e.g. user says "cancel my 2pm" or "the meeting at 14:00")
    clock = target_time
    if not clock and query_str:
        clock = _time(query_str)
        if not clock:
            time_match = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)", query_str)
            if time_match:
                clock = _time(time_match.group(1))

    if clock:
        time_matches = []
        for e in events:
            if target_date and e.start_time.date() != target_date:
                continue
            if e.start_time.hour == clock.hour and (
                clock.minute == 0 or abs(e.start_time.minute - clock.minute) <= 15
            ):
                time_matches.append(e)
        if time_matches:
            return time_matches

    # 4. Exact title match
    if query_str:
        exact = [e for e in events if e.title.lower() == query_str]
        if exact:
            return exact

        # Keyword / token overlap match
        ignore_words = {
            "the",
            "my",
            "event",
            "appointment",
            "meeting",
            "with",
            "call",
            "at",
            "on",
        }
        words = [
            w
            for w in re.findall(r"[a-z0-9]+", query_str)
            if len(w) > 2 and w not in ignore_words
        ]
        if words:
            matching = [
                e
                for e in events
                if any(w in e.title.lower() for w in words)
            ]
            if matching:
                return matching

    # 5. Fallback: single event on target date
    if target_date:
        date_events = [e for e in events if e.start_time.date() == target_date]
        if len(date_events) == 1:
            return date_events

    return []


def _free_slots_for_day(
    db: Session, day: datetime.date, now: datetime | None = None
) -> list[dict]:
    """Return available time gaps between 08:00 and 20:00 for a calendar day."""
    day_start = datetime.combine(day, time(8, 0))
    day_end = datetime.combine(day, time(20, 0))

    events = (
        db.query(Event)
        .filter(
            Event.status != "cancelled",
            Event.start_time < day_end,
            Event.end_time > day_start,
        )
        .order_by(Event.start_time)
        .all()
    )

    busy_periods = []
    for event in events:
        start = max(event.start_time, day_start)
        end = min(event.end_time, day_end)
        if end > start:
            busy_periods.append((start, end))

    merged = []
    for start, end in busy_periods:
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)

    free_slots = []
    cursor = day_start
    if now and day == now.date():
        cursor = max(cursor, now)

    for start, end in merged:
        if start > cursor and (start - cursor) >= timedelta(minutes=20):
            free_slots.append({
                "start_time": cursor.isoformat(),
                "end_time": start.isoformat(),
            })
        cursor = max(cursor, end)

    if cursor < day_end and (day_end - cursor) >= timedelta(minutes=20):
        free_slots.append({
            "start_time": cursor.isoformat(),
            "end_time": day_end.isoformat(),
        })

    return free_slots


def execute_intent(
    db: Session,
    intent: CalendarIntent,
    user_id: UUID | None = None,
    now: datetime | None = None,
) -> dict:
    """Execute validated NOVA intent with smart zero-friction execution and helpful fallbacks."""
    now = now or datetime.now()

    # 1. CHAT
    if intent.intent == "CHAT":
        msg = (
            intent.message
            or "Hello! I'm NOVA, your executive calendar assistant. Ask me to schedule, reschedule, check free time, resolve conflicts, or manage your to-dos!"
        )
        return {"ok": True, "status": "success", "message": msg}

    # 2. UNKNOWN
    if intent.intent == "UNKNOWN":
        return {
            "ok": True,
            "status": "help",
            "message": (
                intent.message
                or "I'm ready to help! You can say things like 'Schedule gym tomorrow at 9am', 'When am I free today?', 'Move my 2pm meeting to 4', or 'Remind me to buy groceries'."
            ),
        }

    # 3. GET_EVENTS
    if intent.intent == "GET_EVENTS":
        day = _date(intent.date, now)
        if day:
            start, end = (
                datetime.combine(day, time.min),
                datetime.combine(day + timedelta(days=1), time.min),
            )
            events = (
                db.query(Event)
                .filter(
                    Event.status != "cancelled",
                    Event.start_time < end,
                    Event.end_time > start,
                )
                .order_by(Event.start_time)
                .all()
            )
            label = f"{day:%A, %B} {day.day}"
        else:
            events = (
                db.query(Event)
                .filter(Event.status != "cancelled", Event.end_time >= now)
                .order_by(Event.start_time)
                .all()
            )
            label = "upcoming"

        if not events:
            message = f"You have no events {('on ' + label) if day else 'coming up'}."
        else:
            event_titles = ", ".join(
                [f"{e.title} ({e.start_time.strftime('%I:%M %p').lstrip('0')})" for e in events[:4]]
            )
            message = f"You have {len(events)} event{'s' if len(events) != 1 else ''} {('on ' + label) if day else 'upcoming'}: {event_titles}."

        return {
            "ok": True,
            "status": "success",
            "message": message,
            "events": [_event_payload(event) for event in events],
        }

    # 4. GET_NEXT_EVENT
    if intent.intent == "GET_NEXT_EVENT":
        event = (
            db.query(Event)
            .filter(Event.status != "cancelled", Event.start_time >= now)
            .order_by(Event.start_time)
            .first()
        )
        if not event:
            return {
                "ok": True,
                "status": "success",
                "message": "You have no upcoming events on your schedule.",
                "events": [],
            }
        return {
            "ok": True,
            "status": "success",
            "message": (
                f"Your next event is {event.title} at "
                f"{event.start_time.strftime('%I:%M %p').lstrip('0')} on "
                f"{event.start_time:%A, %B} {event.start_time.day}."
            ),
            "events": [_event_payload(event)],
        }

    # 5. GET_CONFLICTS
    if intent.intent == "GET_CONFLICTS":
        conflicts = find_all_conflicts(db)
        if not conflicts:
            return {
                "ok": True,
                "status": "success",
                "message": "Great news! You don't have any calendar conflicts.",
                "conflicts": [],
            }

        cleaned = []
        for c in conflicts:
            cleaned.append({
                "event_a": _clean_conflict(c["event_a"]),
                "event_b": _clean_conflict(c["event_b"]),
            })
        return {
            "ok": True,
            "status": "conflicts_found",
            "message": f"I found {len(conflicts)} calendar conflict{'s' if len(conflicts) != 1 else ''} to resolve.",
            "conflicts": cleaned,
        }

    # 6. GET_FREE_SLOTS
    if intent.intent == "GET_FREE_SLOTS":
        day = _date(intent.date, now) or now.date()
        free_slots = _free_slots_for_day(db, day, now)
        label = f"{day:%A, %B} {day.day}"
        if not free_slots:
            return {
                "ok": True,
                "status": "success",
                "message": f"You don't have any open time gaps on {label}.",
                "free_slots": [],
            }
        first_two = [
            f"{datetime.fromisoformat(s['start_time']).strftime('%I:%M %p').lstrip('0')} - {datetime.fromisoformat(s['end_time']).strftime('%I:%M %p').lstrip('0')}"
            for s in free_slots[:2]
        ]
        return {
            "ok": True,
            "status": "success",
            "message": f"Here is your open availability on {label}: {', '.join(first_two)}.",
            "free_slots": free_slots,
        }

    # 7. CREATE_EVENT
    if intent.intent == "CREATE_EVENT":
        title = intent.title or intent.event_query or "Scheduled Event"
        day = _date(intent.date, now)
        start_clock = _time(intent.start_time)
        time_inferred = False

        # If day is omitted, pick today or tomorrow
        if not day:
            if start_clock and datetime.combine(now.date(), start_clock) > now:
                day = now.date()
            elif start_clock:
                day = now.date() + timedelta(days=1)
            else:
                day = now.date()

        # If time is omitted, find the first comfortable opening on that day!
        if not start_clock:
            free = _free_slots_for_day(db, day, now)
            if free:
                first_free_dt = datetime.fromisoformat(free[0]["start_time"])
                start_clock = first_free_dt.time()
                time_inferred = True
            else:
                start_clock = time(10, 0)
                time_inferred = True

        start = datetime.combine(day, start_clock)
        end_clock = _time(intent.end_time)
        duration = intent.duration_minutes or 60
        end = datetime.combine(day, end_clock) if end_clock else start + timedelta(minutes=duration)

        if end <= start:
            end = start + timedelta(minutes=duration)

        # Conflict check
        conflict = get_conflict_details(db, start, end)
        if conflict["has_conflict"]:
            free_slots = _free_slots_for_day(db, day, now)
            formatted_conflicts = [_clean_conflict(c) for c in conflict["conflicts"]]
            conflicting_names = ", ".join(
                [
                    f'"{c.get("title", "Event")}" ({_format_time(c.get("start_time"))} ΓÇô {_format_time(c.get("end_time"))})'
                    for c in conflict["conflicts"]
                ]
            )
            msg = f"That conflicts with {conflicting_names}."
            if free_slots:
                first_alt = _format_time(free_slots[0]["start_time"])
                msg += f" I found an opening at {first_alt}. Would you like me to book it then?"
            else:
                msg += " There are no other open slots on that day."
            return {
                "ok": False,
                "status": "conflict",
                "message": msg,
                "conflicts": formatted_conflicts,
                "free_slots": free_slots[:3],
            }

        event = Event(
            user_id=user_id or UUID("00000000-0000-0000-0000-000000000001"),
            title=title,
            start_time=start,
            end_time=end,
            category=intent.category or "meeting",
            priority=intent.priority or "medium",
            status="scheduled",
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        inferred_note = " (in an open slot)" if time_inferred else ""
        return {
            "ok": True,
            "status": "created",
            "message": (
                f"Done! I've scheduled {event.title} for {day.strftime('%A, %b %d')} at "
                f"{event.start_time.strftime('%I:%M %p').lstrip('0')}{inferred_note}."
            ),
            "events": [_event_payload(event)],
            "changed": True,
        }

    # 8. RESCHEDULE_EVENT
    if intent.intent == "RESCHEDULE_EVENT":
        target_day = _date(intent.date, now)
        target_clock = _time(intent.start_time)
        matches = _find_matching_event(db, intent.event_query, target_day, target_clock, now)

        if not matches:
            return {
                "ok": False,
                "status": "not_found",
                "message": f"I couldn't locate an event matching '{intent.event_query or 'that meeting'}'. Which event would you like to move?",
            }
        if len(matches) > 1:
            return {
                "ok": False,
                "status": "ambiguous",
                "message": f"I found {len(matches)} possible events. Which one did you mean?",
                "events": [_event_payload(e) for e in matches],
            }

        event = matches[0]
        new_day = target_day or event.start_time.date()
        new_start_clock = target_clock or event.start_time.time()
        start = datetime.combine(new_day, new_start_clock)
        duration = event.end_time - event.start_time
        end = start + duration

        conflict = get_conflict_details(db, start, end, exclude_event_id=event.id)
        if conflict["has_conflict"]:
            free_slots = _free_slots_for_day(db, new_day, now)
            formatted_conflicts = [_clean_conflict(c) for c in conflict["conflicts"]]
            conflicting_names = ", ".join(
                [
                    f'"{c.get("title", "Event")}" ({_format_time(c.get("start_time"))} ΓÇô {_format_time(c.get("end_time"))})'
                    for c in conflict["conflicts"]
                ]
            )
            msg = f"I couldn't move {event.title} to {_format_time(start)} because it conflicts with {conflicting_names}."
            if free_slots:
                first_alt = _format_time(free_slots[0]["start_time"])
                msg += f" I found an opening at {first_alt} instead."
            return {
                "ok": False,
                "status": "conflict",
                "message": msg,
                "conflicts": formatted_conflicts,
                "free_slots": free_slots[:3],
            }

        event.start_time = start
        event.end_time = end
        db.commit()
        db.refresh(event)

        return {
            "ok": True,
            "status": "rescheduled",
            "message": f"Done! I've moved {event.title} to {new_day.strftime('%A, %b %d')} at {event.start_time.strftime('%I:%M %p').lstrip('0')}.",
            "events": [_event_payload(event)],
            "changed": True,
        }

    # 9. DELETE_EVENT
    if intent.intent == "DELETE_EVENT":
        target_day = _date(intent.date, now)
        target_clock = _time(intent.start_time)
        matches = _find_matching_event(db, intent.event_query, target_day, target_clock, now)

        if not matches:
            return {
                "ok": False,
                "status": "not_found",
                "message": f"I couldn't find an event matching '{intent.event_query or 'that'}'. Which event should I cancel?",
            }
        if len(matches) > 1:
            return {
                "ok": False,
                "status": "ambiguous",
                "message": f"I found {len(matches)} matching events. Which one would you like to delete?",
                "events": [_event_payload(e) for e in matches],
            }

        event = matches[0]
        title = event.title
        db.delete(event)
        db.commit()

        return {
            "ok": True,
            "status": "deleted",
            "message": f"Done. I've cancelled \"{title}\" from your calendar.",
            "changed": True,
        }

    # 10. CLEAR_DAY
    if intent.intent == "CLEAR_DAY":
        day = _date(intent.date, now) or now.date()
        start = datetime.combine(day, time.min)
        end = start + timedelta(days=1)
        events = (
            db.query(Event)
            .filter(
                Event.status != "cancelled",
                Event.start_time < end,
                Event.end_time > start,
            )
            .all()
        )
        if not events:
            return {
                "ok": True,
                "status": "success",
                "message": f"Your schedule for {day.strftime('%A, %b %d')} is already clear.",
                "events": [],
            }
        count = len(events)
        for e in events:
            db.delete(e)
        db.commit()
        return {
            "ok": True,
            "status": "success",
            "message": f"I've cleared your schedule for {day.strftime('%A, %b %d')} (removed {count} event{'s' if count != 1 else ''}).",
            "changed": True,
        }

    # 11. DAILY_BRIEFING
    if intent.intent == "DAILY_BRIEFING":
        day = _date(intent.date, now) or now.date()
        start = datetime.combine(day, time.min)
        end = start + timedelta(days=1)
        events = (
            db.query(Event)
            .filter(
                Event.status != "cancelled",
                Event.start_time < end,
                Event.end_time > start,
            )
            .order_by(Event.start_time)
            .all()
        )
        todos = (
            db.query(Todo)
            .filter(Todo.completed == False)
            .order_by(Todo.due_date.asc().nullslast())
            .all()
        )
        conflicts = find_all_conflicts(db)
        free_slots = _free_slots_for_day(db, day, now)

        day_label = "today" if day == now.date() else f"on {day.strftime('%A, %b %d')}"
        parts = []
        if events:
            e_strs = [
                f"{e.title} at {e.start_time.strftime('%I:%M %p').lstrip('0')}"
                for e in events[:3]
            ]
            parts.append(f"You have {len(events)} event{'s' if len(events) != 1 else ''} {day_label}: {', '.join(e_strs)}.")
        else:
            parts.append(f"Your calendar is completely open {day_label}.")

        if conflicts:
            parts.append(f"ΓÜá∩╕Å You have {len(conflicts)} conflict{'s' if len(conflicts) != 1 else ''} to resolve.")

        if todos:
            parts.append(f"You have {len(todos)} pending tasks (top priority: \"{todos[0].title}\").")

        if free_slots:
            s_time = datetime.fromisoformat(free_slots[0]["start_time"]).strftime("%I:%M %p").lstrip("0")
            e_time = datetime.fromisoformat(free_slots[0]["end_time"]).strftime("%I:%M %p").lstrip("0")
            parts.append(f"Next open window: {s_time} ΓÇô {e_time}.")

        return {
            "ok": True,
            "status": "success",
            "message": " ".join(parts),
            "events": [_event_payload(e) for e in events],
            "free_slots": free_slots[:2],
            "todos": [{"id": t.id, "title": t.title} for t in todos[:3]],
        }

    # 12. CREATE_TODO
    if intent.intent == "CREATE_TODO":
        title = intent.title or intent.event_query or "New Task"
        due_date = None
        if intent.date:
            d = _date(intent.date, now)
            if d:
                t = _time(intent.start_time) or time(17, 0)
                due_date = datetime.combine(d, t)
        todo = Todo(
            title=title,
            description=intent.content,
            priority=(intent.priority or "medium").lower(),
            category=intent.category or "work",
            due_date=due_date,
        )
        db.add(todo)
        db.commit()
        db.refresh(todo)
        due_str = f" due {todo.due_date.strftime('%b %d')}" if todo.due_date else ""
        return {
            "ok": True,
            "status": "success",
            "message": f"I've added \"{todo.title}\"{due_str} to your to-do deliverables.",
            "changed": True,
        }

    # 13. GET_TODOS
    if intent.intent == "GET_TODOS":
        todos = (
            db.query(Todo)
            .filter(Todo.completed == False)
            .order_by(Todo.due_date.asc().nullslast())
            .all()
        )
        if not todos:
            return {
                "ok": True,
                "status": "success",
                "message": "All caught up! You have no pending tasks on your to-do list.",
                "todos": [],
            }
        titles = ", ".join([f'"{t.title}"' for t in todos[:5]])
        return {
            "ok": True,
            "status": "success",
            "message": f"You have {len(todos)} pending task{'s' if len(todos) != 1 else ''}: {titles}.",
            "todos": [{"id": t.id, "title": t.title, "priority": t.priority} for t in todos],
        }

    # 14. COMPLETE_TODO
    if intent.intent == "COMPLETE_TODO":
        query = (intent.title or intent.event_query or "").strip().lower()
        todos = db.query(Todo).filter(Todo.completed == False).all()
        if not todos:
            return {
                "ok": True,
                "status": "success",
                "message": "You don't have any pending tasks right now.",
            }
        target = None
        for t in todos:
            if query and query in t.title.lower():
                target = t
                break
        if not target and todos:
            target = todos[0]

        target.completed = True
        db.commit()
        return {
            "ok": True,
            "status": "success",
            "message": f"Great job! I've marked \"{target.title}\" as completed. ≡ƒÄë",
            "changed": True,
        }

    # 15. CREATE_NOTE
    if intent.intent == "CREATE_NOTE":
        title = intent.title or intent.event_query or "Quick Note"
        content = intent.content or ""
        note = Note(title=title, content=content, category=intent.category or "general")
        db.add(note)
        db.commit()
        db.refresh(note)
        return {
            "ok": True,
            "status": "success",
            "message": f"I've saved your note: \"{note.title}\".",
            "changed": True,
        }

    # 16. GET_NOTES
    if intent.intent == "GET_NOTES":
        notes = (
            db.query(Note)
            .order_by(Note.is_pinned.desc(), Note.updated_at.desc())
            .limit(10)
            .all()
        )
        if not notes:
            return {
                "ok": True,
                "status": "success",
                "message": "You don't have any notes saved yet.",
                "notes": [],
            }
        titles = ", ".join([f'"{n.title}"' for n in notes[:5]])
        return {
            "ok": True,
            "status": "success",
            "message": f"You have {len(notes)} note{'s' if len(notes) != 1 else ''}: {titles}.",
            "notes": [{"id": n.id, "title": n.title} for n in notes],
        }

    return {
        "ok": True,
        "status": "success",
        "message": "I've processed your request.",
    }
