from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore")
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.3-70b-instruct"
    database_url: str = "sqlite:///./sanabridge.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
