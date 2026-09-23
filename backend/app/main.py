from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from .database import Base, engine
from .config import settings
from .routes import challenges, applications, reviews, demo
from .services.openai_service import AnalysisUnavailable


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="SanaBridge API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PATCH"], allow_headers=["Content-Type", "X-Business-Key"])
app.include_router(challenges.router)
app.include_router(applications.router)
app.include_router(reviews.router)
app.include_router(demo.router)


@app.exception_handler(AnalysisUnavailable)
async def ai_error(request: Request, exc: AnalysisUnavailable):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    return JSONResponse(status_code=503, content={"detail": "Не удалось сохранить данные. Повторите попытку."})


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SanaBridge"}
