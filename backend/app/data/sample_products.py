"""Curated set of sample products for local development seeding."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class SampleProduct:
    """Lightweight representation of a sample catalog product."""

    name: str
    description: str
    category: str
    price: Decimal
    currency: str = "USD"
    image_url: str = ""


SAMPLE_PRODUCTS: tuple[SampleProduct, ...] = (
    SampleProduct(
        name="Aurora Desk Lamp",
        description="Minimalist LED desk lamp with touch brightness controls.",
        category="Lighting",
        price=Decimal("59.00"),
        image_url="https://placehold.co/600x400?text=Lamp",
    ),
    SampleProduct(
        name="Nordic Lounge Chair",
        description="Soft fabric lounge chair inspired by Scandinavian design.",
        category="Furniture",
        price=Decimal("320.00"),
        image_url="https://placehold.co/600x400?text=Chair",
    ),
    SampleProduct(
        name="Ceramic Pour Over Set",
        description="Complete pour-over kit for an unhurried morning brew.",
        category="Kitchen",
        price=Decimal("75.00"),
        image_url="https://placehold.co/600x400?text=Coffee",
    ),
    SampleProduct(
        name="Atlas Standing Desk",
        description="Electric height-adjustable desk with dual motor lift.",
        category="Furniture",
        price=Decimal("890.00"),
        image_url="https://placehold.co/600x400?text=Desk",
    ),
    SampleProduct(
        name="Driftwood Bookshelf",
        description="Five-shelf storage made from reclaimed driftwood panels.",
        category="Furniture",
        price=Decimal("420.00"),
        image_url="https://placehold.co/600x400?text=Bookshelf",
    ),
    SampleProduct(
        name="Peak ANC Headphones",
        description="Wireless headphones with adaptive noise cancellation.",
        category="Electronics",
        price=Decimal("249.00"),
        image_url="https://placehold.co/600x400?text=Headphones",
    ),
    SampleProduct(
        name="Summit Trail Backpack",
        description="35L technical daypack with ventilated suspension.",
        category="Outdoors",
        price=Decimal("180.00"),
        image_url="https://placehold.co/600x400?text=Backpack",
    ),
    SampleProduct(
        name="Ember Cast Iron Set",
        description="Pre-seasoned cast iron skillet and Dutch oven bundle.",
        category="Kitchen",
        price=Decimal("310.00"),
        image_url="https://placehold.co/600x400?text=Cookware",
    ),
    SampleProduct(
        name="Solstice Linen Bedding",
        description="Breathable linen duvet cover with two matching shams.",
        category="Home",
        price=Decimal("260.00"),
        image_url="https://placehold.co/600x400?text=Bedding",
    ),
    SampleProduct(
        name="Orbit Smart Speaker",
        description="Room-filling Wi-Fi speaker with assistant support.",
        category="Electronics",
        price=Decimal("149.00"),
        image_url="https://placehold.co/600x400?text=Speaker",
    ),
    SampleProduct(
        name="Glacier Steel Bottle",
        description="Insulated 32oz stainless bottle that keeps drinks cold for 24h.",
        category="Outdoors",
        price=Decimal("38.00"),
        image_url="https://placehold.co/600x400?text=Bottle",
    ),
    SampleProduct(
        name="Horizon Wall Art Set",
        description="Three-piece modern landscape print set on canvas.",
        category="Decor",
        price=Decimal("210.00"),
        image_url="https://placehold.co/600x400?text=Art",
    ),
)
