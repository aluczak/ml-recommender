"""Shared helpers for authentication workflows."""

from __future__ import annotations

from flask import current_app, g, request

from .config import AppConfig
from .db import get_session
from .models import User
from .security import TokenError, decode_access_token, generate_access_token


def get_app_config() -> AppConfig:
    """Return the strongly typed application config from Flask."""

    config = current_app.config.get("APP_CONFIG")
    if not isinstance(config, AppConfig):  # pragma: no cover - defensive branch
        raise RuntimeError("Application configuration is missing")
    return config


def extract_bearer_token() -> str | None:
    """Parse the Authorization header and extract the bearer token."""

    header_value = request.headers.get("Authorization")
    if not header_value:
        return None
    parts = header_value.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def resolve_authenticated_user() -> tuple[User | None, str | None, int]:
    """Attempt to resolve the current user from the bearer token."""

    token = extract_bearer_token()
    if not token:
        return None, "Missing access token", 401

    config = get_app_config()
    try:
        token_data = decode_access_token(
            token,
            current_app.config["SECRET_KEY"],
            config.access_token_exp_minutes * 60,
        )
    except TokenError as exc:
        return None, str(exc), 401

    session = get_session()
    user = session.get(User, token_data.user_id)
    if user is None:
        return None, "User referenced by token no longer exists", 401

    g.current_user = user
    return user, None, 200


def resolve_user_if_present() -> tuple[User | None, str | None]:
    """Resolve the current user only when a bearer token is provided."""

    token = extract_bearer_token()
    if not token:
        return None, None

    config = get_app_config()
    try:
        token_data = decode_access_token(
            token,
            current_app.config["SECRET_KEY"],
            config.access_token_exp_minutes * 60,
        )
    except TokenError as exc:
        return None, str(exc)

    session = get_session()
    user = session.get(User, token_data.user_id)
    if user is None:
        return None, "User referenced by token no longer exists"

    g.current_user = user
    return user, None


def issue_access_token(user: User) -> tuple[str, int]:
    """Generate an access token and return it with expiry metadata."""

    config = get_app_config()
    expires_in = max(60, config.access_token_exp_minutes * 60)
    token = generate_access_token(user.id, current_app.config["SECRET_KEY"])
    return token, expires_in


__all__ = [
    "get_app_config",
    "extract_bearer_token",
    "resolve_authenticated_user",
    "resolve_user_if_present",
    "issue_access_token",
]
