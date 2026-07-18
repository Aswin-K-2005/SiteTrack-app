import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # In production, ALWAYS set SECRET_KEY via environment variable / .env file.
    # This random fallback is fine for local dev but means tokens won't survive a restart.
    secret_key: str = secrets.token_urlsafe(32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12  # 12h — long enough to cover a shift

    database_url: str = "sqlite:///./sitetrack.db"

    # Comma separated list of allowed frontend origins for CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
