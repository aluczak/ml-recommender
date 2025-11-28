import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";
import { sendInteraction } from "../utils/interactions";
import { useAuth } from "../context/AuthContext";

const fallbackImage = "https://placehold.co/800x600?text=Product";

type FetchState = "idle" | "loading" | "loaded" | "error";

type RecommendationsSectionProps = {
  title: string;
  description?: string;
  context?: "home" | "product";
  productId?: number;
  limit?: number;
  interactionSource?: string;
  emptyState?: string;
};

const RecommendationsSection = ({
  title,
  description,
  context = "home",
  productId,
  limit = 4,
  interactionSource = "recommendations",
  emptyState = "No recommendations available right now.",
}: RecommendationsSectionProps) => {
  const [items, setItems] = useState<Product[]>([]);
  const [status, setStatus] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ context, limit: String(limit) });
    if (context === "product" && productId) {
      params.set("product_id", String(productId));
    }
    return `${API_BASE_URL}/recommendations?${params.toString()}`;
  }, [context, limit, productId]);

  useEffect(() => {
    if (context === "product" && !productId) {
      setItems([]);
      setStatus("idle");
      setError(null);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    const loadRecommendations = async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load recommendations (status ${response.status})`);
        }
        const data = await response.json();
        if (!Array.isArray(data?.items)) {
          throw new Error("Recommendations payload is invalid.");
        }
        setItems(data.items as Product[]);
        setStatus("loaded");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Unable to load recommendations.";
        setError(message);
        setStatus("error");
      }
    };

    loadRecommendations();

    return () => controller.abort();
  }, [context, endpoint, productId]);

  const handleCardClick = (product: Product) => {
    sendInteraction(
      {
        productId: product.id,
        interactionType: "click",
        metadata: { source: interactionSource },
      },
      token
    );
  };

  return (
    <section className="recommendations">
      <div className="recommendations-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {status === "loading" && <p className="status status-loading">Loading suggestions…</p>}
      {status === "error" && error && (
        <p className="status status-error" role="alert">
          {error}
        </p>
      )}

      {status === "loaded" && items.length === 0 && (
        <p className="status">{emptyState}</p>
      )}

      {status === "loaded" && items.length > 0 && (
        <div className="grid recommendations-grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <Link
                to={`/catalog/${item.id}`}
                className="card-link"
                onClick={() => handleCardClick(item)}
                aria-label={`View ${item.name}`}
              >
                <img src={item.image_url || fallbackImage} alt={item.name} loading="lazy" />
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
      )}
    </section>
  );
};

export default RecommendationsSection;
