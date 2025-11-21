## Plan: Azure ML Recommender Shop (React + Python)

A machine learning-powered online shop hosted on Azure, built with React/TypeScript frontend and Python/FastAPI backend. Focus on hands-on scikit-learn implementation for product recommendations with periodic batch processing, handling cold-start with synthetic data, and leveraging GitHub Copilot for accelerated development. PostgreSQL for persistence with pre-computed recommendation cache refreshed on configurable schedule.

### Milestones

#### **Milestone 1: Azure Infrastructure & Project Bootstrap**

**Epic 1.1: Repository & Monorepo Setup**
- Set up monorepo structure with `backend/` and `frontend/` directories
- Create `backend/requirements.txt` with FastAPI, SQLAlchemy, psycopg2, scikit-learn, pandas, Azure SDKs, APScheduler
- Initialize React TypeScript app in `frontend/` with Vite or Create React App
- Configure `frontend/package.json` with axios, react-router-dom, zustand, tailwindcss
- Create root `.gitignore` for Python, Node, and Azure artifacts

**Epic 1.2: Azure Resources Provisioning**
- Provision Azure Database for PostgreSQL Flexible Server (Burstable tier for development)
- Create Azure Blob Storage account for ML models and synthetic datasets
- Set up Azure Key Vault for database credentials and connection strings
- Provision Azure App Service (Python 3.11+) for backend API with Always On enabled
- Create Azure Function App (Python) for scheduled recommendation generation OR use WebJobs
- Provision Azure Static Web Apps for React frontend

**Epic 1.3: Local Development Environment**
- Configure `backend/app/database.py` with SQLAlchemy engine and PostgreSQL connection
- Create Alembic migrations setup in `backend/alembic/`
- Set up CORS configuration in FastAPI for local React development
- Create `.env` files for local development (DB credentials, Azure storage keys, schedule config)
- Test Azure connectivity from local environment using DefaultAzureCredential

#### **Milestone 2: Database Schema & Synthetic Data Generation**

**Epic 2.1: PostgreSQL Schema Design**
- Create `backend/app/models/product.py` SQLAlchemy model with product_id, name, description, category, price, metadata JSONB
- Create `backend/app/models/user.py` SQLAlchemy model with user_id, email, created_at
- Create `backend/app/models/interaction.py` model for interaction_id, user_id, product_id, interaction_type, value, timestamp
- Create `backend/app/models/recommendation_cache.py` with user_id, recommended_products JSONB, generated_at, model_version, status fields
- Create `backend/app/models/batch_job.py` for job_id, job_type, status, started_at, completed_at, error_message, metrics JSONB
- Generate Alembic migrations and apply to Azure PostgreSQL

**Epic 2.2: Synthetic Data Generator**
- Build `backend/app/data/product_generator.py` to create 500-1000 products across 10-15 categories using Faker
- Generate realistic product descriptions, prices ($5-$500), and metadata JSONB (brand, specs, tags)
- Build `backend/app/data/user_generator.py` to create 200-500 synthetic users
- Build `backend/app/data/interaction_simulator.py` to generate user behavior patterns (views, purchases, ratings) with realistic distributions
- Create seeding script to populate Azure PostgreSQL and upload raw data to Azure Blob Storage
- Add data versioning (timestamp-based folders in Blob Storage)

**Epic 2.3: Data Validation & Exploration**
- Create Jupyter notebook `backend/notebooks/01_data_exploration.ipynb` to visualize distributions
- Validate interaction sparsity, category balance, and user engagement patterns
- Export summary statistics to Azure Blob Storage

#### **Milestone 3: Backend API Foundation**

**Epic 3.1: FastAPI Application Structure**
- Create `backend/app/main.py` with FastAPI app initialization and CORS middleware
- Build `backend/app/api/dependencies.py` for database session management (get_db dependency)
- Configure Uvicorn server settings for async operations
- Set up health check endpoint `/health` for Azure monitoring

**Epic 3.2: CRUD API Endpoints**
- Create `backend/app/schemas/product.py` Pydantic models for request/response validation
- Build `backend/app/api/routes/products.py` with GET `/api/products` (list, pagination), GET `/api/products/{id}`, POST `/api/products`
- Create `backend/app/schemas/user.py` and `backend/app/api/routes/users.py` with user CRUD
- Build `backend/app/api/routes/interactions.py` for POST `/api/interactions` (track views/purchases/ratings)
- Add query filtering (category, price range) and sorting to product endpoints

