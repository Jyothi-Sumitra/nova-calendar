from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.event import Event


def check_conflict(
    db: Session,
    start_time: datetime,
    end_time: datetime,
    exclude_event_id: int | None = None,
    user_id: UUID | None = None,
) -> list[Event]:
    """Find overlapping events belonging to the authenticated user."""

    query = db.query(Event).filter(
        Event.status != "cancelled",
        Event.start_time < end_time,
        Event.end_time > start_time,
    )

    if user_id is not None:
        query = query.filter(Event.user_id == user_id)

    if exclude_event_id is not None:
        query = query.filter(Event.id != exclude_event_id)

    return query.all()


def get_conflict_details(
    db: Session,
    start_time: datetime,
    end_time: datetime,
    exclude_event_id: int | None = None,
    user_id: UUID | None = None,
) -> dict:
    conflicts = check_conflict(
        db=db,
        start_time=start_time,
        end_time=end_time,
        exclude_event_id=exclude_event_id,
        user_id=user_id,
    )

    return {
        "has_conflict": len(conflicts) > 0,
        "conflicts": [
            {
                "event_id": event.id,
                "title": event.title,
                "start_time": event.start_time,
                "end_time": event.end_time,
            }
            for event in conflicts
        ],
    }


def find_all_conflicts(
    db: Session,
    user_id: UUID | None = None,
) -> list[dict]:
    query = (
        db.query(Event)
        .filter(Event.status != "cancelled")
        .order_by(Event.start_time)
    )

    if user_id is not None:
        query = query.filter(Event.user_id == user_id)

    events = query.all()

    conflicts = []

    for i, event_a in enumerate(events):
        for event_b in events[i + 1:]:
            if event_b.start_time >= event_a.end_time:
                break

            if (
                event_a.start_time < event_b.end_time
                and event_a.end_time > event_b.start_time
            ):
                conflicts.append({
                    "event_a": {
                        "id": event_a.id,
                        "title": event_a.title,
                        "start_time": event_a.start_time,
                        "end_time": event_a.end_time,
                    },
                    "event_b": {
                        "id": event_b.id,
                        "title": event_b.title,
                        "start_time": event_b.start_time,
                        "end_time": event_b.end_time,
                    },
                })

    return conflicts


def find_free_slots(
    db: Session,
    window_start: datetime,
    window_end: datetime,
    duration_minutes: int,
    user_id: UUID | None = None,
) -> list[dict]:
    query = (
        db.query(Event)
        .filter(
            Event.status != "cancelled",
            Event.start_time < window_end,
            Event.end_time > window_start,
        )
        .order_by(Event.start_time)
    )

    if user_id is not None:
        query = query.filter(Event.user_id == user_id)

    events = query.all()

    duration = timedelta(minutes=duration_minutes)
    slots = []
    current_time = window_start

    for event in events:
        if current_time + duration <= event.start_time:
            slots.append({
                "start_time": current_time,
                "end_time": current_time + duration
            })

        if event.end_time > current_time:
            current_time = event.end_time

    if current_time + duration <= window_end:
        slots.append({
            "start_time": current_time,
            "end_time": current_time + duration
        })

    return slots
