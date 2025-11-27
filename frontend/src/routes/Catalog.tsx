import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { formatPrice } from "../utils/format";
import type { Product } from "../types/product";

const PAGE_SIZE = 12;

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/products?page=1&page_size=${PAGE_SIZE}`,
        { signal }
      );
      if (!response.ok) {
        let message = `Unable to load products (status ${response.status})`;
        try {
          const body = await response.json();
          if (typeof body?.error === "string") {
            message = body.error;
          }
        } catch {
          // ignore JSON errors
        }
        throw new Error(message);
      }
      const data = await response.json();
      setProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Unexpected error loading products.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  return (
    <section className="catalog">
      <header>
        <h2>Catalog</h2>
        <p>Browse curated products served directly from the Flask API.</p>
      </header>

      {loading && <p className="status status-loading">Loading catalog…</p>}

      {error && !loading && (
        <div className="status status-error" role="alert">
          <p>{error}</p>
          <button type="button" className="button button-secondary" onClick={() => loadProducts()}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="status">No products available yet. Seed the database to get started.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid">
          {products.map((product) => (
            <article className="card" key={product.id}>
              <Link to={`/catalog/${product.id}`} className="card-link" aria-label={`View ${product.name}`}>
                <img
                  src={product.image_url || "https://placehold.co/600x400?text=Product"}
                  alt={product.name}
                  loading="lazy"
                />
                <div className="card-body">
                  <p className="card-category">{product.category ?? "Uncategorized"}</p>
                  <h3>{product.name}</h3>
                  <p className="card-description">{product.description}</p>
                  <div className="card-footer">
                    <span className="price">{formatPrice(product.price, product.currency)}</span>
                    <span className="card-link-hint">View details →</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Catalog;