**Epic 3.3: Configuration Management**
- Create `backend/app/config.py` with Pydantic Settings for environment variables
- Add configuration fields: RECOMMENDATION_BATCH_INTERVAL (default 3600s), BATCH_SIZE, MODEL_VERSION, CACHE_TTL
- Load configuration from Azure Key Vault or environment variables
- Build GET `/api/config/batch-schedule` endpoint to expose current schedule settings
- Add PUT `/api/config/batch-schedule` endpoint for runtime schedule updates (admin only)

**Epic 3.4: API Testing & Documentation**
- Leverage FastAPI auto-generated Swagger UI at `/docs`
- Write integration tests in `backend/tests/test_api.py` using pytest and httpx
- Test Azure PostgreSQL connectivity and CRUD operations

#### **Milestone 4: Feature Engineering Pipeline**

**Epic 4.1: Data Extraction from PostgreSQL**
- Build `backend/app/ml/data_loader.py` to query interactions table and construct user-item interaction matrix
- Create functions to fetch product features (category, price, description) as DataFrames
- Implement sparse matrix creation for memory efficiency (scipy.sparse)

**Epic 4.2: Feature Engineering Modules**
- Create `backend/app/ml/feature_engineering.py` with TfidfVectorizer for product descriptions (max_features=500, stop_words='english')
- Build category one-hot encoding and price normalization functions
- Generate user preference vectors from interaction history (weighted by interaction_type)
- Construct item similarity matrix using cosine_similarity on product features
- Save feature matrices to Azure Blob Storage as `.npz` (sparse) and `.pkl` (models)

**Epic 4.3: Feature Store Management**
- Build `backend/app/ml/feature_store.py` to upload/download feature artifacts from Azure Blob Storage
- Implement versioning strategy (timestamp or version number in blob names)
- Create scheduled job logic (placeholder) for periodic feature recomputation

#### **Milestone 5: Recommender Models (scikit-learn)**

**Epic 5.1: Collaborative Filtering Implementation**
- Create `backend/app/ml/collaborative_filtering.py` with NearestNeighbors for user-based CF
- Implement fit method on user-item interaction matrix (sparse format)
- Build predict method to find K nearest neighbors and aggregate their item preferences
- Handle cold-start for new users with popularity-based fallback
- Create Jupyter notebook `backend/notebooks/02_collaborative_filtering.ipynb` for experimentation and parameter tuning

