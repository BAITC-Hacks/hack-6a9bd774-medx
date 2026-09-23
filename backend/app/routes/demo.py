from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Challenge
from ..schemas import ChallengeOut
from ..security import business_identity, require_identity
from ..services.challenge_service import update_readiness, questions_for
from .challenges import save

router = APIRouter(prefix="/api", tags=["demo"])
DEMO_FACTS = {
    "problem": "Учебный отдел вручную разбирает отзывы студентов и не успевает находить повторяющиеся проблемы.",
    "goal": "Сократить время ежемесячного анализа обратной связи с двух дней до двух часов.",
    "target_users": "Сотрудники учебного отдела и руководители образовательных программ.",
    "available_data": "Демонстрационное допущение: 5000 обезличенных отзывов на русском языке в CSV. Реальный датасет не включён.",
    "expected_result": "Веб-прототип: загрузка CSV, распределение отзывов по темам и тональности, экспорт отчёта.",
    "success_metrics": "Macro-F1 классификации тем ≥ 0.80 на отложенной выборке из 300 вручную размеченных отзывов; отчёт за 2 минуты.",
    "constraints": "Только обезличенные данные; без платной инфраструктуры; обязательная проверка выводов человеком.",
    "deadline": "30 ноября 2026 года. Демонстрация прототипа через 4 недели после старта.",
}


@router.post("/demo", response_model=ChallengeOut, status_code=201)
def demo(db: Session = Depends(get_db), identity=Depends(business_identity)):
    challenge = Challenge(owner_hash=require_identity(identity), title="AI-анализ обратной связи студентов",
        raw_description="ДЕМО. Вымышленный учебный кейс: анализ отзывов студентов. Все поля заполнены демонстрационными данными, а не результатом AI-анализа.",
        **DEMO_FACTS, required_skills=["Python", "NLP", "React", "Data visualization"],
        suggested_solution="Демо-предложение: начать с классификации тем и тональности; сравнить с простой базовой моделью и проверить качество на ручной разметке.",
        status="DRAFT", score_history=[], is_demo=True)
    update_readiness(challenge)
    challenge.questions = questions_for(challenge)
    return save(db, challenge)
