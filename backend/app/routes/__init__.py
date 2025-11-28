"""Route blueprints for the backend service."""

from .auth import auth_bp
from .cart import cart_bp
from .health import health_bp
from .products import products_bp

__all__ = ["auth_bp", "cart_bp", "health_bp", "products_bp"]
