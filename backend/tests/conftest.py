import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/test.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)
    def override():
        with sessions() as db:
            yield db
    app.dependency_overrides[get_db] = override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def owner():
    return {"X-Business-Key": "a" * 64}


@pytest.fixture
def facts():
    return dict(problem="Отзывы разбирают вручную", goal="Сократить время анализа", target_users="Учебный отдел",
        available_data="5000 обезличенных отзывов CSV", expected_result="Веб-панель с темами отзывов",
        success_metrics="F1 не менее 0.8 на тестовых данных", constraints="Только обезличенные данные, бюджет 0",
        deadline="30 ноября 2026")
