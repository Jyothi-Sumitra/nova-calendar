from typing import Literal
from pydantic import BaseModel


class CalendarIntent(BaseModel):
    intent: Literal[
        "GET_EVENTS",
        "GET_NEXT_EVENT",
        "GET_FREE_SLOTS",
        "GET_CONFLICTS",
        "CREATE_EVENT",
        "RESCHEDULE_EVENT",
        "DELETE_EVENT",
        "CLEAR_DAY",
        "CREATE_NOTE",
        "GET_NOTES",
        "CREATE_TODO",
        "GET_TODOS",
        "COMPLETE_TODO",
        "DAILY_BRIEFING",
        "CHAT",
        "UNKNOWN",
    ]

    title: str | None = None
    content: str | None = None
    event_query: str | None = None
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration_minutes: int | None = None
    priority: str | None = None
    category: str | None = None
    message: str | None = None