import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Weplay API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # PostgreSQL / PostGIS
    POSTGRES_USER: str = "weplay"
    POSTGRES_PASSWORD: str = "weplaysecret"
    POSTGRES_DB: str = "weplay"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://weplay:weplaysecret@localhost:5432/weplay"
    SYNC_DATABASE_URL: str = "postgresql://weplay:weplaysecret@localhost:5432/weplay"

    # Security
    SECRET_KEY: str = "weplay_super_secret_jwt_key_change_in_production_32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
