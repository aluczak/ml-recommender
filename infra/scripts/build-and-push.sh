#!/bin/bash
set -e

# Script to build Docker images and push to Azure Container Registry
# Usage: ./build-and-push.sh

echo "=========================================="
echo "Build and Push Docker Images"
echo "=========================================="

# Check if required tools are installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    exit 1
fi

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Get ACR name from Terraform output or environment variable
ACR_NAME="${ACR_NAME:-}"
if [ -z "$ACR_NAME" ]; then
    echo "Getting ACR name from Terraform output..."
    cd "$SCRIPT_DIR/../terraform"
    ACR_NAME=$(terraform output -raw acr_name 2>/dev/null || echo "")
    cd "$PROJECT_ROOT"
fi

if [ -z "$ACR_NAME" ]; then
    echo "Error: ACR_NAME not found."
    echo "Please set ACR_NAME environment variable or ensure Terraform is deployed."
    exit 1
fi

echo "ACR Name: $ACR_NAME"

# Login to ACR
echo ""
echo "Logging in to Azure Container Registry..."
az acr login --name "$ACR_NAME"

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build version tag (use git commit hash or timestamp)
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    VERSION_TAG=$(git rev-parse --short HEAD)
else
    VERSION_TAG=$(date +%Y%m%d-%H%M%S)
fi
echo "Version Tag: $VERSION_TAG"

# Build and push backend image
echo ""
echo "=========================================="
echo "Building backend image..."
echo "=========================================="
cd "$PROJECT_ROOT/backend"
BACKEND_IMAGE="$ACR_LOGIN_SERVER/mlshop-backend"
docker build -t "$BACKEND_IMAGE:$VERSION_TAG" -t "$BACKEND_IMAGE:latest" .

echo "Pushing backend image..."
docker push "$BACKEND_IMAGE:$VERSION_TAG"
docker push "$BACKEND_IMAGE:latest"

# Get backend API URL from Terraform or environment
BACKEND_URL="${BACKEND_URL:-}"
if [ -z "$BACKEND_URL" ]; then
    echo "Getting backend URL from Terraform output..."
    cd "$SCRIPT_DIR/../terraform"
    BACKEND_URL=$(terraform output -raw app_service_url 2>/dev/null || echo "")
    cd "$PROJECT_ROOT"
fi

# Build and push frontend image
echo ""
echo "=========================================="
echo "Building frontend image..."
echo "=========================================="
cd "$PROJECT_ROOT/frontend"
FRONTEND_IMAGE="$ACR_LOGIN_SERVER/mlshop-frontend"

if [ -n "$BACKEND_URL" ]; then
    echo "Building frontend with VITE_API_BASE_URL=$BACKEND_URL/api"
    docker build \
        --build-arg VITE_API_BASE_URL="$BACKEND_URL/api" \
        -t "$FRONTEND_IMAGE:$VERSION_TAG" \
        -t "$FRONTEND_IMAGE:latest" \
        .
else
    echo "Warning: BACKEND_URL not set, using default API URL"
    docker build \
        -t "$FRONTEND_IMAGE:$VERSION_TAG" \
        -t "$FRONTEND_IMAGE:latest" \
        .
fi

echo "Pushing frontend image..."
docker push "$FRONTEND_IMAGE:$VERSION_TAG"
docker push "$FRONTEND_IMAGE:latest"

echo ""
echo "=========================================="
echo "Build and push completed successfully!"
echo "=========================================="
echo ""
echo "Backend image: $BACKEND_IMAGE:$VERSION_TAG"
echo "Frontend image: $FRONTEND_IMAGE:$VERSION_TAG"
echo ""
echo "To deploy backend to App Service, run:"
echo "  az webapp config container set \\"
echo "    --name <app-service-name> \\"
echo "    --resource-group <resource-group> \\"
echo "    --docker-custom-image-name $BACKEND_IMAGE:$VERSION_TAG"
