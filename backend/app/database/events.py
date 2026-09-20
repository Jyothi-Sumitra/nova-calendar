# pyright: reportMissingImports=false

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.auth import get_current_user_id
from app.database.connection import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.services.scheduling import get_conflict_details, find_free_slots

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("/", response_model=list[EventResponse])
def list_events(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    query = db.query(Event).filter(
        Event.user_id == user_id,
        Event.status != "cancelled",
    )
    if start:
        query = query.filter(Event.end_time > start)
    if end:
        query = query.filter(Event.start_time < end)
    return query.order_by(Event.start_time).all()


@router.get("/free-slots")
def get_free_slots(
    window_start: datetime,
    window_end: datetime,
    duration_minutes: int = Query(..., gt=0),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return find_free_slots(
        db=db,
        window_start=window_start,
        window_end=window_end,
        duration_minutes=duration_minutes,
        user_id=user_id,
    )


@router.post("/check-conflict")
def check_event_conflict(
    event_data: EventCreate,
    exclude_event_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return get_conflict_details(
        db=db,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        exclude_event_id=exclude_event_id,
        user_id=user_id,
    )


@router.post("/", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    conflict_result = get_conflict_details(
        db=db,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        user_id=user_id,
    )

    if conflict_result["has_conflict"]:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Event conflicts with an existing event",
                "conflicts": conflict_result["conflicts"]
            }
        )

    event = Event(
        **event_data.model_dump(),
        user_id=user_id,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    update: EventUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id,
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    changes = update.model_dump(exclude_unset=True)
    start_time = changes.get("start_time", event.start_time)
    end_time = changes.get("end_time", event.end_time)

    if end_time <= start_time:
        raise HTTPException(
            status_code=422,
            detail="End time must be after start time",
        )

    conflict = get_conflict_details(
        db,
        start_time,
        end_time,
        exclude_event_id=event_id,
        user_id=user_id,
    )

    if conflict["has_conflict"]:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Event conflicts with an existing event",
                "conflicts": conflict["conflicts"],
            },
        )

    for key, value in changes.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id,
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return Response(status_code=204)
