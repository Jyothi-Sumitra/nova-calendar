from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.event import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    category: Mapped[str] = mapped_column(
        String(50),
        default="health",
        nullable=False
    )

    color: Mapped[str] = mapped_column(
        String(20),
        default="#146B54",
        nullable=False
    )

    target_days: Mapped[int] = mapped_column(
        Integer,
        default=7,
        nullable=False
    )

    streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    best_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    completed_dates: Mapped[str] = mapped_column(
        Text,
        default="[]",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
