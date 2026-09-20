from datetime import date, datetime, time, timedelta
import re
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.event import Event
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


def _date(value: str | None, now: datetime) -> date | None:
    if not value:
        return None
    value = value.strip().lower()
    if value == "today":
        return now.date()
    if value == "tomorrow":
        return (now + timedelta(days=1)).date()
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
    for pattern in ("%H:%M", "%H", "%I:%M %p", "%I %p"):
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
    }


def _matches(db: Session, query: str, user_id: UUID) -> list[Event]:
    words = [
        word
        for word in re.findall(r"[a-z0-9]+", query.lower())
        if len(word) > 2
        and word not in {"the", "my", "event", "appointment"}
    ]

    events = (
        db.query(Event)
        .filter(
            Event.user_id == user_id,
            Event.status != "cancelled",
        )
        .order_by(Event.start_time)
        .all()
    )

    exact = [
        event
        for event in events
        if event.title.lower() == query.strip().lower()
    ]
    if exact:
        return exact

    return [
        event
        for event in events
        if words and all(word in event.title.lower() for word in words)
    ]


def _ambiguous(events: list[Event]) -> dict:
    return {
        "ok": False,
        "status": "ambiguous",
        "message": "I found more than one matching event. Which one do you mean?",
        "events": [_event_payload(event) for event in events],
    }


