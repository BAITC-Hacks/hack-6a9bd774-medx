from datetime import datetime, timezone
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def now():
    return datetime.now(timezone.utc)


class Challenge(Base):
    __tablename__ = "challenges"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_hash: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(250))
    raw_description: Mapped[str] = mapped_column(Text)
    problem: Mapped[str | None] = mapped_column(Text)
    goal: Mapped[str | None] = mapped_column(Text)
    target_users: Mapped[str | None] = mapped_column(Text)
    available_data: Mapped[str | None] = mapped_column(Text)
    expected_result: Mapped[str | None] = mapped_column(Text)
    success_metrics: Mapped[str | None] = mapped_column(Text)
    constraints: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[str | None] = mapped_column(Text)
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    suggested_solution: Mapped[str | None] = mapped_column(Text)
    questions: Mapped[list] = mapped_column(JSON, default=list)
    score_history: Mapped[list] = mapped_column(JSON, default=list)
    readiness_score: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", index=True)
    is_demo: Mapped[bool] = mapped_column(default=False)
    review: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("challenge_id", "github_url", name="uq_challenge_github"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"), index=True)
    team_name: Mapped[str] = mapped_column(String(120))
    members_count: Mapped[int] = mapped_column(Integer)
    skills: Mapped[list] = mapped_column(JSON)
    github_url: Mapped[str] = mapped_column(String(300))
    motivation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
