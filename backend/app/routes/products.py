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
        category_filter = request.args.get("category")
        sort_by = (request.args.get("sort_by") or "name").lower()
        sort_dir = (request.args.get("sort_dir") or "asc").lower()
    except ValueError as exc:  # pragma: no cover - defensive branch
        return {"error": str(exc)}, 400

    filters = []
    if category_filter and category_filter.strip():
        filters.append(Product.category == category_filter.strip())

    sort_columns = {
        "name": Product.name,
        "price": Product.price,
    }
    sort_column = sort_columns.get(sort_by)
    if sort_column is None:
        return {"error": "Invalid sort_by. Use 'name' or 'price'."}, 400

    if sort_dir not in {"asc", "desc"}:
        return {"error": "Invalid sort_dir. Use 'asc' or 'desc'."}, 400

    count_stmt = select(func.count()).select_from(Product)
    if filters:
        count_stmt = count_stmt.where(*filters)
    total_items = session.scalar(count_stmt) or 0
    offset = (page - 1) * page_size

    stmt = select(Product)
    if filters:
        stmt = stmt.where(*filters)
    stmt = stmt.order_by(sort_column.asc() if sort_dir == "asc" else sort_column.desc())
    stmt = stmt.offset(offset).limit(page_size)
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
                "sort_by": sort_by,
                "sort_dir": sort_dir,
                "category": category_filter,
            },
        }
    )


@products_bp.get("/products/<int:product_id>")
def get_product(product_id: int):  # type: ignore[override]
    session = get_session()
    product = session.get(Product, product_id)
    if product is None:
        return {"error": f"Product {product_id} not found"}, 404
    return jsonify(_serialize_product(product))
