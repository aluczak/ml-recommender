#!/usr/bin/env python3
"""Seed the development database with a curated product catalog."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import NamedTuple

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import load_config  # noqa: E402  (import after sys.path tweak)
from app.data.sample_products import SAMPLE_PRODUCTS  # noqa: E402
from app.db import Base  # noqa: E402
from app.models import Product  # noqa: E402


class SeedStats(NamedTuple):
    inserted: int
    updated: int
    deleted: int


def upsert_products(session: Session, *, reset: bool) -> SeedStats:
    """Insert or update products from the SAMPLE_PRODUCTS collection."""

    inserted = updated = deleted = 0

    if reset:
        deleted = session.execute(delete(Product)).rowcount or 0
        session.flush()

    for sample in SAMPLE_PRODUCTS:
        existing = session.execute(
            select(Product).where(Product.name == sample.name)
        ).scalar_one_or_none()

        if existing is None:
            session.add(
                Product(
                    name=sample.name,
                    description=sample.description,
                    category=sample.category,
                    price=sample.price,
                    currency=sample.currency,
                    image_url=sample.image_url,
                )
            )
            inserted += 1
            continue

        existing.description = sample.description
        existing.category = sample.category
        existing.price = sample.price
        existing.currency = sample.currency
        existing.image_url = sample.image_url
        updated += 1

    session.commit()
    return SeedStats(inserted=inserted, updated=updated, deleted=deleted)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all existing products before seeding",
    )
    args = parser.parse_args()

    config = load_config()
    engine = create_engine(config.database_url, future=True)
    Base.metadata.create_all(engine)

    with Session(engine, future=True) as session:
        stats = upsert_products(session, reset=args.reset)

    print(
        f"Seed complete. Added {stats.inserted} products, updated {stats.updated}, "
        f"deleted {stats.deleted} (reset={args.reset})."
    )


if __name__ == "__main__":
    main()
