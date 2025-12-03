# Infrastructure for ML Recommender Shop

This directory contains all infrastructure code for deploying the ML Recommender Shop application to Azure using Terraform.

## Architecture Overview

The application is deployed using the following Azure services:

- **Azure Container Registry (ACR)**: Stores Docker images for the backend
- **Azure App Service**: Hosts the Flask backend application
- **Azure Static Web Apps**: Hosts the React frontend
- **Azure PostgreSQL Flexible Server**: Database with private networking
- **Azure Key Vault**: Stores secrets and credentials
- **Azure Virtual Network**: Provides private networking
- **Federated Identity**: GitHub Actions authentication

## Prerequisites

Before deploying, ensure you have:

1. **Azure CLI** installed and logged in (`az login`)
2. **Terraform** (>= 1.5.0) installed
3. **Docker** installed (for building images)
4. **Azure subscription** with appropriate permissions
5. **GitHub repository** with necessary secrets configured

## Directory Structure

```
infra/
├── terraform/              # Terraform configuration
│   ├── main.tf            # Main infrastructure definition
│   ├── variables.tf       # Input variables
│   ├── outputs.tf         # Output values
│   ├── backend.hcl.example # Backend config example
│   ├── terraform.tfvars.example # Variables example
│   └── modules/           # Terraform modules
│       ├── acr/           # Container Registry
│       ├── app_service/   # Backend App Service
│       ├── keyvault/      # Key Vault
│       ├── network/       # Virtual Network
│       ├── postgresql/    # Database
│       └── static_web_app/ # Frontend Static Web App
└── scripts/               # Deployment scripts
    ├── init-terraform-state.sh  # Initialize remote state
    ├── deploy-local.sh          # Deploy from laptop
    └── build-and-push.sh        # Build and push images
```

## Deployment from Local Laptop

### Step 1: Initialize Terraform State Storage

First, create Azure Storage for Terraform remote state:

```bash
cd infra/scripts
chmod +x init-terraform-state.sh
./init-terraform-state.sh
```

This creates:
- Resource group: `rg-mlshop-tfstate`
- Storage account: `mlshoptfstate`
- Blob container: `tfstate`

### Step 2: Configure Backend

Copy the example backend configuration:

```bash
cd ../terraform
cp backend.hcl.example backend.hcl
# Edit backend.hcl if you changed default values
```

### Step 3: Configure Variables

Copy and edit the variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
project_name              = "mlshop"
environment               = "prod"
location                  = "eastus"
database_name             = "mlshop"
postgresql_admin_password = "YourSecurePassword123!"
app_secret_key            = "YourSecretKey"
github_repository         = "your-username/ml-recommender"
github_branch             = "main"
```

**Important**: Generate secure random values for passwords and secrets:
```bash
# Generate PostgreSQL password
openssl rand -base64 32

# Generate Flask secret key
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 4: Deploy Infrastructure

Deploy the infrastructure:

```bash
cd ../scripts
chmod +x deploy-local.sh
./deploy-local.sh plan   # Review changes
./deploy-local.sh apply  # Apply changes
```

This will create all Azure resources and output important values.

### Step 5: Build and Push Docker Images

After infrastructure is deployed, build and push images:

```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

This script:
1. Logs in to ACR
2. Builds backend and frontend Docker images
3. Pushes images to ACR with version tags

### Step 6: Configure App Service

Update the App Service to use the backend image:

```bash
# Get values from Terraform output
cd ../terraform
APP_SERVICE_NAME=$(terraform output -raw app_service_name)
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server)

# Update container image
az webapp config container set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_LOGIN_SERVER/mlshop-backend:latest

# Restart app
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

### Step 7: Run Database Migrations

SSH into the App Service and run migrations:

```bash
az webapp ssh --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Inside the container:
cd /app
alembic upgrade head
python scripts/seed_products.py --reset
exit
```

### Step 8: Access the Application

Get the application URLs:

```bash
cd ../terraform
terraform output app_service_url
terraform output static_web_app_url
```

Visit the Static Web App URL to access the frontend.

## GitHub Actions Deployment

### Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Required for Infrastructure:**
- `AZURE_CLIENT_ID`: From Terraform output `github_actions_client_id`
- `AZURE_TENANT_ID`: From Terraform output `github_actions_tenant_id`
- `AZURE_SUBSCRIPTION_ID`: From Terraform output `github_actions_subscription_id`
- `TF_STATE_RESOURCE_GROUP`: `rg-mlshop-tfstate`
- `TF_STATE_STORAGE_ACCOUNT`: `mlshoptfstate`
- `TF_STATE_CONTAINER`: `tfstate`
- `POSTGRESQL_ADMIN_PASSWORD`: Your PostgreSQL password
- `APP_SECRET_KEY`: Your Flask secret key

