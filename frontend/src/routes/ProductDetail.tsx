import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { formatPrice } from "../utils/format";
import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { sendInteraction } from "../utils/interactions";

const RELATED_LIMIT = 4;

const fallbackImage = "https://placehold.co/800x600?text=Product";

type FetchState = "idle" | "loading" | "loaded" | "error";

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [status, setStatus] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartMessageType, setCartMessageType] = useState<"success" | "error" | null>(null);
  const { addItem, mutating } = useCart();
  const { user, token } = useAuth();
  const viewLoggedRef = useRef<number | null>(null);

  const productUrl = useMemo(() => {
    if (!productId) {
      return null;
    }
    return `${API_BASE_URL}/products/${productId}`;
  }, [productId]);

  const relatedUrl = useMemo(() => {
    if (!productId) {
      return null;
    }
    return `${API_BASE_URL}/products/${productId}/related?limit=${RELATED_LIMIT}`;
  }, [productId]);

  const loadProduct = useCallback(async (signal?: AbortSignal) => {
    if (!productUrl) {
      throw new Error("Product id is missing from the URL.");
    }
    const response = await fetch(productUrl, { signal });
    if (!response.ok) {
      let message = `Unable to load product (status ${response.status})`;
      try {
        const body = await response.json();
        if (typeof body?.error === "string") {
          message = body.error;
        }
      } catch {
        // ignore parsing issues
      }
      throw new Error(message);
    }
    return (await response.json()) as Product;
  }, [productUrl]);

  const loadRelated = useCallback(async (signal?: AbortSignal) => {
    if (!relatedUrl) {
      return [];
    }
    const response = await fetch(relatedUrl, { signal });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data?.items) ? (data.items as Product[]) : [];
  }, [relatedUrl]);

  const hydratePage = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    setError(null);
    setProduct(null);
    setRelated([]);
    try {
      const detail = await loadProduct(signal);
      setProduct(detail);
      const relatedItems = await loadRelated(signal);
      setRelated(relatedItems);
      setStatus("loaded");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Unexpected error loading product.";
      setError(message);
      setStatus("error");
    }
  }, [loadProduct, loadRelated]);

  useEffect(() => {
    const controller = new AbortController();
    hydratePage(controller.signal);
    return () => controller.abort();
  }, [hydratePage]);

  useEffect(() => {
    if (product && viewLoggedRef.current !== product.id) {
      viewLoggedRef.current = product.id;
      sendInteraction(
        {
          productId: product.id,
          interactionType: "view",
          metadata: { source: "product_detail" },
        },
        token
      );
    }
  }, [product, token]);

  const isLoading = status === "loading" && !product;

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }
    if (!user) {
      setCartMessage("Log in to add items to your cart.");
      setCartMessageType("error");
      return;
    }
    setCartMessage(null);
    setCartMessageType(null);
    try {
      await addItem(product.id, 1);
      setCartMessage(`${product.name} added to your cart.`);
      setCartMessageType("success");
      sendInteraction(
        {
          productId: product.id,
          interactionType: "add_to_cart",
          metadata: { source: "product_detail" },
        },
        token
      );
    } catch (err) {
      setCartMessage(
        err instanceof Error ? err.message : "Unable to add this item right now."
      );
      setCartMessageType("error");
    }
  };

  const logProductClick = (targetProductId: number, source: string) => {
    sendInteraction(
      {
        productId: targetProductId,
        interactionType: "click",
        metadata: { source },
      },
      token
    );
  };

  return (
    <section className="product-detail">
      <div className="detail-header">
        <Link to="/catalog" className="breadcrumb">
          ← Back to catalog
        </Link>
      </div>

      {isLoading && <p className="status status-loading">Loading product…</p>}

      {status === "error" && error && (
        <div className="status status-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => hydratePage()}
          >
            Try again
          </button>
        </div>
      )}

      {product && (
        <article className="detail-card">
          <div className="detail-media">
            <img src={product.image_url || fallbackImage} alt={product.name} loading="lazy" />
          </div>
          <div className="detail-body">
            <p className="card-category">{product.category ?? "Uncategorized"}</p>
            <h1>{product.name}</h1>
            <p className="detail-description">{product.description}</p>
            <div className="product-meta">
              <span className="price">{formatPrice(product.price, product.currency)}</span>
              <span className="product-id">SKU #{product.id}</span>
            </div>
            <div className="product-actions">
              <button
                type="button"
                className="button"
                onClick={handleAddToCart}
                disabled={mutating}
              >
                {mutating ? "Adding…" : "Add to cart"}
              </button>
              <Link to="/cart" className="button button-secondary">
                Go to cart
              </Link>
            </div>
            {cartMessage && (
              <p
                className={`status ${
                  cartMessageType === "error" ? "status-error" : "status-success"
                }`}
              >
                {cartMessage}
              </p>
            )}
          </div>
        </article>
      )}

      {product && related.length > 0 && (
        <section className="related">
          <div className="related-header">
            <h2>Related products</h2>
            <p>Rule-based picks from the same category or nearest price.</p>
          </div>
          <div className="grid related-grid">
            {related.map((item) => (
              <article className="card" key={item.id}>
                <Link
                  to={`/catalog/${item.id}`}
                  className="card-link"
                  aria-label={`View ${item.name}`}
                  onClick={() => logProductClick(item.id, "related_grid")}
                >
                  <img
                    src={item.image_url || fallbackImage}
                    alt={item.name}
                    loading="lazy"
                  />
                  <div className="card-body">
                    <p className="card-category">{item.category ?? "Uncategorized"}</p>
                    <h3>{item.name}</h3>
                    <div className="card-footer">
                      <span className="price">{formatPrice(item.price, item.currency)}</span>
                      <span className="card-link-hint">View details →</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
};

export default ProductDetail;
