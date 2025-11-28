# ML Recommender Shop

Training project that builds a container-ready online shop with a React SPA frontend, Flask backend, PostgreSQL database, and machine-learning-driven recommendations. Milestone 1 delivers a fully working shop with placeholder recommendations; Milestone 2 replaces the placeholder logic with real ML models and deploys everything to Azure.

## Goals
- Learn modern full-stack development (React SPA + Flask API + PostgreSQL)
- Capture and seed catalog data that can drive shopping flows and future ML work
- Instrument interactions so the dataset is ready for experimentation
- Ship the stack in containers with Docker Compose locally and Azure (App Service + PostgreSQL flexible server) in the cloud

## Tech Stack
- **Frontend:** React, TypeScript, Vite (target), CSS Modules or Tailwind (TBD)
- **Backend:** Python 3.11, Flask, SQLAlchemy, Alembic
- **Database:** PostgreSQL
- **Machine Learning:** Pandas, NumPy, scikit-learn, Azure ML Studio (Milestone 2)
- **Infrastructure & Deployment:** Docker, Docker Compose, Terraform, GitHub Actions, Azure App Service

## Repository Structure
```
backend/    # Flask application source (API, models, migrations)
frontend/   # React SPA source (catalog UI, cart, auth flows)
infra/      # Terraform and deployment descriptors for Azure resources
scripts/    # Utility scripts (data seeding, interaction export, etc.)
backlog.json# Structured backlog that mirrors milestones/epics/user stories
```

## Getting Started
1. Install Python 3.11+ (pyenv defaults to 3.12.2 via `.python-version`; a small compatibility shim keeps SQLAlchemy/Alembic working on Python 3.13/3.14), Node.js 20+, Docker Desktop (for containers), and Azure CLI (for later deployment).
2. Create a virtual environment inside `.venv` or similar and install backend requirements via `pip install -r requirements.txt -r requirements-dev.txt` (see Backend section below).
3. Apply the initial Alembic migration (`alembic upgrade head`) so the database schema exists locally.
4. Seed the catalog with curated sample products (`python scripts/seed_products.py --reset` from the `backend/` folder) so the UI/API have data to display.
5. Inside `frontend/`, install Node dependencies (`npm install`) and run the SPA locally via `npm run dev`.
6. Use `backlog.json` as the single source of truth for upcoming features and track progress via GitHub issues/projects.

## Code Quality & Tooling
### Backend (Flask)
```
cd backend
python -m venv .venv && .venv\Scripts\activate  # or source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

# Check formatting & lint
black .
ruff check .

# Autofix lint findings when available
ruff check . --fix
```
Tooling lives in `backend/pyproject.toml`, so IDEs can pick up consistent Black/Ruff settings automatically.

### Backend runtime
```
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt

# Copy env template if you need overrides
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Run the dev server (http://127.0.0.1:5000/ and /api/health)
flask --app app:create_app --debug run
# or
python run.py
```
The Flask app loads configuration from environment variables (optionally via `.env`). Customize `APP_ENV`, `FLASK_DEBUG`, `SECRET_KEY`, or `DATABASE_URL` as needed. A lightweight compatibility shim (`app/typing_compat.py`) patches SQLAlchemy's typing helpers so Alembic continues to run even on Python 3.13/3.14.

- Cross-origin requests: `flask-cors` is enabled for `/api/*` endpoints by default so the Vite dev server (`http://localhost:5173`) can talk to `http://localhost:5000`. Adjust CORS settings in `app/__init__.py` if you need stricter origins.
- Access tokens: `ACCESS_TOKEN_EXP_MINUTES` controls how long issued login tokens remain valid (default 60 minutes). Tokens are lightweight signed strings (itsdangerous) so no additional infrastructure is required.

### Database & migrations
```
cd backend
alembic upgrade head                      # Apply latest schema
alembic revision -m "describe change" --autogenerate  # Generate new migration
```
- Default dev database is SQLite at `backend/instance/app.db`; override `DATABASE_URL` for PostgreSQL (e.g., `postgresql+psycopg://user:pass@localhost:5432/mlshop`).
- Delete `instance/app.db` and rerun `alembic upgrade head` if you want a clean slate locally.

### Sample data seeding
```
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python scripts/seed_products.py --reset
```
- `--reset` clears any existing products before inserting the curated dataset; omit the flag to upsert without deleting.
- Seed data is defined in `app/data/sample_products.py` and covers multiple categories/price ranges for UI and ML experimentation.

