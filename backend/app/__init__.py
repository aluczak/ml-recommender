"""Application factory for the ML Recommender backend."""

from __future__ import annotations

from flask import Flask

from .config import AppConfig, load_config
from .routes.health import health_bp


def create_app(config_override: AppConfig | None = None) -> Flask:
    """Create and configure a Flask application instance."""
    config = config_override or load_config()

    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=config.secret_key,
        ENV=config.environment,
        DEBUG=config.debug,
        DATABASE_URL=config.database_url,
    )
    app.config["APP_CONFIG"] = config

    app.register_blueprint(health_bp, url_prefix="/api")

    @app.get("/")
    def root() -> tuple[str, int]:
        return (
            "ML Recommender backend is running. See /api/health for status.",
            200,
        )

    return app


__all__ = ["create_app", "AppConfig"]
