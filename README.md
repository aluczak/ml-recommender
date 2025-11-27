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
1. Install Python 3.11+, Node.js 20+, Docker Desktop (for containers), and Azure CLI (for later deployment).
2. Create a virtual environment inside `.venv` or similar and install backend requirements (to be added once the backend skeleton lands).
3. Inside `frontend/`, initialize the React SPA (Milestone 1 task) and install dependencies with your package manager of choice.
4. Use `backlog.json` as the single source of truth for upcoming features and track progress via GitHub issues/projects.

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

### Frontend (React SPA)
```
cd frontend
npm install

# Run linters / formatters
npm run lint
npm run lint:fix
npm run format:check
npm run format
```
ESLint (`.eslintrc.cjs`) and Prettier (`.prettierrc.json`) are preconfigured for a React + TypeScript stack, enabling consistent code style once the SPA scaffold is in place.

## Next Steps
- Bootstrap backend app factory with configuration loading and health endpoint.
- Scaffold the React SPA with routing and layout.
- Keep updating this README as major components (local orchestration, deployment flows, ML integration) are implemented.
