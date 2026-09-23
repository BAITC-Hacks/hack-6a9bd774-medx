from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Challenge
from ..schemas import AnalyzeInput, CreateInput, ClarifyInput, PatchInput, ChallengeOut
from ..security import business_identity, require_identity, require_owner
from ..services import openai_service
from ..services.challenge_service import facts_of, get_challenge, output, questions_for, update_readiness
from ..services.readiness import WEIGHTS, PUBLISH_THRESHOLD

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


def save(db, challenge):
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return output(challenge)


def editable(challenge):
    if challenge.status == "PUBLISHED":
        raise HTTPException(409, "Опубликованная задача зафиксирована для команд")


@router.post("/analyze", response_model=ChallengeOut, status_code=201)
async def analyze(payload: AnalyzeInput, db: Session = Depends(get_db), identity=Depends(business_identity)):
    owner = require_identity(identity)
    result = await openai_service.analyze(payload.raw_description)
    challenge = Challenge(owner_hash=owner, raw_description=payload.raw_description,
        title=result.title, **{key: getattr(result, key) for key in WEIGHTS},
        required_skills=result.required_skills, suggested_solution=result.suggested_solution,
        status="DRAFT", score_history=[])
    update_readiness(challenge)
    challenge.questions = questions_for(challenge, [q.model_dump() for q in result.clarification_questions])
    return save(db, challenge)


@router.post("", response_model=ChallengeOut, status_code=201)
def create(payload: CreateInput, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = Challenge(owner_hash=require_identity(identity), raw_description=payload.raw_description,
        title=payload.title, **payload.facts.model_dump(), status="DRAFT", score_history=[])
    update_readiness(challenge)
    challenge.questions = questions_for(challenge)
    return save(db, challenge)


@router.get("", response_model=list[ChallengeOut])
def listing(scope: str = Query("published", pattern="^(published|mine)$"), db: Session = Depends(get_db), identity=Depends(business_identity)):
    query = select(Challenge)
    query = query.where(Challenge.owner_hash == require_identity(identity)) if scope == "mine" else query.where(Challenge.status == "PUBLISHED")
    return [output(c) for c in db.scalars(query.order_by(Challenge.created_at.desc()).limit(100))]


@router.get("/{challenge_id}", response_model=ChallengeOut)
def detail(challenge_id: int, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = get_challenge(db, challenge_id)
    if challenge.status != "PUBLISHED":
        require_owner(challenge, identity)
    return output(challenge)


@router.patch("/{challenge_id}", response_model=ChallengeOut)
def patch(challenge_id: int, payload: PatchInput, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = get_challenge(db, challenge_id)
    require_owner(challenge, identity)
    editable(challenge)
    for key, value in payload.facts.model_dump(exclude_unset=True).items():
        setattr(challenge, key, value)
    if payload.title is not None:
        challenge.title = payload.title
    challenge.review = None
    update_readiness(challenge)
    challenge.questions = questions_for(challenge, challenge.questions)
    return save(db, challenge)


@router.post("/{challenge_id}/clarify", response_model=ChallengeOut)
async def clarify(challenge_id: int, payload: ClarifyInput, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = get_challenge(db, challenge_id)
    require_owner(challenge, identity)
    editable(challenge)
    confirmed = {**facts_of(challenge), **payload.answers}
    result = await openai_service.analyze(challenge.raw_description, confirmed)
    # Answers belong to explicit fields: retain them verbatim, never let AI overwrite business facts.
    for key, value in payload.answers.items():
        setattr(challenge, key, value)
    challenge.required_skills = result.required_skills
    challenge.suggested_solution = result.suggested_solution
    challenge.review = None
    update_readiness(challenge)
    challenge.questions = questions_for(challenge, [q.model_dump() for q in result.clarification_questions])
    return save(db, challenge)


@router.post("/{challenge_id}/publish", response_model=ChallengeOut)
def publish(challenge_id: int, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = get_challenge(db, challenge_id)
    require_owner(challenge, identity)
    update_readiness(challenge)
    if challenge.readiness_score < PUBLISH_THRESHOLD:
        raise HTTPException(409, "Заполните все 8 критериев перед публикацией")
    challenge.status = "PUBLISHED"
    return save(db, challenge)
