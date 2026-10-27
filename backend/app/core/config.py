import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "LearnWise AI"
        API_V1_STR: str = "/api"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "learnwise_super_secret_jwt_key_2026_aiml")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learnwise.db")
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        THRESHOLD_DEMOTE: int = 40
        THRESHOLD_MAINTAIN: int = 70
        THRESHOLD_ADVANCE: int = 85
        class Config:
            case_sensitive = True
            env_file = ".env"
except ImportError:
    class Settings:
        PROJECT_NAME: str = "LearnWise AI"
        API_V1_STR: str = "/api"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "learnwise_super_secret_jwt_key_2026_aiml")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learnwise.db")
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        THRESHOLD_DEMOTE: int = 40
        THRESHOLD_MAINTAIN: int = 70
        THRESHOLD_ADVANCE: int = 85

settings = Settings()
