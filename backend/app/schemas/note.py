from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = None
    category: str = "general"
    color: str = "amber"
    is_pinned: bool = False
    tags: str | None = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    category: str | None = None
    color: str | None = None
    is_pinned: bool | None = None
    tags: str | None = None


class NoteResponse(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
