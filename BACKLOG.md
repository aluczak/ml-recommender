# Project Backlog

## Milestone M1: Deployable Basic Web Application

Goal: A fully working, containerized and Azure-deployable online shop SPA with product catalog, product details, cart, authentication, interaction tracking, and placeholder recommendations.

### Epic M1-E1: Core Project & Environment Setup
- Define repository structure (e.g., `backend/`, `frontend/`, infra folders).
- Initialize base Flask backend application and configuration loading.
- Initialize base React SPA with routing and layout shell.
- Add `.gitignore`, initial `README`, and basic developer setup instructions.

#### Features and User Stories

**Feature M1-E1-F1: Repository Structure and Base Docs**

- **User Story M1-E1-F1-S1:** As a developer, I want a clear repository structure so that I can easily navigate backend, frontend, and infrastructure code.
	- Acceptance criteria:
		- Repository has top-level folders (e.g., `backend/`, `frontend/`, `infra/` or `scripts/`).
		- `BACKLOG.md` and existing planning files are kept in a consistent location (e.g., root or `.github/`).
		- Structure is briefly described in the `README`.

- **User Story M1-E1-F1-S2:** As a developer, I want basic documentation so that I know how to get started with the project.
	- Acceptance criteria:
		- `README.md` exists with project overview, tech stack, and goals.
		- `README.md` includes a high-level description of milestones and where to find the backlog.
		- Contributors can clone the repo and understand where to look for backend and frontend code.

**Feature M1-E1-F2: Backend Skeleton (Flask) and Configuration**

- **User Story M1-E1-F2-S1:** As a developer, I want a minimal Flask application skeleton so that I can add APIs without worrying about basic setup.
	- Acceptance criteria:
		- A Flask app is created in `backend/` with an application factory or main app module.
		- A simple health/check endpoint (e.g., `/health`) responds with 200.
		- The app can be started locally with a single command (e.g., `flask run` or `python -m backend`).

- **User Story M1-E1-F2-S2:** As a developer, I want centralized configuration management so that environment-specific settings are easy to control.
	- Acceptance criteria:
		- Configuration is loaded from environment variables and/or config files.
		- There is a clear pattern for settings like DB URL, secret keys, and debug flags.
		- Local configuration example (`.env.example` or similar) is provided.

- **User Story M1-E1-F2-S3:** As a developer, I want backend dependencies defined so that I can install them consistently.
	- Acceptance criteria:
		- A dependency file exists for backend (e.g., `backend/requirements.txt` or `pyproject.toml`).
		- It includes Flask and any other core libraries needed for the skeleton.
		- Installation instructions for backend dependencies are in the `README`.

**Feature M1-E1-F3: Frontend React SPA Skeleton**

- **User Story M1-E1-F3-S1:** As a user, I want to see a basic web UI so that I know the application is running.
	- Acceptance criteria:
		- React SPA is bootstrapped in `frontend/` (e.g., Vite or CRA).
		- Opening the app in the browser shows a simple home page with a placeholder message (e.g., "ML Recommender Shop").

- **User Story M1-E1-F3-S2:** As a developer, I want routing set up in the SPA so that I can easily add new pages later.
	- Acceptance criteria:
		- Client-side routing is configured (e.g., React Router).
		- At least two routes exist (e.g., `/` and `/placeholder-catalog`).
		- Navigating between routes works without full page reloads.

- **User Story M1-E1-F3-S3:** As a developer, I want frontend dependencies and scripts defined so that I can run and build the SPA consistently.
	- Acceptance criteria:
		- `frontend/package.json` defines scripts for `dev`, `build`, and `test` (even if tests are placeholders).
		- `npm install` or `pnpm install` sets up all required dependencies.
		- `README` documents how to run the frontend in development mode.

**Feature M1-E1-F4: Development Environment & Tooling**

- **User Story M1-E1-F4-S1:** As a developer, I want a standard `.gitignore` so that unnecessary files are not committed to the repository.
	- Acceptance criteria:
		- `.gitignore` exists at the repo root.
		- It covers Python, Node/React, IDE, and OS-specific files (e.g., `__pycache__`, `node_modules`, `.env`, `.vscode`).

- **User Story M1-E1-F4-S2:** As a developer, I want a straightforward local setup process so that I can get the app running quickly.
	- Acceptance criteria:
		- `README` includes step-by-step instructions to:
			- Clone the repo.
			- Set up backend environment and install dependencies.
			- Set up frontend environment and install dependencies.
			- Run backend and frontend together in dev mode (even if separate commands).
		- The steps are tested and known to work on the target environment (Windows + pwsh).

- **User Story M1-E1-F4-S3:** As a developer, I want basic formatting/linting scripts so that the codebase stays reasonably clean.
	- Acceptance criteria:
		- Chosen tools are documented (e.g., `black` for Python, `eslint`/`prettier` for JS/TS).
		- Simple commands exist to run them (e.g., `make format`, `npm run lint`, or documented equivalent).
		- It is clear which tools are recommended vs optional for this learning project.

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
