from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Application, Challenge, now
from ..schemas import ApplicationInput, ApplicationOut
from ..security import business_identity, require_owner
from ..services.challenge_service import get_challenge

router = APIRouter(prefix="/api", tags=["applications"])


@router.post("/challenges/{challenge_id}/applications", response_model=ApplicationOut, status_code=201)
def apply(challenge_id: int, payload: ApplicationInput, db: Session = Depends(get_db)):
    # Acquire a write lock before checking selection, serializing concurrent submissions/selections on SQLite.
    db.execute(update(Challenge).where(Challenge.id == challenge_id).values(updated_at=Challenge.updated_at))
    challenge = get_challenge(db, challenge_id)
    if challenge.status != "PUBLISHED":
        raise HTTPException(409, "Приём заявок ещё не открыт")
    if db.scalar(select(Application.id).where(Application.challenge_id == challenge_id, Application.status == "SELECTED")):
        raise HTTPException(409, "Команда уже выбрана, приём заявок завершён")
    application = Application(challenge_id=challenge_id, **payload.model_dump())
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Заявка с этой GitHub-ссылкой уже отправлена")
    db.refresh(application)
    return application


@router.get("/challenges/{challenge_id}/applications", response_model=list[ApplicationOut])
def listing(challenge_id: int, db: Session = Depends(get_db), identity=Depends(business_identity)):
    require_owner(get_challenge(db, challenge_id), identity)
    return list(db.scalars(select(Application).where(Application.challenge_id == challenge_id).order_by(Application.created_at.desc())))


@router.patch("/applications/{application_id}/select", response_model=ApplicationOut)
def select_team(application_id: int, db: Session = Depends(get_db), identity=Depends(business_identity)):
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(404, "Заявка не найдена")
    challenge = get_challenge(db, application.challenge_id)
    require_owner(challenge, identity)
    db.execute(update(Challenge).where(Challenge.id == challenge.id).values(updated_at=now()))
    winner = db.scalar(select(Application).where(Application.challenge_id == challenge.id, Application.status == "SELECTED"))
    if winner and winner.id != application.id:
        raise HTTPException(409, "Команда уже выбрана")
    db.execute(update(Application).where(Application.challenge_id == challenge.id).values(status="REJECTED"))
    application.status = "SELECTED"
    db.commit()
    db.refresh(application)
    return application
