"""Route blueprints for the backend service."""

from .health import health_bp
from .products import products_bp

__all__ = ["health_bp", "products_bp"]
