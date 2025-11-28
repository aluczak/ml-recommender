"""Endpoints for recording product interaction events."""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from ..auth_helpers import resolve_user_if_present
from ..services import InteractionLoggingError, log_interaction

interactions_bp = Blueprint("interactions", __name__)


def _serialize_interaction(interaction) -> dict[str, object]:
    return {
        "id": interaction.id,
        "user_id": interaction.user_id,
        "product_id": interaction.product_id,
        "interaction_type": interaction.interaction_type,
        "metadata": interaction.interaction_metadata,
        "occurred_at": interaction.occurred_at.isoformat() if interaction.occurred_at else None,
    }


@interactions_bp.post("/interactions")
def create_interaction():  # type: ignore[override]
    payload = request.get_json(silent=True) or {}
    product_id = payload.get("product_id")
    interaction_type = payload.get("interaction_type")
    metadata = payload.get("metadata")

    if not isinstance(product_id, int):
        return jsonify({"error": "product_id must be an integer."}), 400
    if not isinstance(interaction_type, str) or not interaction_type.strip():
        return jsonify({"error": "interaction_type must be a non-empty string."}), 400
    if metadata is not None and not isinstance(metadata, dict):
        return jsonify({"error": "metadata must be an object when provided."}), 400

    user, token_error = resolve_user_if_present()
    if token_error:
        return jsonify({"error": token_error}), 401

    try:
        interaction = log_interaction(
            product_id=product_id,
            interaction_type=interaction_type,
            user=user,
            metadata=metadata,
        )
    except InteractionLoggingError as exc:
        return jsonify({"error": str(exc)}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Unexpected error while logging interaction")
        return jsonify({"error": "Unable to record interaction right now."}), 500

    return jsonify({"interaction": _serialize_interaction(interaction)}), 201


__all__ = ["interactions_bp"]
