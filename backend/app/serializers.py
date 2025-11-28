"""Serialization helpers for API responses."""

from __future__ import annotations

from .models import Product


def serialize_product(product: Product) -> dict[str, object]:
    """Convert a Product ORM instance into a JSON-serializable dict."""

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


__all__ = ["serialize_product"]
