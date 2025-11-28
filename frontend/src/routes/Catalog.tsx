import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { formatPrice } from "../utils/format";
import type { Product } from "../types/product";
import { sendInteraction } from "../utils/interactions";
import { useAuth } from "../context/AuthContext";
import StatusMessage from "../components/StatusMessage";
import LoadingIndicator from "../components/LoadingIndicator";

const PAGE_SIZE = 12;

type SortBy = "name" | "price";
type SortDir = "asc" | "desc";

type CatalogParams = {
  page: number;
  pageSize: number;
  query: string;
  category: string;
  sortBy: SortBy;
  sortDir: SortDir;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  sort_by: SortBy;
  sort_dir: SortDir;
  category?: string | null;
  query?: string | null;
};

const createInitialParams = (): CatalogParams => ({
  page: 1,
  pageSize: PAGE_SIZE,
  query: "",
  category: "all",
  sortBy: "name",
  sortDir: "asc",
});

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<CatalogParams>(() => createInitialParams());
  const [searchInput, setSearchInput] = useState(params.query);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { token } = useAuth();

  const fetchProducts = useCallback(async (currentParams: CatalogParams, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(currentParams.page),
        page_size: String(currentParams.pageSize),
        sort_by: currentParams.sortBy,
        sort_dir: currentParams.sortDir,
      });
      if (currentParams.category && currentParams.category !== "all") {
        query.set("category", currentParams.category);
      }
      if (currentParams.query) {
        query.set("q", currentParams.query);
      }

      const response = await fetch(`${API_BASE_URL}/products?${query.toString()}`, { signal });
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

      const categoryList = data?.filters?.available_categories;
      if (Array.isArray(categoryList)) {
        setCategories(categoryList.filter((value): value is string => typeof value === "string" && value.length > 0));
      }

      setPagination(typeof data?.pagination === "object" ? (data.pagination as PaginationInfo) : null);
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
    fetchProducts(params, controller.signal);
    return () => controller.abort();
  }, [fetchProducts, params]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParams((prev) => ({ ...prev, page: 1, query: searchInput.trim() }));
  };

  const handleCategoryChange = (value: string) => {
    setParams((prev) => ({ ...prev, page: 1, category: value }));
  };

  const handleSortChange = (value: SortBy) => {
    setParams((prev) => ({ ...prev, page: 1, sortBy: value }));
  };

  const handleSortDirectionChange = (value: SortDir) => {
    setParams((prev) => ({ ...prev, page: 1, sortDir: value }));
  };

  const resetFilters = () => {
    setParams(createInitialParams());
    setSearchInput("");
  };

  const retryFetch = () => {
    setParams((prev) => ({ ...prev }));
  };

  const handleProductClick = (productId: number) => {
    sendInteraction(
      {
        productId,
        interactionType: "click",
        metadata: { source: "catalog_grid" },
      },
      token
    );
  };

  const totalItems = pagination?.total_items ?? products.length;
  const hasFiltersApplied = useMemo(
    () => Boolean(params.query || (params.category !== "all") || params.sortBy !== "name" || params.sortDir !== "asc"),
    [params]
  );

  return (
    <section className="catalog">
      <header>
        <h2>Catalog</h2>
        <p>Browse curated products served directly from the Flask API.</p>
      </header>

      <div className="catalog-controls">
        <form className="search-row" onSubmit={handleSearchSubmit}>
          <label className="visually-hidden" htmlFor="catalog-search">
            Search products
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Search by name or keywords"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="button">
            Search
          </button>
        </form>
        <div className="control-row">
          <label>
            <span className="control-label">Category</span>
            <select value={params.category} onChange={(event) => handleCategoryChange(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="control-label">Sort by</span>
            <select value={params.sortBy} onChange={(event) => handleSortChange(event.target.value as SortBy)}>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </label>
          <label>
            <span className="control-label">Order</span>
            <select value={params.sortDir} onChange={(event) => handleSortDirectionChange(event.target.value as SortDir)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
          {hasFiltersApplied && (
            <button type="button" className="button button-ghost" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </div>

      {!error && (
        <p className="catalog-meta">
          {loading
            ? "Fetching fresh results…"
            : `Showing ${products.length} of ${totalItems} product${totalItems === 1 ? "" : "s"}`}
        </p>
      )}

      {loading && (
        <StatusMessage variant="loading">
          <LoadingIndicator label="Loading catalog…" />
        </StatusMessage>
      )}

      {error && !loading && (
        <StatusMessage
          variant="error"
          role="alert"
          actions={
            <button type="button" className="button button-secondary" onClick={retryFetch}>
              Try again
            </button>
          }
        >
          {error}
        </StatusMessage>
      )}

      {!loading && !error && products.length === 0 && (
        <StatusMessage
          actions={
            <button type="button" className="button button-secondary" onClick={resetFilters}>
              Reset filters
            </button>
          }
        >
          No products available yet. Seed the database to get started.
        </StatusMessage>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid">
          {products.map((product) => (
            <article className="card" key={product.id}>
                <Link
                  to={`/catalog/${product.id}`}
                  className="card-link"
                  aria-label={`View ${product.name}`}
                  onClick={() => handleProductClick(product.id)}
                >
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
