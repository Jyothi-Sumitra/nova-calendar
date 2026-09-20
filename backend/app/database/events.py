# pyright: reportMissingImports=false

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.connection import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse, EventUpdate

from app.services.scheduling import (
    get_conflict_details,
    find_free_slots
)

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("/", response_model=list[EventResponse])
def list_events(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.status != "cancelled")
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
    db: Session = Depends(get_db)
):
    return find_free_slots(
        db=db,
        window_start=window_start,
        window_end=window_end,
        duration_minutes=duration_minutes
    )


@router.post("/check-conflict")
def check_event_conflict(
    event_data: EventCreate,
    exclude_event_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db)
):
    return get_conflict_details(
        db=db,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        exclude_event_id=exclude_event_id,
    )


@router.post("/", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db)
):
    conflict_result = get_conflict_details(
        db=db,
        start_time=event_data.start_time,
        end_time=event_data.end_time
    )

    if conflict_result["has_conflict"]:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Event conflicts with an existing event",
                "conflicts": conflict_result["conflicts"]
            }
        )

    event = Event(**event_data.model_dump())

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, update: EventUpdate, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    changes = update.model_dump(exclude_unset=True)
    start_time = changes.get("start_time", event.start_time)
    end_time = changes.get("end_time", event.end_time)
    if end_time <= start_time:
        raise HTTPException(status_code=422, detail="End time must be after start time")
    conflict = get_conflict_details(db, start_time, end_time, exclude_event_id=event_id)
    if conflict["has_conflict"]:
        raise HTTPException(status_code=409, detail={"message": "Event conflicts with an existing event", "conflicts": conflict["conflicts"]})
    for key, value in changes.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return Response(status_code=204)
