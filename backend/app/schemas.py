from datetime import datetime
from typing import Annotated, Literal
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=5000)]
Criterion = Literal["problem", "goal", "target_users", "available_data", "expected_result", "success_metrics", "constraints", "deadline"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Facts(StrictModel):
    problem: Text | None = None
    goal: Text | None = None
    target_users: Text | None = None
    available_data: Text | None = None
    expected_result: Text | None = None
    success_metrics: Text | None = None
    constraints: Text | None = None
    deadline: Text | None = None


class Question(StrictModel):
    field: Criterion
    question: str = Field(min_length=5, max_length=600)


class Analysis(Facts):
    title: str = Field(min_length=2, max_length=250)
    clarification_questions: list[Question] = Field(max_length=8)
    required_skills: list[str] = Field(max_length=10)
    suggested_solution: str | None


class AnalyzeInput(StrictModel):
    raw_description: str = Field(min_length=10, max_length=12000)


class CreateInput(AnalyzeInput):
    title: str = Field(min_length=2, max_length=250)
    facts: Facts


class ClarifyInput(StrictModel):
    answers: dict[Criterion, Text] = Field(min_length=1, max_length=8)


class PatchInput(StrictModel):
    title: str | None = Field(default=None, min_length=2, max_length=250)
    facts: Facts


class Readiness(StrictModel):
    total_score: int
    completed_criteria: list[str]
    missing_criteria: list[str]
    criterion_weights: dict[str, int]


class TechnicalReview(StrictModel):
    technical_feasibility: str
    data_readiness: str
    risks: list[str]
    technical_questions: list[str]
    review_summary: str


class ReviewResult(StrictModel):
    status: Literal["available", "unavailable"]
    message: str
    result: TechnicalReview | None = None


class ChallengeOut(Facts):
    id: int
    title: str
    raw_description: str
    required_skills: list[str]
    suggested_solution: str | None
    readiness_score: int
    readiness: Readiness
    score_history: list[int]
    status: str
    is_demo: bool
    questions: list[Question]
    review: ReviewResult | None
    created_at: datetime
    updated_at: datetime


class ApplicationInput(StrictModel):
    team_name: str = Field(min_length=2, max_length=120)
    members_count: int = Field(ge=1, le=30, strict=True)
    skills: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]] = Field(min_length=1, max_length=20)
    github_url: str = Field(max_length=300)
    motivation: str = Field(min_length=20, max_length=3000)

    @field_validator("github_url")
    @classmethod
    def github_only(cls, value):
        parsed = urlparse(value)
        if parsed.scheme != "https" or parsed.netloc.lower() != "github.com" or not parsed.path.strip("/") or parsed.query or parsed.fragment:
            raise ValueError("Укажите ссылку https://github.com/команда или репозиторий")
        return "https://github.com/" + parsed.path.strip("/").lower()


class ApplicationOut(ApplicationInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    challenge_id: int
    status: str
    created_at: datetime