### REST API (dev snapshot)
- `GET /api/health` – simple service heartbeat
- `POST /api/auth/register` – create an account with `{email, password, full_name?}`; returns the created user plus an access token. Duplicate emails are rejected with `409`.
- `POST /api/auth/login` – exchange `{email, password}` for an access token (Bearer) and user payload. Invalid credentials respond with `401`.
- `GET /api/auth/me` – requires an `Authorization: Bearer <token>` header and returns the profile for the authenticated user; `401` when the token is missing/invalid/expired.
- `POST /api/interactions` – logs `view`, `click`, `add_to_cart`, `update_cart`, or `pseudo_purchase` events for a specific product. Accepts optional Bearer token (anonymous interactions are supported via metadata-only logging).
- `GET /api/cart` – returns the user's open cart (auto-creates an empty one). Requires Bearer token.
- `POST /api/cart/items` – add or increment a product in the cart: `{product_id, quantity}`.
- `PATCH /api/cart/items/{item_id}` – adjust quantity (set to `0` to remove); limited to the owner's open cart.
- `DELETE /api/cart/items/{item_id}` – remove an item entirely.
- `POST /api/cart/checkout` – mock checkout that marks the current cart submitted, creates a lightweight order record, and provisions a fresh empty cart for continued browsing.
- `GET /api/products?page=<n>&page_size=<n>&category=<name>&sort_by=name|price&sort_dir=asc|desc&q=<keywords>` – paginated catalog response with optional search, category filter, and sorting (defaults: page 1, 12 items, sort by name asc). Responses also include `filters.available_categories` so the SPA can render the current taxonomy without hardcoding it.
- `GET /api/products/{id}` – full details for a single product, returns 404 + error JSON when not found
- `GET /api/products/{id}/related?limit=<n>` – rule-based related items (same category when possible, otherwise price-proximate fallbacks)
- `GET /api/recommendations?context=home|product&product_id=<id>&limit=<n>` – placeholder recommendations ranked by recent interaction volume (general for home, category-focused for product detail). The logic lives in `app/services/recommendations.py` so it can be swapped with ML-driven scoring later.

### Frontend (React SPA)
```
cd frontend
npm install

# Run the Vite dev server (http://localhost:5173)
npm run dev

# Build & preview production assets
npm run build
npm run preview

# Run linters / formatters
npm run lint
npm run lint:fix
npm run format:check
npm run format
```
The SPA uses Vite + React Router with a flat-configured ESLint (`eslint.config.js`) and Prettier (`.prettierrc.json`) for consistent code style.

- Frontend reads `VITE_API_BASE_URL` (see `frontend/.env.example`) to decide which backend `/api` host to call. Defaults to `http://localhost:5000/api` for local dev.
- Login/signup routes (`/login`, `/signup`) talk to the new auth endpoints, persist the returned token in `localStorage`, and expose auth state throughout the SPA via a lightweight context (`AuthProvider`). Header navigation updates automatically when users log in/out.
- `/cart` lets authenticated users review their server-side cart, tweak quantities, remove items, and run a mock checkout. The UI talks to dedicated cart endpoints via a `CartProvider` that keeps token handling consistent.
- Product detail pages now include an "Add to cart" button that wires directly into the cart context; checkout success has a confirmation screen at `/cart/confirmation` summarizing the order reference returned by the API.
- Catalog/product detail/related card interactions fire `click`/`view`/`add_to_cart` events via a lightweight logger that uses `navigator.sendBeacon` when possible; backend cart mutations also log `update_cart` and `pseudo_purchase` events so the ML pipeline has both anonymous and authenticated signals.
- A refreshed design system (global CSS variables, gradients, cards, responsive layout) keeps the header, hero blocks, catalog grid, cart, and auth screens visually consistent without additional component libraries.
- Reusable `StatusMessage` and `LoadingIndicator` components render the loading/error/empty states for catalog, detail, auth, and cart flows so users always see what is happening.
- Home and product detail routes include a reusable `RecommendationsSection` component that calls `/api/recommendations`, shows rule-based placeholder suggestions, and emits interaction logs so the ML stack can later compare placeholder vs. learned behavior.
- The catalog route (`/catalog`) now includes a search box, category dropdown, and sort controls; every change re-queries the backend list endpoint so results stay in sync with API capabilities.

## Next Steps
- Flesh out catalog/database foundations and initial API endpoints.
- Keep updating this README as major components (local orchestration, deployment flows, ML integration) are implemented.
