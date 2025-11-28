"""Shopping cart endpoints for authenticated users."""

from __future__ import annotations

from decimal import Decimal

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..auth_helpers import resolve_authenticated_user
from ..db import get_session
from ..models import Cart, CartItem, Order, Product, User
from ..services import InteractionLoggingError, log_interaction

cart_bp = Blueprint("cart", __name__)

_MAX_QUANTITY = 99


def _load_cart_with_items(cart_id: int) -> Cart | None:
    session = get_session()
    stmt = (
        select(Cart)
        .where(Cart.id == cart_id)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
    )
    return session.scalars(stmt).first()


def _get_or_create_open_cart(user: User) -> Cart:
    session = get_session()
    stmt = (
        select(Cart)
        .where(Cart.user_id == user.id, Cart.status == "open")
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .order_by(Cart.id.desc())
    )
    cart = session.scalars(stmt).first()
    if cart:
        return cart

    cart = Cart(user_id=user.id, status="open")
    session.add(cart)
    session.commit()
    session.refresh(cart)
    return _load_cart_with_items(cart.id) or cart


def _serialize_product_summary(product: Product) -> dict[str, object]:
    return {
        "id": product.id,
        "name": product.name,
        "price": float(product.price),
        "currency": product.currency,
        "image_url": product.image_url,
    }


def _serialize_cart(cart: Cart) -> dict[str, object]:
    subtotal = Decimal("0")
    item_count = 0
    currency = "USD"
    items_payload: list[dict[str, object]] = []

    for item in cart.items:
        price = Decimal(item.unit_price or 0)
        line_total = price * item.quantity
        subtotal += line_total
        item_count += item.quantity
        currency = item.product.currency if item.product and item.product.currency else currency
        items_payload.append(
            {
                "id": item.id,
                "quantity": item.quantity,
                "unit_price": float(price),
                "line_total": float(line_total),
                "product": _serialize_product_summary(item.product),
            }
        )

    return {
        "id": cart.id,
        "status": cart.status,
        "currency": currency,
        "item_count": item_count,
        "subtotal": float(subtotal),
        "items": items_payload,
        "created_at": cart.created_at.isoformat() if cart.created_at else None,
        "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
    }


def _validate_quantity(value: object, *, minimum: int = 1) -> int:
    if not isinstance(value, int):
        raise ValueError("Quantity must be an integer.")
    if value < minimum:
        raise ValueError("Quantity must be positive.")
    if value > _MAX_QUANTITY:
        raise ValueError(f"Quantity cannot exceed {_MAX_QUANTITY}.")
    return value


def _cart_response(cart: Cart):
    return jsonify({"cart": _serialize_cart(cart)})


def _record_interaction(
    *,
    session,
    product_id: int,
    interaction_type: str,
    user: User,
    metadata: dict[str, object] | None = None,
) -> None:
    try:
        log_interaction(
            product_id=product_id,
            interaction_type=interaction_type,
            user=user,
            metadata=metadata,
            session=session,
            commit=False,
        )
    except InteractionLoggingError as exc:  # pragma: no cover - logging path
        current_app.logger.debug("Interaction log skipped: %s", exc)


def _find_cart_item_for_user(item_id: int, user: User) -> CartItem | None:
    session = get_session()
    stmt = (
        select(CartItem)
        .join(Cart, Cart.id == CartItem.cart_id)
        .options(joinedload(CartItem.product), joinedload(CartItem.cart))
        .where(CartItem.id == item_id, Cart.user_id == user.id, Cart.status == "open")
    )
    return session.scalars(stmt).first()


def _compute_cart_total(cart: Cart) -> Decimal:
    total = Decimal("0")
    for item in cart.items:
        price = Decimal(item.unit_price or 0)
        total += price * item.quantity
    return total


@cart_bp.get("/cart")
def get_cart():  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code

    cart = _get_or_create_open_cart(user)
    return _cart_response(cart)


