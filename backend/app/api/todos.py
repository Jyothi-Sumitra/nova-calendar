from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.connection import get_db
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoResponse, TodoUpdate

router = APIRouter(
    prefix="/todos",
    tags=["Todos"]
)


@router.get("/", response_model=list[TodoResponse])
def list_todos(
    completed: bool | None = None,
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Todo)

    if completed is not None:
        query = query.filter(Todo.completed == completed)

    if category and category != "all":
        query = query.filter(Todo.category == category)

    if priority and priority != "all":
        query = query.filter(Todo.priority == priority.lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Todo.title.ilike(term),
                Todo.description.ilike(term)
            )
        )

    # Incomplete first, then by due date or updated_at
    return query.order_by(Todo.completed.asc(), Todo.due_date.asc().nullslast(), Todo.created_at.desc()).all()


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.post("/", response_model=TodoResponse)
def create_todo(
    todo_data: TodoCreate,
    db: Session = Depends(get_db)
):
    todo = Todo(**todo_data.model_dump())
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    update: TodoUpdate,
    db: Session = Depends(get_db)
):
    todo = db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    changes = update.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(todo, key, value)

    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return Response(status_code=204)
