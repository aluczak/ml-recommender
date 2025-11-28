"""Authentication routes for registration and login."""

from __future__ import annotations

import re
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from ..auth_helpers import issue_access_token, resolve_authenticated_user
from ..db import get_session
from ..models import User
from ..security import hash_password, verify_password

auth_bp = Blueprint("auth", __name__)

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def _normalize_email(value: str | None) -> str:
    if not value or not isinstance(value, str):
        return ""
    return value.strip().lower()


@auth_bp.post("/auth/register")
def register_user():  # type: ignore[override]
    payload = request.get_json(silent=True) or {}
    email = _normalize_email(payload.get("email"))
    password = payload.get("password", "")
    full_name = payload.get("full_name")

    errors: dict[str, str] = {}
    if not email:
        errors["email"] = "Email is required."
    elif not _EMAIL_PATTERN.match(email):
        errors["email"] = "Enter a valid email address."

    if not isinstance(password, str) or len(password) < 8:
        errors["password"] = "Password must be at least 8 characters long."

    if full_name is not None and not isinstance(full_name, str):
        errors["full_name"] = "Full name must be a string."

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    session = get_session()
    existing = session.scalar(select(User.id).where(func.lower(User.email) == email))
    if existing is not None:
        return jsonify({"error": "Email is already registered."}), 409

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name.strip() if isinstance(full_name, str) and full_name.strip() else None,
    )
    session.add(user)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Email is already registered."}), 409

    token, expires_in = issue_access_token(user)
    return (
        jsonify(
            {
                "user": _serialize_user(user),
                "access_token": token,
                "token_type": "bearer",
                "expires_in": expires_in,
            }
        ),
        201,
    )


@auth_bp.post("/auth/login")
def login_user():  # type: ignore[override]
    payload = request.get_json(silent=True) or {}
    email = _normalize_email(payload.get("email"))
    password = payload.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    session = get_session()
    user = session.scalar(select(User).where(func.lower(User.email) == email))
    if user is None or not verify_password(password, user.hashed_password):
        return jsonify({"error": "Invalid email or password."}), 401

    token, expires_in = issue_access_token(user)
    return jsonify(
        {
            "user": _serialize_user(user),
            "access_token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }
    )


@auth_bp.get("/auth/me")
def get_current_user_profile():  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code
    return jsonify({"user": _serialize_user(user)})


__all__ = ["auth_bp"]