@cart_bp.post("/cart/items")
def add_cart_item():  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code

    payload = request.get_json(silent=True) or {}
    product_id = payload.get("product_id")
    quantity = payload.get("quantity", 1)

    if not isinstance(product_id, int):
        return jsonify({"error": "product_id must be provided"}), 400

    try:
        quantity_value = _validate_quantity(quantity)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    session = get_session()
    product = session.get(Product, product_id)
    if product is None:
        return jsonify({"error": "Product not found."}), 404

    cart = _get_or_create_open_cart(user)

    stmt = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id)
    item = session.scalars(stmt).first()

    if item is None:
        item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=quantity_value,
            unit_price=product.price,
        )
        session.add(item)
    else:
        new_quantity = item.quantity + quantity_value
        if new_quantity > _MAX_QUANTITY:
            return jsonify({"error": f"Quantity cannot exceed {_MAX_QUANTITY}."}), 400
        item.quantity = new_quantity
        item.unit_price = product.price

    _record_interaction(
        session=session,
        product_id=product.id,
        interaction_type="add_to_cart",
        user=user,
        metadata={
            "quantity": item.quantity,
            "delta": quantity_value,
            "source": "api",
        },
    )

    session.commit()
    refreshed = _load_cart_with_items(cart.id)
    return _cart_response(refreshed or cart)


@cart_bp.patch("/cart/items/<int:item_id>")
def update_cart_item(item_id: int):  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code

    payload = request.get_json(silent=True) or {}
    quantity = payload.get("quantity")
    if quantity is None:
        return jsonify({"error": "quantity is required"}), 400

    try:
        quantity_value = _validate_quantity(quantity, minimum=0)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    item = _find_cart_item_for_user(item_id, user)
    if item is None:
        return jsonify({"error": "Cart item not found."}), 404

    session = get_session()
    if quantity_value == 0:
        session.delete(item)
    else:
        item.quantity = quantity_value
    _record_interaction(
        session=session,
        product_id=item.product_id,
        interaction_type="update_cart",
        user=user,
        metadata={"quantity": quantity_value},
    )
    session.commit()

    refreshed = _load_cart_with_items(item.cart_id)
    return _cart_response(refreshed or _get_or_create_open_cart(user))


@cart_bp.delete("/cart/items/<int:item_id>")
def delete_cart_item(item_id: int):  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code

    item = _find_cart_item_for_user(item_id, user)
    if item is None:
        return jsonify({"error": "Cart item not found."}), 404

    session = get_session()
    cart_id = item.cart_id
    product_id = item.product_id
    session.delete(item)
    _record_interaction(
        session=session,
        product_id=product_id,
        interaction_type="update_cart",
        user=user,
        metadata={"quantity": 0},
    )
    session.commit()

    refreshed = _load_cart_with_items(cart_id)
    return _cart_response(refreshed or _get_or_create_open_cart(user))


@cart_bp.post("/cart/checkout")
def checkout_cart():  # type: ignore[override]
    user, error_message, status_code = resolve_authenticated_user()
    if user is None:
        return jsonify({"error": error_message or "Authentication required."}), status_code

    cart = _get_or_create_open_cart(user)
    if not cart.items:
        return jsonify({"error": "Cart is empty. Add items before checking out."}), 400

    total = _compute_cart_total(cart)
    currency = "USD"
    if cart.items:
        first_currency = cart.items[0].product.currency if cart.items[0].product else None
        if first_currency:
            currency = first_currency

    session = get_session()
    cart.status = "submitted"
    order = Order(
        user_id=user.id,
        cart_id=cart.id,
        total_amount=total,
        status="confirmed",
    )
    session.add(order)

    session.flush()
    session.refresh(order)

    new_cart = Cart(user_id=user.id, status="open")
    session.add(new_cart)
    for item in cart.items:
        line_total = Decimal(item.unit_price or 0) * item.quantity
        _record_interaction(
            session=session,
            product_id=item.product_id,
            interaction_type="pseudo_purchase",
            user=user,
            metadata={
                "quantity": item.quantity,
                "line_total": float(line_total),
            },
        )
    session.commit()

    response_payload = {
        "order": {
            "id": order.id,
            "status": order.status,
            "total_amount": float(total),
            "currency": currency,
            "reference": f"ORD-{order.id:05d}",
            "created_at": order.created_at.isoformat() if order.created_at else None,
        },
        "cart": _serialize_cart(_load_cart_with_items(new_cart.id) or new_cart),
    }
    return jsonify(response_payload)


__all__ = ["cart_bp"]
