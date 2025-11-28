"""Security helpers for password hashing and token handling."""

from __future__ import annotations

from dataclasses import dataclass

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

_TOKEN_SALT = "ml-recommender-auth-token"


@dataclass(slots=True)
class TokenVerificationResult:
    """Represents the outcome of decoding a token."""

    user_id: int


class TokenError(Exception):
    """Raised when a token cannot be decoded."""


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using Werkzeug helpers."""

    return generate_password_hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""

    return check_password_hash(hashed_password, plain_password)


def _build_serializer(secret_key: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key, salt=_TOKEN_SALT)


def generate_access_token(user_id: int, secret_key: str) -> str:
    """Generate a signed token holding the user id."""

    serializer = _build_serializer(secret_key)
    return serializer.dumps({"sub": user_id})


def decode_access_token(token: str, secret_key: str, max_age_seconds: int) -> TokenVerificationResult:
    """Decode an access token and return its payload."""

    serializer = _build_serializer(secret_key)
    try:
        data = serializer.loads(token, max_age=max_age_seconds)
    except SignatureExpired as exc:  # pragma: no cover - straight-through error paths
        raise TokenError("Token has expired") from exc
    except BadSignature as exc:  # pragma: no cover - straight-through error paths
        raise TokenError("Token is invalid") from exc

    user_id = data.get("sub")
    if not isinstance(user_id, int):  # pragma: no cover - defensive
        raise TokenError("Token payload is malformed")

    return TokenVerificationResult(user_id=user_id)


__all__ = [
    "TokenVerificationResult",
    "TokenError",
    "hash_password",
    "verify_password",
    "generate_access_token",
    "decode_access_token",
]
