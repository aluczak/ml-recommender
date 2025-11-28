"""Recommendation endpoints."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..db import get_session
from ..serializers import serialize_product
from ..services.recommendations import fetch_placeholder_recommendations

recommendations_bp = Blueprint("recommendations", __name__)


def _parse_positive_int(value: str | None, *, default: int, minimum: int, maximum: int) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive branch
        raise ValueError("Must be an integer") from exc
    if parsed < minimum or parsed > maximum:
        raise ValueError(f"Must be between {minimum} and {maximum}")
    return parsed


@recommendations_bp.get("/recommendations")
def get_recommendations():  # type: ignore[override]
    session = get_session()
    context = (request.args.get("context") or "home").strip().lower()

    try:
        limit = _parse_positive_int(
            request.args.get("limit"), default=6, minimum=1, maximum=24
        )
    except ValueError as exc:
        return {"error": str(exc)}, 400

    product_id_param = request.args.get("product_id")
    product_id: int | None = None
    if product_id_param:
        try:
            product_id = int(product_id_param)
        except ValueError:
            return {"error": "product_id must be an integer"}, 400

    if context == "product" and not product_id:
        return {"error": "product_id is required when context=product"}, 400

    items, strategy = fetch_placeholder_recommendations(
        session,
        limit=limit,
        product_id=product_id,
    )

    return jsonify(
        {
            "items": [serialize_product(product) for product in items],
            "metadata": {
                "limit": limit,
                "context": context,
                "strategy": strategy,
                "product_id": product_id,
            },
        }
    )
