from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator  # type: ignore[reportMissingImports]


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None

    start_time: datetime
    end_time: datetime

    location: str | None = None

    priority: str = "medium"
    category: str = "task"
    status: str = "scheduled"

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")

        return self


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    location: str | None = None
    priority: str | None = None
    category: str | None = None
    status: str | None = None


class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)