### Workflows

Three workflows are provided:

1. **deploy-infrastructure.yml**: Deploy/update infrastructure
   - Triggered by changes to `infra/terraform/**`
   - Can be manually triggered with plan/apply/destroy action

2. **deploy-backend.yml**: Build and deploy backend
   - Triggered by changes to `backend/**`
   - Builds Docker image, pushes to ACR, updates App Service

3. **deploy-frontend.yml**: Build and deploy frontend
   - Triggered by changes to `frontend/**`
   - Builds React app, deploys to Static Web Apps

### Manual Deployment Trigger

You can manually trigger deployments:

1. Go to Actions tab in GitHub
2. Select the workflow
3. Click "Run workflow"
4. Choose branch and options

## Infrastructure Components

### Networking

- **Virtual Network**: Private network with subnets
- **App Service Subnet**: For VNet integration
- **Database Subnet**: For PostgreSQL
- **Private DNS Zone**: For PostgreSQL private endpoint

### Container Registry

- **SKU**: Basic (sufficient for this project)
- **Admin enabled**: For simplicity (use managed identity in production)
- **Role assignments**: GitHub Actions has AcrPush role

### App Service

- **Plan**: B1 Linux
- **Container**: Docker support enabled
- **VNet Integration**: Connected to private network
- **Health Check**: `/api/health` endpoint
- **Managed Identity**: System-assigned for Key Vault access

### PostgreSQL

- **Version**: 16
- **SKU**: B_Standard_B1ms (burstable, cost-effective)
- **Storage**: 32 GB
- **Private networking**: Delegated subnet
- **SSL**: Required
- **Firewall**: Allows Azure services

### Key Vault

- **SKU**: Standard
- **Soft delete**: 7 days retention
- **Access policies**: Admin and App Service
- **Secrets stored**:
  - Database connection string
  - GitHub Actions client ID

### Static Web App

- **SKU**: Free
- **Backend integration**: Configured with App Service URL
- **API token**: Used for deployment

### Federated Identity

- **Service Principal**: For GitHub Actions
- **Federated Credential**: Based on repository and branch
- **Roles**: Contributor on resource group, AcrPush on ACR

## Security Considerations

- **Secrets**: Stored in Key Vault, never in code
- **Private Networking**: PostgreSQL accessible only via VNet
- **SSL/TLS**: Required for all connections
- **Managed Identity**: App Service uses system-assigned identity
- **Federated Identity**: No long-lived credentials for GitHub Actions
- **HTTPS Only**: Enforced on App Service and Static Web App

## Cost Optimization

Current configuration uses cost-effective tiers:

- App Service: B1 (~$13/month)
- PostgreSQL: B1ms (~$12/month)
- Static Web App: Free tier
- ACR: Basic (~$5/month)
- Storage: Minimal cost
- Key Vault: Pay per operation (minimal)

**Estimated monthly cost**: ~$30-40 USD

## Troubleshooting

### Terraform Errors

**State lock error:**
```bash
# Clear lock
az storage blob lease break \
  --account-name mlshoptfstate \
  --container-name tfstate \
  --blob-name terraform.tfstate
```

**Provider registration:**
```bash
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DBforPostgreSQL
```

### App Service Issues

**View logs:**
```bash
az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

**SSH into container:**
```bash
az webapp ssh --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

**Restart app:**
```bash
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

### Database Connection Issues

**Test connection from App Service:**
```bash
# SSH into App Service
az webapp ssh --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Test PostgreSQL connection
apt-get update && apt-get install -y postgresql-client
psql "$DATABASE_URL" -c "SELECT version();"
```

## Cleanup

To destroy all infrastructure:

```bash
cd infra/scripts
./deploy-local.sh destroy
```

Or via GitHub Actions:
1. Go to Actions → Deploy Infrastructure
2. Run workflow with action: `destroy`

**Note**: This will permanently delete all resources and data!

## References

- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure App Service](https://learn.microsoft.com/azure/app-service/)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure PostgreSQL](https://learn.microsoft.com/azure/postgresql/)
- [Federated Identity](https://learn.microsoft.com/azure/active-directory/workload-identities/workload-identity-federation)
