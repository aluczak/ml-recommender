#!/bin/bash
set -e

# Script to deploy infrastructure from local laptop
# Usage: ./deploy-local.sh [plan|apply|destroy]

echo "=========================================="
echo "ML Shop - Infrastructure Deployment"
echo "=========================================="

# Change to terraform directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
cd "$TERRAFORM_DIR"

ACTION="${1:-plan}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "Error: You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "Current Azure subscription:"
az account show --query "{Name:name, SubscriptionId:id}" -o table
echo ""

# Check if backend.hcl exists
if [ ! -f "backend.hcl" ]; then
    echo "Warning: backend.hcl not found."
    echo "If this is your first deployment, run init-terraform-state.sh first."
    echo ""
    read -p "Do you want to continue without remote state? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "Error: terraform.tfvars not found."
    echo "Please create terraform.tfvars with required variables."
    echo ""
    echo "Example terraform.tfvars:"
    echo ""
    cat <<EOF
project_name              = "mlshop"
environment               = "prod"
location                  = "northeurope"
postgresql_admin_password = "your-secure-password"
app_secret_key            = "your-secret-key"
github_repository         = "aluczak/ml-recommender"
github_branch             = "main"
EOF
    exit 1
fi

# Initialize Terraform
echo ""
echo "Initializing Terraform..."
if [ -f "backend.hcl" ]; then
    terraform init -backend-config=backend.hcl -upgrade
else
    terraform init -upgrade
fi

# Validate configuration
echo ""
echo "Validating Terraform configuration..."
terraform validate

# Execute the requested action
echo ""
case $ACTION in
    plan)
        echo "Planning infrastructure changes..."
        terraform plan -out=tfplan
        echo ""
        echo "Plan saved to tfplan. Run './deploy-local.sh apply' to apply changes."
        ;;
    apply)
        echo "Applying infrastructure changes..."
        if [ -f "tfplan" ]; then
            terraform apply tfplan
            rm -f tfplan
        else
            terraform apply
        fi
        echo ""
        echo "=========================================="
        echo "Deployment completed successfully!"
        echo "=========================================="
        echo ""
        terraform output
        ;;
    destroy)
        echo "WARNING: This will destroy all infrastructure!"
        echo ""
        read -p "Are you sure you want to destroy all resources? (yes/no) " -r
        echo ""
        if [[ $REPLY == "yes" ]]; then
            terraform destroy
        else
            echo "Aborted."
            exit 1
        fi
        ;;
    *)
        echo "Error: Invalid action '$ACTION'"
        echo "Usage: $0 [plan|apply|destroy]"
        exit 1
        ;;
esac
