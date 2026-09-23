from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import Challenge
from .readiness import WEIGHTS, calculate_readiness, PUBLISH_THRESHOLD
from .prompts import FALLBACK_QUESTIONS


def facts_of(challenge: Challenge) -> dict:
    return {field: getattr(challenge, field) for field in WEIGHTS}


def update_readiness(challenge: Challenge):
    score = calculate_readiness(facts_of(challenge))["total_score"]
    challenge.readiness_score = score
    if not challenge.score_history or challenge.score_history[-1] != score:
        challenge.score_history = [*(challenge.score_history or []), score]
    if challenge.status != "PUBLISHED":
        challenge.status = "READY" if score >= PUBLISH_THRESHOLD else "CLARIFYING"


def questions_for(challenge: Challenge, suggestions: list | None = None) -> list:
    missing = calculate_readiness(facts_of(challenge))["missing_criteria"]
    indexed = {q["field"]: q["question"] for q in (suggestions or []) if q["field"] in missing}
    ordered = [*indexed, *sorted((key for key in missing if key not in indexed), key=lambda key: -WEIGHTS[key])]
    return [{"field": key, "question": indexed.get(key, FALLBACK_QUESTIONS[key])} for key in ordered[:3]]


def get_challenge(db: Session, challenge_id: int) -> Challenge:
    challenge = db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(404, "Задача не найдена")
    return challenge


def output(challenge: Challenge) -> dict:
    return {**facts_of(challenge), **{key: getattr(challenge, key) for key in (
        "id", "title", "raw_description", "required_skills", "suggested_solution", "readiness_score",
        "score_history", "status", "is_demo", "questions", "review", "created_at", "updated_at")},
        "readiness": calculate_readiness(facts_of(challenge))}
