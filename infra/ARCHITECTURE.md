# Azure Infrastructure Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Internet / Users                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
    ┌────────────────────────┐      ┌────────────────────────┐
    │  Azure Static Web App  │      │   Azure App Service    │
    │     (Frontend SPA)     │      │   (Flask Backend API)  │
    │  React + TypeScript    │      │   Python + Gunicorn    │
    │  NGINX serving dist/   │      │   Docker Container     │
    └────────────────────────┘      └───────────┬────────────┘
                                                 │
                                                 │ VNet Integration
                                                 │
                ┌────────────────────────────────┴────────────────┐
                │         Azure Virtual Network (10.0.0.0/16)     │
                │                                                  │
                │  ┌────────────────────┐  ┌──────────────────┐  │
                │  │  App Service      │  │  Database        │  │
                │  │  Subnet           │  │  Subnet          │  │
                │  │  (10.0.1.0/24)    │  │  (10.0.2.0/24)   │  │
                │  └────────────────────┘  └────────┬─────────┘  │
                │                                    │             │
                │                          ┌─────────▼─────────┐  │
                │                          │   PostgreSQL      │  │
                │                          │ Flexible Server   │  │
                │                          │  (Private DNS)    │  │
                │                          └───────────────────┘  │
                └─────────────────────────────────────────────────┘

    ┌────────────────────────┐      ┌────────────────────────┐
    │ Azure Container        │      │   Azure Key Vault      │
    │ Registry (ACR)         │      │   (Secrets Storage)    │
    │ Docker Images          │      │   - DB Connection      │
    └────────────────────────┘      │   - GitHub Client ID   │
                                    └────────────────────────┘

    ┌────────────────────────┐      ┌────────────────────────┐
    │ Azure Storage Account  │      │  GitHub Actions        │
    │ (Terraform State)      │      │  (Federated Identity)  │
    │ Blob: tfstate          │      │  CI/CD Workflows       │
    └────────────────────────┘      └────────────────────────┘
```

## Network Flow

### User Request Flow (Frontend)

```
User Browser
    │
    ▼
Azure Static Web App (HTTPS)
    │
    └─> Serves React SPA (static files)
        │
        └─> JavaScript makes API calls ──┐
                                          │
                                          ▼
                            Azure App Service (HTTPS)
                                    │
                                    └─> Flask processes request
                                        │
                                        └─> Query database via private network
                                            │
                                            ▼
                                PostgreSQL Flexible Server
                                (Private IP only)
```

### Deployment Flow (CI/CD)

```
Git Push to GitHub
    │
    ▼
GitHub Actions Workflow Triggered
    │
    ├─> Authenticate via Federated Identity (OIDC)
    │   └─> No long-lived credentials needed
    │
    ├─> Pull code from repository
    │
    ├─> Build Docker Image
    │   └─> docker build
    │
    ├─> Push to Azure Container Registry
    │   └─> az acr login && docker push
    │
    └─> Deploy to App Service
        └─> az webapp config container set
        └─> App Service pulls image from ACR
```

## Resource Organization

### Resource Groups

```
rg-mlshop-tfstate (State Storage)
├── Storage Account: mlshoptfstate
│   └── Blob Container: tfstate
│       └── terraform.tfstate

rg-mlshop-prod (Application Resources)
├── Virtual Network: vnet-mlshop-prod
│   ├── Subnet: snet-appservice (10.0.1.0/24)
│   └── Subnet: snet-database (10.0.2.0/24)
│
├── Private DNS Zone: privatelink.postgres.database.azure.com
│
├── Container Registry: acrmlshopxxxxxx
│   ├── Repository: mlshop-backend
│   └── Repository: mlshop-frontend
│
├── Key Vault: kv-mlshop-xxxxxx
│   ├── Secret: database-url
│   └── Secret: github-client-id
│
├── Service Plan: asp-mlshop-prod (Linux, B1)
│
├── App Service: app-mlshop-backend-xxxxxx
│   ├── System-assigned Managed Identity
│   ├── VNet Integration (snet-appservice)
│   └── Docker Container from ACR
│
├── PostgreSQL Server: psql-mlshop-xxxxxx
│   ├── Database: mlshop
│   ├── Private Endpoint (snet-database)
│   └── Administrator: psqladmin
│
└── Static Web App: swa-mlshop-prod
    └── Frontend: React SPA
