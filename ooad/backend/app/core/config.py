from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./autocare.db"
    SECRET_KEY: str = "b8c4d291e0a24ef78c9535d21c37d8e4f16b230917283c48a7d18e2f94b15907"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = "http://localhost:5173"
    DEMO_MODE: bool = True

    # Business Rules Configurations
    TAX_RATE: float = 18.0  # 18% standard tax rate
    BUSINESS_HOURS_START: int = 8  # 8:00 AM
    BUSINESS_HOURS_END: int = 18  # 6:00 PM (18:00)
    SLOT_DURATION_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
