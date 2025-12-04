#!/bin/bash
set -e

# Script to initialize Azure Storage for Terraform state
# This script should be run once before the first Terraform deployment

echo "=========================================="
echo "Initialize Terraform State Storage"
echo "=========================================="

# Configuration
RESOURCE_GROUP_NAME="${TF_STATE_RESOURCE_GROUP:-rg-mlshop-tfstate}"
STORAGE_ACCOUNT_NAME="${TF_STATE_STORAGE_ACCOUNT:-mlshoptfstate}"
CONTAINER_NAME="${TF_STATE_CONTAINER:-tfstate}"
LOCATION="${AZURE_LOCATION:-northeurope}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Error: You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "Current Azure subscription:"
az account show --query "{Name:name, SubscriptionId:id}" -o table

echo ""
read -p "Do you want to continue with this subscription? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create resource group
echo ""
echo "Creating resource group: $RESOURCE_GROUP_NAME"
az group create \
    --name "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --tags "Purpose=TerraformState" "ManagedBy=Script"

# Create storage account
echo ""
echo "Creating storage account: $STORAGE_ACCOUNT_NAME"
az storage account create \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --encryption-services blob \
    --https-only true \
    --min-tls-version TLS1_2

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --query '[0].value' -o tsv)

# Create blob container
echo ""
echo "Creating blob container: $CONTAINER_NAME"
az storage container create \
    --name "$CONTAINER_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$ACCOUNT_KEY"

# Enable versioning on the storage account
echo ""
echo "Enabling blob versioning for state history..."
az storage account blob-service-properties update \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --enable-versioning true

echo ""
echo "=========================================="
echo "Terraform state storage initialized successfully!"
echo "=========================================="
echo ""
echo "Configuration details:"
echo "  Resource Group: $RESOURCE_GROUP_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Container: $CONTAINER_NAME"
echo ""
echo "Create a backend configuration file 'backend.hcl' with:"
echo ""
echo "resource_group_name  = \"$RESOURCE_GROUP_NAME\""
echo "storage_account_name = \"$STORAGE_ACCOUNT_NAME\""
echo "container_name       = \"$CONTAINER_NAME\""
echo "key                  = \"terraform.tfstate\""
echo ""
echo "Then initialize Terraform with:"
echo "  terraform init -backend-config=backend.hcl"
echo ""
echo "NOTE: For GitHub Actions, you'll need to add the storage account access key as a secret:"
echo ""
echo "  # Get the storage account access key"
echo "  az storage account keys list \\"
echo "    --resource-group $RESOURCE_GROUP_NAME \\"
echo "    --account-name $STORAGE_ACCOUNT_NAME \\"
echo "    --query '[0].value' -o tsv"
echo ""
echo "  # Add this key to GitHub as secret: TF_STATE_STORAGE_ACCESS_KEY"
