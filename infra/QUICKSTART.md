# Quick Start Guide - Azure Deployment

This guide will help you deploy the ML Recommender Shop to Azure in ~15-20 minutes.

## Prerequisites Checklist

- [ ] Azure subscription with Owner or Contributor role
- [ ] Azure CLI installed (`az --version`)
- [ ] Terraform >= 1.5.0 installed (`terraform --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Logged into Azure CLI (`az login`)

## Step-by-Step Deployment

### 1. Initialize Terraform State (2 minutes)

```bash
cd infra/scripts
./init-terraform-state.sh
```

This creates a storage account for Terraform state. Accept the prompts.

### 2. Configure Backend (1 minute)

```bash
cd ../terraform
cp backend.hcl.example backend.hcl
```

The default values should work. Edit only if you changed them in step 1.

### 3. Generate Secrets (1 minute)

Generate secure secrets:

```bash
# PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "PostgreSQL Password: $POSTGRES_PASSWORD"

# Flask secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
echo "Flask Secret Key: $SECRET_KEY"
```

**Save these values** - you'll need them!

### 4. Configure Variables (2 minutes)

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_name              = "mlshop"
environment               = "prod"
location                  = "eastus"
database_name             = "mlshop"
postgresql_admin_password = "PASTE_POSTGRES_PASSWORD_HERE"
app_secret_key            = "PASTE_SECRET_KEY_HERE"
github_repository         = "YOUR_USERNAME/ml-recommender"  # Change this!
github_branch             = "main"
```

### 5. Deploy Infrastructure (5-10 minutes)

```bash
cd ../scripts
./deploy-local.sh apply
```

This will:
- Create ~15 Azure resources
- Set up networking, database, app service, etc.
- Output important URLs and credentials

**Save the output!** You'll need these values.

### 6. Build and Push Images (3-5 minutes)

```bash
./build-and-push.sh
```

This builds Docker images and pushes them to Azure Container Registry.

### 7. Update App Service (1 minute)

```bash
# Get values from Terraform
cd ../terraform
APP_SERVICE_NAME=$(terraform output -raw app_service_name)
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server)

# Update container
az webapp config container set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_LOGIN_SERVER/mlshop-backend:latest

# Restart
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

### 8. Initialize Database (2 minutes)

```bash
# SSH into App Service
az webapp ssh --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

Inside the container:

```bash
cd /app
alembic upgrade head
python scripts/seed_products.py --reset
exit
```

### 9. Deploy Frontend (3 minutes)

Get backend URL:

```bash
cd ../terraform
BACKEND_URL=$(terraform output -raw app_service_url)
SWA_NAME=$(terraform output -raw static_web_app_name)
SWA_TOKEN=$(terraform output -raw static_web_app_api_key)
```

Build and deploy frontend:

```bash
cd ../../frontend
npm install
VITE_API_BASE_URL="$BACKEND_URL/api" npm run build

# Deploy to Static Web App (requires SWA CLI or use GitHub Actions)
echo "Deploy the frontend using GitHub Actions or manually upload dist/ to Static Web App"
```

### 10. Test the Application

Get the URLs:

```bash
cd ../infra/terraform
terraform output app_service_url
terraform output static_web_app_url
```

**Backend**: Visit `app_service_url + /api/health` - should return OK

**Frontend**: Visit `static_web_app_url` - should show the shop

## Setup GitHub Actions (Optional)

To enable automated deployments:

### 1. Get Credentials

```bash
cd infra/terraform
terraform output github_actions_client_id
terraform output github_actions_tenant_id
terraform output github_actions_subscription_id
```

### 2. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- `AZURE_CLIENT_ID`: (from output)
- `AZURE_TENANT_ID`: (from output)
- `AZURE_SUBSCRIPTION_ID`: (from output)
- `TF_STATE_RESOURCE_GROUP`: `rg-mlshop-tfstate`
- `TF_STATE_STORAGE_ACCOUNT`: `mlshoptfstate`
- `TF_STATE_CONTAINER`: `tfstate`
- `POSTGRESQL_ADMIN_PASSWORD`: (your PostgreSQL password)
- `APP_SECRET_KEY`: (your Flask secret key)

### 3. Test Workflows

Now when you push changes to `backend/` or `frontend/`, GitHub Actions will automatically deploy them!

## Troubleshooting

### App Service not starting?

```bash
# Check logs
az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Check container logs
az webapp log download --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

### Database connection issues?

```bash
# Test from App Service
az webapp ssh --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
# Inside container:
apt-get update && apt-get install -y postgresql-client
psql "$DATABASE_URL" -c "SELECT version();"
```

### Frontend can't reach backend?

Check CORS settings and backend URL in frontend build args.

## Clean Up

To delete everything:

```bash
cd infra/scripts
./deploy-local.sh destroy
```

This removes all resources and stops billing.

## Cost Estimate

Monthly cost: **~$30-40 USD**

- App Service B1: ~$13
- PostgreSQL B1ms: ~$12
- ACR Basic: ~$5
- Static Web App: Free
- Storage/networking: ~$5

## Next Steps

- Enable monitoring and alerts
- Set up custom domain
- Configure SSL certificates
- Implement backups
- Scale resources as needed

## Getting Help

If you encounter issues:

1. Check the full [README.md](./README.md)
2. Review Azure logs
3. Check GitHub Actions logs (if using)
4. Open an issue on GitHub
