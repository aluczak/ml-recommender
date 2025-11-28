"""Route blueprints for the backend service."""

from .auth import auth_bp
from .health import health_bp
from .products import products_bp

__all__ = ["auth_bp", "health_bp", "products_bp"]
