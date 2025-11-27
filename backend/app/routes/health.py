"""Health-check endpoint for the backend."""

from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime

from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health() -> tuple[dict[str, object], int]:
    """Return a simple JSON health payload."""
    config = current_app.config.get("APP_CONFIG")
    config_dict = asdict(config) if config else {}

    payload = {
        "status": "ok",
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "config": {
            "environment": config_dict.get("environment"),
            "debug": config_dict.get("debug"),
        },
    }
    return jsonify(payload), 200
