from datetime import date, datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.habit import Habit
from app.schemas.habit import HabitCreate, HabitResponse, HabitUpdate

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)


def calculate_streak(completed_dates_list: list[str]) -> tuple[int, int]:
    if not completed_dates_list:
        return 0, 0

    sorted_dates = sorted(set(completed_dates_list))
    date_objs = []
    for d in sorted_dates:
        try:
            date_objs.append(datetime.strptime(d, "%Y-%m-%d").date())
        except ValueError:
            continue

    if not date_objs:
        return 0, 0

    # Calculate best streak
    best_streak = 1
    current_run = 1
    for i in range(1, len(date_objs)):
        if (date_objs[i] - date_objs[i - 1]).days == 1:
            current_run += 1
            if current_run > best_streak:
                best_streak = current_run
        elif (date_objs[i] - date_objs[i - 1]).days > 1:
            current_run = 1

    # Calculate current streak up to today or yesterday
    today = date.today()
    streak = 0
    check_date = today
    dates_set = set(date_objs)

    if check_date not in dates_set:
        check_date = today - timedelta(days=1)

    while check_date in dates_set:
        streak += 1
        check_date -= timedelta(days=1)

    return streak, max(best_streak, streak)


class ToggleDateRequest(BaseModel):
    date: str | None = None


@router.get("/", response_model=list[HabitResponse])
def list_habits(db: Session = Depends(get_db)):
    habits = db.query(Habit).order_by(Habit.created_at.desc()).all()
    # Ensure streaks are up to date
    for h in habits:
        try:
            dates = json.loads(h.completed_dates or "[]")
        except json.JSONDecodeError:
            dates = []
        streak, best = calculate_streak(dates)
        h.streak = streak
        h.best_streak = max(h.best_streak, best)
    db.commit()
    return habits


@router.post("/", response_model=HabitResponse)
def create_habit(habit_data: HabitCreate, db: Session = Depends(get_db)):
    habit = Habit(**habit_data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.post("/{habit_id}/toggle", response_model=HabitResponse)
def toggle_habit_date(
    habit_id: int,
    payload: ToggleDateRequest | None = None,
    db: Session = Depends(get_db)
):
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    target_date = (payload and payload.date) or date.today().isoformat()

    try:
        completed = json.loads(habit.completed_dates or "[]")
    except json.JSONDecodeError:
        completed = []

    if target_date in completed:
        completed.remove(target_date)
    else:
        completed.append(target_date)

    habit.completed_dates = json.dumps(sorted(completed))
    streak, best = calculate_streak(completed)
    habit.streak = streak
    habit.best_streak = max(habit.best_streak, best)

    db.commit()
    db.refresh(habit)
    return habit


@router.patch("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, update: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    changes = update.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(habit, key, value)

    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return Response(status_code=204)