```

## Security Architecture

### Identity & Access Management

```
┌──────────────────────────────────────────────────────────────┐
│                    Azure Active Directory                     │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Service Principal: mlshop-github-actions-prod         │  │
│  │  ├─> Federated Credential (OIDC)                       │  │
│  │  │   └─> Trust: GitHub repo + branch                   │  │
│  │  ├─> Role: Contributor (rg-mlshop-prod)                │  │
│  │  └─> Role: AcrPush (ACR)                               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Managed Identity: app-mlshop-backend-xxxxxx           │  │
│  │  └─> Access Policy: Key Vault (Get, List secrets)     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                    Network Security                          │
│                                                               │
│  Public Endpoints (HTTPS Only)                               │
│  ├─> Static Web App (swa-mlshop-prod.azurestaticapps.net)  │
│  └─> App Service (app-mlshop-backend-xxx.azurewebsites.net)│
│                                                               │
│  Private Endpoints (VNet Only)                               │
│  └─> PostgreSQL (psql-mlshop-xxx.postgres.database.azure.com)│
│      ├─> Only accessible via 10.0.2.0/24 subnet             │
│      ├─> Private DNS resolution                             │
│      └─> SSL/TLS required                                   │
│                                                               │
│  Firewall Rules                                              │
│  ├─> App Service: Public HTTP/HTTPS                         │
│  ├─> PostgreSQL: Azure Services only (0.0.0.0)              │
│  └─> ACR: Authenticated access only                         │
└─────────────────────────────────────────────────────────────┘
```

### Secrets Management

```
┌────────────────────────────────────────────────────────────┐
│                  Secrets Management Flow                    │
│                                                              │
│  Development/Local                                          │
│  ├─> terraform.tfvars (gitignored)                         │
│  └─> Environment variables                                 │
│                                                              │
│  GitHub Actions                                             │
│  ├─> GitHub Secrets (encrypted)                            │
│  │   ├─> POSTGRESQL_ADMIN_PASSWORD                         │
│  │   ├─> APP_SECRET_KEY                                    │
│  │   └─> Azure credentials (federated)                     │
│  └─> Passed to Terraform as variables                      │
│                                                              │
│  Azure Key Vault                                            │
│  ├─> database-url (connection string)                      │
│  ├─> github-client-id                                      │
│  └─> App Service reads via Managed Identity                │
│                                                              │
│  App Service Configuration                                  │
│  └─> Environment variables (not in code)                   │
└────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Operation (GET /api/products)

```
1. User Browser
   └─> HTTPS GET https://swa-mlshop-prod.azurestaticapps.net
       └─> React app loads

2. React App
   └─> HTTPS GET https://app-mlshop-backend-xxx.azurewebsites.net/api/products
       └─> CORS headers validate origin

3. App Service
   └─> Flask app receives request
       └─> SQLAlchemy query

4. PostgreSQL (via private network)
   └─> Query database over SSL
       └─> Return results

5. App Service
   └─> JSON response to frontend

6. React App
   └─> Display products to user
```

### Write Operation (POST /api/cart/items)

```
1. User authenticated with JWT token

2. React App
   └─> HTTPS POST with Bearer token
       └─> https://app-mlshop-backend-xxx.azurewebsites.net/api/cart/items

3. App Service
   └─> Validate JWT token
   └─> Check user permissions
   └─> SQLAlchemy ORM insert

4. PostgreSQL (via private network)
   └─> INSERT via prepared statement
       └─> Transaction committed

5. App Service
   └─> Return updated cart

6. React App
   └─> Update UI state
```

## Disaster Recovery

