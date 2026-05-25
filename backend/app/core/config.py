from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    GOOGLE_AI_API_KEY: str = ""
    GEMMA_MODEL: str = "gemini-2.5-flash"
    # Tokens de pensamiento para el Laboratorio IA (0 = desactivado, máx 24576 para Flash)
    ANALYZE_THINKING_BUDGET: int = 8000

    model_config = {
        "env_file": str(Path(__file__).parent.parent.parent / ".env"),
        "extra": "ignore",
    }


settings = Settings()
