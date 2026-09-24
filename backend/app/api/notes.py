from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.connection import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate

router = APIRouter(
    prefix="/notes",
    tags=["Notes"]
)


@router.get("/", response_model=list[NoteResponse])
def list_notes(
    search: str | None = None,
    category: str | None = None,
    pinned_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Note)

    if pinned_only:
        query = query.filter(Note.is_pinned == True)

    if category and category != "all":
        query = query.filter(Note.category == category)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Note.title.ilike(term),
                Note.content.ilike(term),
                Note.tags.ilike(term)
            )
        )

    # Order pinned notes first, then latest updated
    return query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    note = Note(**note_data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    update: NoteUpdate,
    db: Session = Depends(get_db)
):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    changes = update.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return Response(status_code=204)
