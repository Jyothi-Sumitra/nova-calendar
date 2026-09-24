from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class HabitBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str = "health"
    color: str = "#146B54"
    target_days: int = 7


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    category: str | None = None
    color: str | None = None
    target_days: int | None = None


class HabitResponse(HabitBase):
    id: int
    streak: int
    best_streak: int
    completed_dates: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
