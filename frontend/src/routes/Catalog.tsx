import { useCallback, useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string | null;
  price: number;
  currency: string;
  image_url: string | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";
const PAGE_SIZE = 12;

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);

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
                  <button type="button" className="button button-ghost" disabled>
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Catalog;
