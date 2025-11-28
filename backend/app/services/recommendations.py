"""Placeholder recommendation logic used before ML integration."""

from __future__ import annotations

from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Interaction, Product


def _popular_products_query(
    *,
    category: str | None = None,
    exclude_ids: set[int] | None = None,
):
    """Return a base query that ranks products by interaction volume."""

    interaction_count = func.count(Interaction.id)
    stmt = (
        select(Product)
        .outerjoin(Interaction, Interaction.product_id == Product.id)
        .group_by(Product.id)
        .order_by(interaction_count.desc(), Product.created_at.desc(), Product.id.asc())
    )
    if category:
        stmt = stmt.where(Product.category == category)
    if exclude_ids:
        stmt = stmt.where(~Product.id.in_(exclude_ids))
    return stmt


def _recent_products_query(*, exclude_ids: set[int] | None = None):
    stmt = select(Product).order_by(Product.created_at.desc(), Product.id.desc())
    if exclude_ids:
        stmt = stmt.where(~Product.id.in_(exclude_ids))
    return stmt


def _unique_products(products: Iterable[Product]) -> list[Product]:
    seen: set[int] = set()
    deduped: list[Product] = []
    for product in products:
        if product.id in seen:
            continue
        seen.add(product.id)
        deduped.append(product)
    return deduped


def fetch_placeholder_recommendations(
    session: Session,
    *,
    limit: int = 6,
    product_id: int | None = None,
) -> tuple[list[Product], str]:
    """Return placeholder recommendations and the strategy label used."""

    focus_category: str | None = None
    exclude_ids: set[int] = set()

    if product_id:
        product = session.get(Product, product_id)
        if product is not None:
            focus_category = product.category
            exclude_ids.add(product.id)

    primary_query = _popular_products_query(category=focus_category, exclude_ids=exclude_ids).limit(limit)
    primary_products = session.scalars(primary_query).all()
    strategy = "popular_in_category" if focus_category and primary_products else "popular_overall"
    exclude_ids.update(product.id for product in primary_products)

    if len(primary_products) >= limit:
        return primary_products[:limit], strategy

    remaining = limit - len(primary_products)
    fallback_query = _popular_products_query(exclude_ids=exclude_ids).limit(remaining * 2)
    fallback_products = session.scalars(fallback_query).all()
    exclude_ids.update(product.id for product in fallback_products)

    combined = _unique_products([*primary_products, *fallback_products])

    if len(combined) < limit:
        recent_query = _recent_products_query(exclude_ids=exclude_ids).limit(limit * 2)
        recent_products = session.scalars(recent_query).all()
        combined = _unique_products([*combined, *recent_products])

    return combined[:limit], strategy


__all__ = ["fetch_placeholder_recommendations"]
