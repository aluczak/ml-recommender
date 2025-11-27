"""Product catalog endpoints."""

from __future__ import annotations

import math

from flask import Blueprint, jsonify, request
from sqlalchemy import func, select

from ..db import get_session
from ..models import Product

products_bp = Blueprint("products", __name__)


def _parse_positive_int(value: str | None, *, default: int, minimum: int, maximum: int) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError("Must be an integer") from None
    if parsed < minimum or parsed > maximum:
        raise ValueError(f"Must be between {minimum} and {maximum}")
    return parsed


def _serialize_product(product: Product) -> dict[str, object]:
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "price": float(product.price),
        "currency": product.currency,
        "image_url": product.image_url,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }


@products_bp.get("/products")
def list_products():  # type: ignore[override]
    session = get_session()

    try:
        page = _parse_positive_int(
            request.args.get("page"), default=1, minimum=1, maximum=10_000
        )
        page_size = _parse_positive_int(
            request.args.get("page_size"), default=12, minimum=1, maximum=100
        )
    except ValueError as exc:  # pragma: no cover - defensive branch
        return {"error": str(exc)}, 400

    total_items = session.scalar(select(func.count()).select_from(Product)) or 0
    offset = (page - 1) * page_size

    stmt = (
        select(Product)
        .order_by(Product.id.asc())
        .offset(offset)
        .limit(page_size)
    )
    items = session.scalars(stmt).all()

    total_pages = math.ceil(total_items / page_size) if total_items else 0

    return jsonify(
        {
            "items": [_serialize_product(product) for product in items],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page * page_size < total_items,
                "has_prev": page > 1,
            },
        }
    )
