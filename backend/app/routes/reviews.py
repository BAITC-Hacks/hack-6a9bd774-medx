from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ReviewResult
from ..security import business_identity, require_owner
from ..services.challenge_service import get_challenge, facts_of
from ..services.nvidia_service import review_challenge

router = APIRouter(prefix="/api/challenges", tags=["technical review"])


@router.post("/{challenge_id}/review", response_model=ReviewResult)
async def review(challenge_id: int, db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = get_challenge(db, challenge_id)
    require_owner(challenge, identity)
    result = await review_challenge(facts_of(challenge), {"required_skills": challenge.required_skills, "suggested_solution": challenge.suggested_solution})
    challenge.review = result.model_dump()
    db.commit()
    return result
