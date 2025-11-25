# Project Backlog

## Milestone M1: Deployable Basic Web Application

Goal: A fully working, containerized and Azure-deployable online shop SPA with product catalog, product details, cart, authentication, interaction tracking, and placeholder recommendations.

### Epic M1-E1: Core Project & Environment Setup
- Define repository structure (e.g., `backend/`, `frontend/`, infra folders).
- Initialize base Flask backend application and configuration loading.
- Initialize base React SPA with routing and layout shell.
- Add `.gitignore`, initial `README`, and basic developer setup instructions.

### Epic M1-E2: Database Schema & Seeded Catalog
- Design PostgreSQL schema for users, products, carts, cart items, orders (basic), and interactions.
- Set up database migrations (e.g., Alembic) for schema management.
- Create seed script for a realistic sample product catalog.
- Configure local DB connection and integration with the backend.

### Epic M1-E3: Product Catalog & Details API
- Implement backend endpoint to list products with pagination and basic filters/sorting.
- Implement backend endpoint to fetch single product details.
- Implement simple rule-based "related products" or "you may also like" logic (non-ML).

### Epic M1-E4: Product Browsing & Details UI
- Build frontend catalog page with product list/grid powered by the catalog API.
- Build frontend product detail page showing key product information and CTAs.
- Implement navigation between home, catalog, and product detail pages.
- Implement search and filter UI integrated with the catalog API.

### Epic M1-E5: User Authentication
- Implement backend registration, login, and logout endpoints (Flask + JWT or sessions).
- Implement secure password hashing and basic validation.
- Create frontend signup and login pages with validation and error handling.
- Implement authenticated session management and protected routes in the SPA.

### Epic M1-E6: Shopping Cart Functionality
- Implement backend cart endpoints (get cart, add item, update quantity, remove item, clear cart).
- Ensure cart is persisted per authenticated user.
- Implement "Add to cart" actions from catalog and product detail views.
- Build cart page with editable items, totals, and a simple "mock checkout" confirmation flow.

### Epic M1-E7: Interaction Tracking for Recommendations
- Design data model for user–product interactions (view, click, add-to-cart, pseudo-purchase).
- Implement backend hooks/endpoints to record interactions.
- Add frontend instrumentation to send interaction events to the backend.
- Provide a simple dev/admin mechanism (view or script) to inspect recorded interactions.

### Epic M1-E8: Placeholder Recommendations
- Implement backend recommendation endpoint returning rule-based or popularity/random products.
- Make placeholder recommendation logic configurable and easy to swap in Milestone 2.
- Build frontend components to display recommendations (e.g., carousel/sections).
- Surface recommendations on the home page and product detail pages.

### Epic M1-E9: UI/UX Polish & Error Handling
- Establish base styling/theme and layout (desktop-first experience).
- Implement loading and error states for key user flows (catalog, details, auth, cart).
- Add 404 and generic error pages.
- Improve accessibility and responsiveness to a reasonable desktop-focused level.

### Epic M1-E10: Containerization & Local Orchestration
- Create Dockerfile for the backend application.
- Create Dockerfile or containerized build for the frontend (or static build served separately).
- Set up Docker Compose/Podman configuration to run backend, frontend, and PostgreSQL together locally.
- Define environment variable strategy and provide `.env`/`.env.example` files.

### Epic M1-E11: Azure Deployment & Basic CI/CD
- Define target Azure resources for this milestone (backend App Service, frontend hosting, Azure Database for PostgreSQL flexible server).
- Create basic infrastructure-as-code or scripts to provision a single deployment environment.
- Configure GitHub Actions workflow to build containers, run quick checks, and deploy to Azure.
- Wire secrets and connection strings via GitHub and Azure configuration.

### Epic M1-E12: Basic Testing & Documentation
- Implement a minimal set of backend API tests for catalog, auth, and cart.
- Implement a few frontend tests for critical components or user flows.
- Update `README` with local development (plain and Docker) and deployment instructions.
- Document the high-level architecture and major components.

---

## Milestone M2: Machine Learning Recommendations

Goal: Replace placeholder recommendations with ML-based ones, using collected interaction data, and integrate ML into the existing deployed app.

### Epic M2-E1: Data Extraction & Preparation
- Extract interaction data and product metadata from PostgreSQL.
- Build preprocessing pipeline using Pandas/NumPy to create training datasets.
- Define train/validation/test splits and perform basic data quality checks.
- Document data assumptions, limitations, and preprocessing steps.

### Epic M2-E2: Baseline ML Recommendation Model
- Implement a first ML recommender (e.g., popularity-based or simple collaborative filtering).
- Create a training script using scikit-learn or custom algorithms.
- Define and compute offline evaluation metrics (e.g., precision@k, recall@k).
- Serialize trained model artifacts for serving.

### Epic M2-E3: Enhanced/Iterative Recommendation Models
- Add at least one more recommendation strategy (content-based or improved CF).
- Perform feature engineering with product attributes (categories, tags, etc.).
- Compare models using consistent metrics and select a primary model.
- Document trade-offs, limitations, and model selection rationale.

### Epic M2-E4: Model Serving Integration
- Implement backend service layer to load the chosen model and generate recommendations.
- Replace placeholder recommendation endpoint with ML-backed logic.
- Implement fallback behavior for sparse data or model issues.
- Introduce simple configuration or versioning for models.

### Epic M2-E5: Training & Update Workflow
- Create end-to-end training pipeline script/notebook from DB to model artifact.
- Define manual or scheduled procedure to retrain on new interaction data.
- Store trained models in a suitable location (e.g., Azure Blob Storage).
- Document how to retrain and roll out a new model version.

### Epic M2-E6: ML Observability & Evaluation in Production
- Capture basic production metrics (e.g., recommendation usage, click-through rates).
- Provide simple dashboards or reports (even manual) to compare offline vs. online behavior.
- Implement guardrails and fallbacks if recommendation quality degrades.
- Document guidelines for future improvements and experimentation.
