"""Application factory for the ML Recommender backend."""

from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import AppConfig, load_config
from .db import init_db
from .routes import auth_bp, cart_bp, health_bp, products_bp


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
    init_db(app, config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(cart_bp, url_prefix="/api")

    @app.get("/")
    def root() -> tuple[str, int]:
        return (
            "ML Recommender backend is running. See /api/health for status.",
            200,
        )

    return app


__all__ = ["create_app", "AppConfig"]