def _free_slots_for_day(
    db: Session,
    day,
    user_id: UUID,
    now: datetime | None = None,
) -> list[dict]:
    day_start = datetime.combine(day, time.min)
    day_end = day_start + timedelta(days=1)

    events = (
        db.query(Event)
        .filter(
            Event.user_id == user_id,
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
        if start > cursor:
            free_slots.append({
                "start_time": cursor.isoformat(),
                "end_time": start.isoformat(),
            })
        cursor = max(cursor, end)

    if cursor < day_end:
        free_slots.append({
            "start_time": cursor.isoformat(),
            "end_time": day_end.isoformat(),
        })

    return free_slots


def execute_intent(
    db: Session,
    intent: CalendarIntent,
    user_id: UUID,
    now: datetime | None = None,
) -> dict:
    """Execute a validated NOVA intent only for the authenticated user."""

    now = now or datetime.now()

    if intent.intent == "UNKNOWN":
        return {
            "ok": False,
            "status": "unknown",
            "message": "I can view, create, reschedule, or delete calendar events. Please try phrasing that request again.",
        }

    if intent.intent == "GET_EVENTS":
        day = _date(intent.date, now)

        if intent.date and not day:
            return {
                "ok": False,
                "status": "invalid_date",
                "message": "I couldn't understand that date. Please use a date such as tomorrow or next Monday.",
            }

        query = db.query(Event).filter(
            Event.user_id == user_id,
            Event.status != "cancelled",
        )

        if day:
            start = datetime.combine(day, time.min)
            end = datetime.combine(day + timedelta(days=1), time.min)
            events = (
                query.filter(
                    Event.start_time < end,
                    Event.end_time > start,
                )
                .order_by(Event.start_time)
                .all()
            )
            label = f"{day:%A, %B} {day.day}"
        else:
            events = (
                query.filter(Event.end_time >= now)
                .order_by(Event.start_time)
                .all()
            )
            label = "upcoming"

        message = (
            f"You have no events {('on ' + label) if day else label}."
            if not events
            else f"Here {'is' if len(events) == 1 else 'are'} your {label} event{'s' if len(events) != 1 else ''}."
        )

        return {
            "ok": True,
            "status": "success",
            "message": message,
            "events": [_event_payload(event) for event in events],
        }

    if intent.intent == "GET_NEXT_EVENT":
        event = (
            db.query(Event)
            .filter(
                Event.user_id == user_id,
                Event.status != "cancelled",
                Event.start_time >= now,
            )
            .order_by(Event.start_time)
            .first()
        )

        if not event:
            return {
                "ok": True,
                "status": "success",
                "message": "You have no upcoming events.",
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

    if intent.intent == "GET_CONFLICTS":
        conflicts = find_all_conflicts(db, user_id=user_id)

        if not conflicts:
            return {
                "ok": True,
                "status": "success",
                "message": "You don't have any calendar conflicts.",
                "conflicts": [],
            }

        return {
            "ok": True,
            "status": "conflicts_found",
            "message": f"I found {len(conflicts)} calendar conflict{'s' if len(conflicts) != 1 else ''}.",
            "conflicts": conflicts,
        }

    if intent.intent == "GET_FREE_SLOTS":
        day = _date(intent.date, now)

        if intent.date and not day:
            return {
                "ok": False,
                "status": "invalid_date",
                "message": "I couldn't understand that date. Please use a date such as today, tomorrow, or next Monday.",
            }

        day = day or now.date()
        free_slots = _free_slots_for_day(db, day, user_id, now)
        label = f"{day:%A, %B} {day.day}"

        if not free_slots:
            return {
                "ok": True,
                "status": "success",
                "message": f"You don't have any free time on {label}.",
                "free_slots": [],
            }

        return {
            "ok": True,
            "status": "success",
            "message": f"Here are your available time slots on {label}.",
            "free_slots": free_slots,
        }

    if intent.intent == "CREATE_EVENT":
        day = _date(intent.date, now)
        start_clock = _time(intent.start_time)

        if not intent.title or not day or not start_clock:
            return {
                "ok": False,
                "status": "missing_details",
                "message": "I need an event title, date, and start time before I can create it.",
            }

        start = datetime.combine(day, start_clock)
        end_clock = _time(intent.end_time)
        end = (
            datetime.combine(day, end_clock)
            if end_clock
            else start + timedelta(minutes=intent.duration_minutes or 60)
        )

        if end <= start:
            return {
                "ok": False,
                "status": "invalid_time",
                "message": "The end time must be after the start time.",
            }

        conflict = get_conflict_details(
            db,
            start,
            end,
            user_id=user_id,
        )

        if conflict["has_conflict"]:
            return {
                "ok": False,
                "status": "conflict",
                "message": "I couldn't create that event because it conflicts with your calendar.",
                "conflicts": conflict["conflicts"],
            }

        event = Event(
            user_id=user_id,
            title=intent.title,
            start_time=start,
            end_time=end,
            category="meeting",
            priority="medium",
            status="scheduled",
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        return {
            "ok": True,
            "status": "created",
            "message": (
                f"Done. I've scheduled {event.title} for "
                f"{event.start_time.strftime('%I:%M %p').lstrip('0')}."
            ),
            "events": [_event_payload(event)],
            "changed": True,
        }

    if intent.intent in {"DELETE_EVENT", "RESCHEDULE_EVENT"}:
        if not intent.event_query:
            return {
                "ok": False,
                "status": "missing_event",
                "message": "Please tell me which event you mean.",
            }

        matches = _matches(db, intent.event_query, user_id)

        if not matches:
            return {
                "ok": False,
                "status": "not_found",
                "message": f"I couldn't find an event matching '{intent.event_query}'.",
            }

        if len(matches) > 1:
            return _ambiguous(matches)

        event = matches[0]

        if intent.intent == "DELETE_EVENT":
            title = event.title
            db.delete(event)
            db.commit()
            return {
                "ok": True,
                "status": "deleted",
                "message": f"Done. I've deleted {title}.",
                "changed": True,
            }

        day = _date(intent.date, now) or event.start_time.date()
        start_clock = _time(intent.start_time)

        if not start_clock:
            return {
                "ok": False,
                "status": "missing_details",
                "message": "I need the new start time to reschedule that event.",
            }

        start = datetime.combine(day, start_clock)
        end_clock = _time(intent.end_time)
        end = (
            datetime.combine(day, end_clock)
            if end_clock
            else start + (event.end_time - event.start_time)
        )

        if end <= start:
            return {
                "ok": False,
                "status": "invalid_time",
                "message": "The new end time must be after the new start time.",
            }

        conflict = get_conflict_details(
            db,
            start,
            end,
            exclude_event_id=event.id,
            user_id=user_id,
        )

        if conflict["has_conflict"]:
            return {
                "ok": False,
                "status": "conflict",
                "message": f"I couldn't move {event.title} because that time conflicts with your calendar.",
                "conflicts": conflict["conflicts"],
            }

        event.start_time = start
        event.end_time = end
        db.commit()
        db.refresh(event)

        return {
            "ok": True,
            "status": "rescheduled",
            "message": (
                f"Done. I've moved {event.title} to "
                f"{event.start_time.strftime('%I:%M %p').lstrip('0')}."
            ),
            "events": [_event_payload(event)],
            "changed": True,
        }

    return {
        "ok": False,
        "status": "unknown",
        "message": "I can view, create, reschedule, or delete calendar events. Please try again.",
    }
