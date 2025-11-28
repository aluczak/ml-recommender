import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

const Cart = () => {
  const { user } = useAuth();
  const { cart, loading, error, mutating, updateItem, removeItem, checkout, refreshCart } = useCart();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const requireAuthMessage = !user ? (
    <div className="status">
      <p>You need to log in to manage your cart.</p>
      <div className="cta-row">
        <Link to="/login" className="button">
          Log in
        </Link>
        <Link to="/signup" className="button button-secondary">
          Create account
        </Link>
      </div>
    </div>
  ) : null;

  const handleQuantity = async (itemId: number, nextQuantity: number) => {
    setActionError(null);
    try {
      if (nextQuantity <= 0) {
        await removeItem(itemId);
        return;
      }
      await updateItem(itemId, nextQuantity);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update quantity right now.");
    }
  };

  const handleRemove = async (itemId: number) => {
    setActionError(null);
    try {
      await removeItem(itemId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to remove item right now.");
    }
  };

  const handleCheckout = async () => {
    setActionError(null);
    setCheckingOut(true);
    try {
      const result = await checkout();
      navigate("/cart/confirmation", { state: result.order });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user) {
    return (
      <section className="cart-page">
        <header>
          <h2>Your cart</h2>
          <p>Access your saved items after logging in.</p>
        </header>
        {requireAuthMessage}
      </section>
    );
  }

  return (
    <section className="cart-page">
      <header>
        <h2>Your cart</h2>
        <p>All items are stored server-side so you keep progress across sessions.</p>
      </header>

      {loading && <p className="status status-loading">Loading cart…</p>}
      {error && !loading && (
        <div className="status status-error" role="alert">
          <p>{error}</p>
          <button type="button" className="button button-secondary" onClick={() => refreshCart()}>
            Retry
          </button>
        </div>
      )}

      {cart && cart.items.length === 0 && !loading && (
        <div className="status">
          <p>Your cart is empty. Browse the catalog to add items.</p>
          <Link to="/catalog" className="button">
            Explore catalog
          </Link>
        </div>
      )}

      {actionError && (
        <div className="status status-error" role="alert">
          <p>{actionError}</p>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-media">
                  <img
                    src={item.product.image_url || "https://placehold.co/120x120?text=Product"}
                    alt={item.product.name}
                    loading="lazy"
                  />
                </div>
                <div className="cart-item-body">
                  <header>
                    <h3>{item.product.name}</h3>
                    <p className="cart-item-price">{formatPrice(item.product.price, item.product.currency)}</p>
                  </header>
                  <p className="cart-item-total">Line total: {formatPrice(item.line_total, cart.currency)}</p>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => handleQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || mutating}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => handleQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99 || mutating}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => handleRemove(item.id)}
                      disabled={mutating}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h3>Order summary</h3>
            <dl>
              <div className="summary-row">
                <dt>Items</dt>
                <dd>{cart.item_count}</dd>
              </div>
              <div className="summary-row">
                <dt>Subtotal</dt>
                <dd>{formatPrice(cart.subtotal, cart.currency)}</dd>
              </div>
            </dl>
            <p className="summary-note">Tax and shipping are skipped for this learning project.</p>
            <button
              type="button"
              className="button"
              disabled={mutating || checkingOut}
              onClick={handleCheckout}
            >
              {checkingOut ? "Processing…" : "Mock checkout"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
