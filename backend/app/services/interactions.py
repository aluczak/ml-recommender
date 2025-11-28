"""Helpers for logging user-product interactions."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Interaction, Product, User

ALLOWED_INTERACTION_TYPES = {
    "view",
    "click",
    "add_to_cart",
    "update_cart",
    "pseudo_purchase",
}


class InteractionLoggingError(RuntimeError):
    """Raised when an interaction cannot be persisted."""


def log_interaction(
    *,
    product_id: int,
    interaction_type: str,
    user: User | None = None,
    metadata: dict[str, Any] | None = None,
    session: Session | None = None,
    commit: bool = True,
) -> Interaction:
    """Persist an interaction row and optionally commit the transaction."""

    normalized_type = (interaction_type or "").strip().lower()
    if not normalized_type:
        raise InteractionLoggingError("interaction_type must be provided")
    if normalized_type not in ALLOWED_INTERACTION_TYPES:
        raise InteractionLoggingError(
            f"interaction_type '{normalized_type}' is not supported."
        )

    session = session or get_session()
    product = session.get(Product, product_id)
    if product is None:
        raise InteractionLoggingError("Product does not exist")

    payload_metadata: dict[str, Any] | None = metadata if isinstance(metadata, dict) else None

    interaction = Interaction(
        user_id=user.id if user else None,
        product_id=product.id,
        interaction_type=normalized_type,
        interaction_metadata=payload_metadata,
    )
    session.add(interaction)

    if commit:
        session.commit()
    else:
        session.flush()

    return interaction


__all__ = [
    "ALLOWED_INTERACTION_TYPES",
    "InteractionLoggingError",
    "log_interaction",
]