### Backup Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    Backup Components                        │
│                                                              │
│  Terraform State                                            │
│  ├─> Azure Storage with versioning enabled                 │
│  ├─> Soft delete: 7 days                                   │
│  └─> Point-in-time restore available                       │
│                                                              │
│  PostgreSQL Database                                        │
│  ├─> Automated backups: 7 days retention                   │
│  ├─> Point-in-time restore                                 │
│  └─> Geo-redundant backup (optional)                       │
│                                                              │
│  Container Images                                           │
│  ├─> ACR stores all image versions                         │
│  ├─> Tags: latest, git-sha                                 │
│  └─> Manual cleanup required                               │
│                                                              │
│  Source Code                                                │
│  ├─> Git repository (GitHub)                               │
│  └─> All infrastructure as code                            │
└────────────────────────────────────────────────────────────┘
```

### Recovery Procedures

```
Scenario 1: Database Corruption
├─> Restore from automated backup (up to 7 days)
└─> az postgres flexible-server restore

Scenario 2: Accidental Resource Deletion
├─> Re-run Terraform: ./deploy-local.sh apply
└─> Most resources recreated in ~10 minutes

Scenario 3: Bad Deployment
├─> Rollback to previous image tag
└─> az webapp config container set --docker-custom-image-name <previous-tag>

Scenario 4: Complete Disaster
├─> Initialize new Terraform state (or restore from backup)
├─> Run Terraform apply with saved tfvars
├─> Restore database from backup
└─> Deploy latest good image from ACR
```

## Scaling Considerations

### Current Configuration (B1 Tier)

```
App Service Plan: B1
├─> 1 vCPU
├─> 1.75 GB RAM
└─> Sufficient for: <1000 concurrent users

PostgreSQL: B1ms (Burstable)
├─> 1 vCPU
├─> 2 GB RAM
├─> 32 GB Storage
└─> Sufficient for: Development/Small production

Static Web App: Free Tier
├─> Bandwidth: 100 GB/month
└─> Sufficient for: Small to medium traffic
```

### Scaling Options

```
Vertical Scaling (Increase SKU)
├─> App Service: B1 → S1 → P1V2 → P2V2
│   └─> More CPU, RAM, staging slots
│
└─> PostgreSQL: B1ms → GP_Standard_D2s_v3
    └─> More CPU, RAM, IOPS

Horizontal Scaling
├─> App Service: Enable autoscale (requires S tier+)
│   └─> Scale out based on CPU/memory metrics
│
└─> PostgreSQL: Read replicas (Premium tier)
    └─> Offload read queries

Geographic Scaling
├─> Azure Traffic Manager for multi-region
├─> Replicate to multiple regions
└─> Cross-region database replication
```

## Monitoring & Observability

### Recommended Additions (Not Implemented)

```
Azure Monitor
├─> Application Insights for App Service
│   ├─> Request tracking
│   ├─> Exception logging
│   └─> Performance metrics
│
├─> Log Analytics Workspace
│   ├─> Centralized logging
│   └─> Query and analyze logs
│
└─> Alerts
    ├─> App Service CPU > 80%
    ├─> PostgreSQL connections > 90%
    └─> HTTP 5xx errors > threshold

Custom Dashboards
├─> API response times
├─> Database query performance
├─> User activity metrics
└─> Error rates and trends
```

## Cost Optimization Strategies

```
Current Setup (~$30-40/month)
├─> App Service B1: $13/mo
├─> PostgreSQL B1ms: $12/mo
├─> ACR Basic: $5/mo
├─> Static Web App: Free
└─> Miscellaneous: ~$5/mo

Further Optimization
├─> Use Azure Reserved Instances (-30% for 1yr commitment)
├─> Stop dev resources when not in use
├─> Cleanup old ACR images regularly
├─> Use Azure Hybrid Benefit (if applicable)
└─> Monitor and right-size resources

Cost Alerts
└─> Set budget alert at $50/month
```

## Summary

This architecture provides:

✅ **Security**: Private networking, managed identities, no hardcoded secrets
✅ **Scalability**: Can scale vertically and horizontally as needed
✅ **Reliability**: Automated backups, versioned infrastructure
✅ **Cost-Effective**: ~$30-40/month for development/learning
✅ **Maintainable**: Infrastructure as code, modular design
✅ **Automated**: CI/CD pipelines, minimal manual steps
✅ **Best Practices**: Follows Azure Well-Architected Framework

The infrastructure is production-ready with appropriate security controls and can be scaled up as the application grows.
