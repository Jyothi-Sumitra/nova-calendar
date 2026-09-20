from typing import Literal

from pydantic import BaseModel


class CalendarIntent(BaseModel):
    intent: Literal[
        "GET_EVENTS",
        "GET_NEXT_EVENT",
        "GET_FREE_SLOTS",
        "CREATE_EVENT",
        "RESCHEDULE_EVENT",
        "DELETE_EVENT",
        "UNKNOWN",
    ]

    title: str | None = None
    event_query: str | None = None
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration_minutes: int | None = None