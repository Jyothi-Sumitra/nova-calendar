from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TodoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    completed: bool = False
    priority: str = "medium"
    category: str = "task"
    due_date: datetime | None = None
    subtasks: str | None = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    completed: bool | None = None
    priority: str | None = None
    category: str | None = None
    due_date: datetime | None = None
    subtasks: str | None = None


class TodoResponse(TodoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
