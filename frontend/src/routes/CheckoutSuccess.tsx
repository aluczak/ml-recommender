import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { CheckoutOrder } from "../types/cart";
import { formatPrice } from "../utils/format";

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = (location.state as CheckoutOrder | undefined) || null;

  useEffect(() => {
    if (!order) {
      const timer = setTimeout(() => navigate("/cart"), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [navigate, order]);

  if (!order) {
    return (
      <section className="checkout-success">
        <div className="status">
          <p>No recent checkout found. Redirecting you back to the cart…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-success">
      <div className="auth-card">
        <header>
          <p className="eyebrow">Mock checkout complete</p>
          <h2>Thanks for testing the flow!</h2>
          <p>Use these details if you need to reference the order later.</p>
        </header>
        <dl className="order-details">
          <div>
            <dt>Reference</dt>
            <dd>{order.reference}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt>Total amount</dt>
            <dd>{formatPrice(order.total_amount, order.currency)}</dd>
          </div>
          {order.created_at && (
            <div>
              <dt>Created at</dt>
              <dd>{new Date(order.created_at).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        <div className="cta-row">
          <Link to="/catalog" className="button">
            Continue shopping
          </Link>
          <Link to="/cart" className="button button-secondary">
            Back to cart
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CheckoutSuccess;