**Epic 5.2: Content-Based Filtering Implementation**
- Create `backend/app/ml/content_based.py` using TF-IDF product features
- Compute item-item similarity matrix with cosine_similarity
- Implement recommendation method: given user's purchase history, recommend similar items
- Add category affinity scoring (user's preferred categories)
- Create notebook `backend/notebooks/03_content_based.ipynb` for evaluation

**Epic 5.3: Hybrid Recommender System**
- Build `backend/app/ml/hybrid_recommender.py` combining CF and content-based scores
- Implement weighted ensemble (e.g., 0.6 * CF + 0.4 * content-based)
- Add business rules: filter out-of-stock items, apply price range constraints
- Implement diversity penalty to avoid recommending too-similar products
- Train and serialize models with joblib, upload to Azure Blob Storage

**Epic 5.4: Model Evaluation Framework**
- Create `backend/app/ml/evaluation.py` with precision@K, recall@K, NDCG metrics
- Implement train/test split preserving temporal ordering (80/20 split by timestamp)
- Build offline evaluation pipeline in notebook `backend/notebooks/04_evaluation.ipynb`
- Compare CF vs content-based vs hybrid performance
- Document best model configuration

#### **Milestone 6: Batch Recommendation Generation System**

**Epic 6.1: Batch Job Infrastructure**
- Create `backend/app/batch/recommendation_generator.py` with main batch processing logic
- Implement batch job execution: load models from Azure Blob, query active users, generate recommendations for all users in batches
- Build `backend/app/batch/job_tracker.py` to create batch_job records (status: pending → running → completed/failed)
- Add error handling, retry logic, and progress tracking (log every N users processed)
- Implement bulk upsert to `recommendation_cache` table using SQLAlchemy batch operations

**Epic 6.2: Scheduler Setup**
- Add APScheduler to `backend/app/scheduler.py` with configurable interval from config
- Create scheduled job that triggers `recommendation_generator.batch_generate_recommendations()`
- Implement singleton pattern to prevent overlapping job executions
- Add lifespan events in FastAPI to start/stop scheduler with app
- Build GET `/api/batch/jobs` endpoint to list recent batch job history with status and metrics

**Epic 6.3: Manual Trigger & Monitoring**
- Create POST `/api/batch/trigger` endpoint to manually start batch recommendation generation
- Add GET `/api/batch/status` endpoint showing current job status, progress percentage, ETA
- Build GET `/api/batch/logs/{job_id}` for detailed job execution logs
- Implement notification mechanism on batch completion (log to Application Insights)
- Add metrics tracking: processing time, users processed, cache hit rate improvement

**Epic 6.4: Azure Function Alternative (Optional)**
- Create separate `backend/batch_function/` directory for Azure Function implementation
- Build HTTP-triggered function `GenerateRecommendations` calling batch logic
- Configure Timer trigger with configurable cron expression (e.g., `0 0 */6 * * *` for every 6 hours)
- Deploy function app with connection to same PostgreSQL and Blob Storage
- Add function monitoring with Application Insights

#### **Milestone 7: Recommendation API Endpoints**

**Epic 7.1: Model Loading & Serving**
- Create `backend/app/ml/model_manager.py` to load trained models from Azure Blob Storage at startup
- Implement singleton pattern for in-memory model caching
- Add model version tracking and hot-reload capability

**Epic 7.2: Cache-First Recommendation Endpoints**
- Build GET `/api/recommendations/{user_id}` in `backend/app/api/routes/recommendations.py` reading from `recommendation_cache` table first
- Implement fallback: if cache miss or stale (TTL exceeded), compute recommendations on-demand and return
- Add query parameters: `limit` (default 10), `category_filter`, `min_score`
- Create GET `/api/products/{product_id}/similar` for item-based recommendations (real-time computation)
- Add POST `/api/recommendations/batch` for batch predictions (admin/testing)
- Implement GET `/api/trending` for popularity-based recommendations (new users)

**Epic 7.3: Cache Management**
- Add GET `/api/cache/stats` showing cache coverage (% users with fresh recommendations), average age
- Build DELETE `/api/cache/{user_id}` to invalidate specific user cache (trigger re-computation on next request)
- Implement POST `/api/cache/invalidate-all` for full cache refresh trigger
- Add cache warming strategy: prioritize active users in batch jobs

#### **Milestone 8: React Frontend - Product Catalog**

**Epic 8.1: Frontend Project Setup**
- Configure TypeScript with strict mode in `frontend/tsconfig.json`
- Set up React Router v6 for navigation (Home, Products, Product Detail, Profile, Admin)
- Configure Tailwind CSS for styling
- Create `frontend/src/services/api.ts` with axios client and base URL configuration
- Set up Zustand store in `frontend/src/store/` for global state (cart, user)

**Epic 8.2: Product Listing & Search**
- Create `frontend/src/components/ProductCard.tsx` component with image, name, price, rating
- Build `frontend/src/pages/ProductsPage.tsx` with grid layout and pagination
- Implement category filter sidebar and price range slider
- Add search bar with debounced API calls to `/api/products?search=...`
- Create `frontend/src/hooks/useProducts.ts` custom hook for data fetching

**Epic 8.3: Product Detail Page**
- Build `frontend/src/pages/ProductDetailPage.tsx` with full product information
- Add "Add to Cart" functionality
- Display "Similar Products" section calling `/api/products/{id}/similar`
- Implement interaction tracking: send POST to `/api/interactions` on page view

#### **Milestone 9: React Frontend - Personalized Recommendations**

**Epic 9.1: User Profile & Recommendations**
- Create `frontend/src/pages/ProfilePage.tsx` displaying user's purchase history
- Build "Recommended for You" section calling `/api/recommendations/{user_id}`
- Show recommendation metadata: generated timestamp, "Updated 2 hours ago"
- Add recommendation explanations (e.g., "Based on your recent purchases")
- Implement feedback mechanism: thumbs up/down on recommendations (POST to `/api/interactions` with type='feedback')

**Epic 9.2: Homepage & Discovery**
- Build `frontend/src/pages/HomePage.tsx` with hero section
- Add "Trending Products" carousel calling `/api/trending`
- Create "Categories" navigation grid
- For logged-in users, show personalized "Picked for You" section with cache freshness indicator

**Epic 9.3: Shopping Cart & Checkout**
- Build `frontend/src/components/Cart.tsx` with cart state management (Zustand)
- Create mock checkout flow (no payment processing)
- On checkout completion, POST purchase interactions to `/api/interactions`
- Show "Frequently Bought Together" recommendations in cart

#### **Milestone 10: Admin Dashboard for Batch Monitoring**

**Epic 10.1: Batch Job Monitoring UI**
- Create `frontend/src/pages/AdminPage.tsx` with batch job dashboard
- Display table of recent batch jobs from GET `/api/batch/jobs` (status, duration, users processed)
- Add real-time status polling for running jobs with progress bar
- Show cache statistics from GET `/api/cache/stats` (coverage, avg age, staleness distribution)

**Epic 10.2: Schedule Configuration UI**
- Build form to update batch schedule interval (hours/minutes picker)
- Call PUT `/api/config/batch-schedule` on save with new interval
- Display current schedule: "Recommendations refresh every 6 hours, last run 3 hours ago"
- Add manual trigger button calling POST `/api/batch/trigger`

**Epic 10.3: Job Logs & Debugging**
- Create expandable job detail view showing logs from GET `/api/batch/logs/{job_id}`
- Display error messages for failed jobs
- Add metrics visualization: processing time trend, cache hit rate over time
- Implement download logs functionality

#### **Milestone 11: Cold-Start & Model Improvements**

**Epic 11.1: Cold-Start Solutions**
- Implement popularity-based recommendations for new users in `backend/app/ml/cold_start.py`
- Add content-based onboarding: ask new users for category preferences (frontend form)
- Build exploration strategy: inject 20% random/diverse products into batch-generated recommendations
- Create A/B testing framework: serve different model versions to different user segments

**Epic 11.2: Advanced Feature Engineering**
- Add temporal features: hour of day, day of week, seasonality trends
- Implement user segmentation: cluster users by behavior patterns (sklearn.cluster.KMeans)
- Build session-based features: last 5 viewed products influence next recommendation
- Experiment with matrix factorization (sklearn.decomposition.TruncatedSVD)

**Epic 11.3: Incremental Model Updates**
- Modify batch job to support incremental learning: process only new interactions since last run
- Implement online learning fallback for real-time adaptation
- Build separate "fast path" batch job for recently active users (runs more frequently)
- Add model versioning: batch job tags recommendations with model_version in cache table

#### **Milestone 12: Deployment & CI/CD**

**Epic 12.1: Backend Deployment**
- Create `backend/Dockerfile` for containerization (optional, or use native Azure App Service)
- Configure `backend/startup.sh` for Uvicorn with production settings (workers, host, port)
- Deploy backend to Azure App Service using `az webapp up` or GitHub Actions with Always On enabled
- Configure Azure App Service environment variables (DB connection, Blob Storage keys from Key Vault, schedule config)
- Set up Application Insights for logging, monitoring, and batch job tracking

**Epic 12.2: Batch Function Deployment**
- Deploy Azure Function App with Timer trigger if using serverless approach
- Configure function connection strings and environment variables
- Set up function monitoring and alerts for failures
- Test manual trigger via Azure Portal

**Epic 12.3: Frontend Deployment**
- Build React app with `npm run build` generating optimized production bundle
- Deploy to Azure Static Web Apps via GitHub Actions workflow (auto-generated on resource creation)
- Configure API backend URL in environment variables (`VITE_API_URL`)
- Add admin route protection (if authentication implemented)
- Set up custom domain and SSL (Azure manages certificates)

**Epic 12.4: CI/CD Pipeline**
- Create `.github/workflows/backend-ci.yml` for pytest execution on PR
- Create `.github/workflows/frontend-ci.yml` for TypeScript compilation and linting
- Add deployment workflows triggered on merge to main branch
- Implement database migration workflow (Alembic upgrade on deployment)
- Add batch job smoke tests post-deployment

**Epic 12.5: Monitoring & Backlog Tracking**
- Set up Azure Application Insights dashboards for API latency, error rates, batch job success rate, recommendation endpoint usage
- Create custom metrics for cache hit rate and recommendation freshness
- Create GitHub Projects backlog with this milestone structure
- Configure alerts for API failures, database connection issues, or batch job failures
- Document Azure resource costs and optimization opportunities

### Further Considerations

1. **Batch Schedule Strategy**: Start with 6-hour intervals (4x daily) for development. Production options: hourly for active users + daily for all users, or adaptive scheduling based on user activity? Consider off-peak hours (2-6 AM) for full batch runs?

2. **Azure Function vs WebJobs vs In-Process**: Azure Functions offer better scalability and monitoring but add complexity. APScheduler in FastAPI app is simpler but requires Always On ($). WebJobs (part of App Service) is middle ground. Preference for starting approach?

3. **Batch Processing Optimization**: For 500 users, single-threaded fine. For scale: partition users into chunks, use multiprocessing or async batch processing. Consider Dask for distributed computation if dataset grows large?

4. **Cache Invalidation Strategy**: Invalidate cache on user interaction (immediate feedback) or only during batch refresh (simpler)? Hybrid: invalidate for purchases, keep for views?

5. **Monitoring & Alerts**: Set up alerts for batch job failures, cache staleness exceeding threshold (e.g., 24 hours), or processing time spikes. Use Azure Monitor action groups for email/SMS notifications?
