"""Configuration loading for the ML Recommender backend."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_BASE_DIR = Path(__file__).resolve().parents[1]
_PROJECT_ROOT = _BASE_DIR.parent

for env_path in (_PROJECT_ROOT / ".env", _BASE_DIR / ".env"):
    if env_path.exists():
        load_dotenv(env_path, override=False)


def _str_to_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(slots=True)
class AppConfig:
    """Strongly typed configuration container."""

    environment: str = os.getenv("APP_ENV", "development")
    debug: bool = _str_to_bool(os.getenv("FLASK_DEBUG"), False)
    secret_key: str = os.getenv("SECRET_KEY", "changeme")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///instance/app.db")


def load_config() -> AppConfig:
    """Load configuration from environment variables/.env file."""

    return AppConfig()


__all__ = ["AppConfig", "load_config"]
