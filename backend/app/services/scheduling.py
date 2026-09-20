from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.event import Event


def check_conflict(
    db: Session,
    start_time: datetime,
    end_time: datetime,
    exclude_event_id: int | None = None
) -> list[Event]:
    """
    Find existing events that overlap with the requested time range.
    """

    query = db.query(Event).filter(
        Event.status != "cancelled",
        Event.start_time < end_time,
        Event.end_time > start_time,
    )

    # When updating an existing event, don't compare it with itself.
    if exclude_event_id is not None:
        query = query.filter(Event.id != exclude_event_id)

    return query.all()

def get_conflict_details(
    db: Session,
    start_time: datetime,
    end_time: datetime,
    exclude_event_id: int | None = None
) -> dict:
    """
    Check for conflicts and return structured information.
    """

    conflicts = check_conflict(
        db=db,
        start_time=start_time,
        end_time=end_time,
        exclude_event_id=exclude_event_id
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
        ]
    }

def find_all_conflicts(db: Session) -> list[dict]:
    """
    Find all overlapping pairs of scheduled events.
    """

    events = (
        db.query(Event)
        .filter(Event.status != "cancelled")
        .order_by(Event.start_time)
        .all()
    )

    conflicts = []

    for i, event_a in enumerate(events):
        for event_b in events[i + 1:]:
            # Since events are sorted by start time, once the next
            # event starts after event_a ends, no later event can
            # overlap with event_a.
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
    duration_minutes: int
) -> list[dict]:
    """
    Find available time slots within a given time window.
    """

    events = (
        db.query(Event)
        .filter(
            Event.status != "cancelled",
            Event.start_time < window_end,
            Event.end_time > window_start,
        )
        .order_by(Event.start_time)
        .all()
    )

    duration = timedelta(minutes=duration_minutes)

    slots = []
    current_time = window_start

    for event in events:

        # If there is free time before this event
        if current_time + duration <= event.start_time:

            slots.append({
                "start_time": current_time,
                "end_time": current_time + duration
            })

        # Move our pointer forward
        if event.end_time > current_time:
            current_time = event.end_time

    # Check the remaining time after the final event
    if current_time + duration <= window_end:

        slots.append({
            "start_time": current_time,
            "end_time": current_time + duration
        })

    return slots