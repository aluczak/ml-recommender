terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "azurerm" {
    # Backend configuration will be provided via backend-config file or CLI parameters
    # resource_group_name  = "rg-mlshop-tfstate"
    # storage_account_name = "mlshoptfstate"
    # container_name       = "tfstate"
    # key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  
  use_oidc = true
}

provider "azuread" {}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
  
  tags = var.tags
}

# Azure Container Registry
module "acr" {
  source = "./modules/acr"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  suffix              = random_string.suffix.result
  tags                = var.tags
}

# Key Vault
module "keyvault" {
  source = "./modules/keyvault"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  suffix              = random_string.suffix.result
  tenant_id           = data.azurerm_client_config.current.tenant_id
  tags                = var.tags
  
  # Allow current user/service principal to manage secrets
  admin_object_ids = [data.azurerm_client_config.current.object_id]
}

# PostgreSQL Flexible Server (publicly accessible for training purposes)
module "postgresql" {
  source = "./modules/postgresql"
  
  resource_group_name     = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  project_name            = var.project_name
  environment             = var.environment
  suffix                  = random_string.suffix.result
  admin_password          = var.postgresql_admin_password
  database_name           = var.database_name
  tags                    = var.tags
}

# Store database connection string in Key Vault
resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = module.postgresql.connection_string
  key_vault_id = module.keyvault.key_vault_id

  depends_on = [module.keyvault]
}

# Static Web App for Frontend (must be created before App Service for CORS config)
module "static_web_app" {
  source = "./modules/static_web_app"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = var.static_web_app_location
  project_name        = var.project_name
  environment         = var.environment
  tags                = var.tags
  backend_url         = ""  # Will be updated after App Service is created
}

# App Service for Backend
module "app_service" {
  source = "./modules/app_service"
  
  resource_group_name       = azurerm_resource_group.main.name
  location                  = azurerm_resource_group.main.location
  project_name              = var.project_name
  environment               = var.environment
  suffix                    = random_string.suffix.result
  acr_login_server          = module.acr.login_server
  acr_admin_username        = module.acr.admin_username
  acr_admin_password        = module.acr.admin_password
  key_vault_id              = module.keyvault.key_vault_id
  database_connection_string = module.postgresql.connection_string
  secret_key                = var.app_secret_key
  static_web_app_hostname   = module.static_web_app.default_hostname
  tags                      = var.tags
}

# Grant App Service access to Key Vault
resource "azurerm_key_vault_access_policy" "app_service" {
  key_vault_id = module.keyvault.key_vault_id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = module.app_service.app_service_principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# Federated Identity Credentials for GitHub Actions
resource "azuread_application" "github_actions" {
  display_name = "${var.project_name}-github-actions-${var.environment}"
}

resource "azuread_service_principal" "github_actions" {
  client_id = azuread_application.github_actions.client_id
}

resource "azuread_application_federated_identity_credential" "github_actions" {
  application_id = azuread_application.github_actions.id
  display_name   = "github-actions-${var.environment}"
  description    = "Federated identity for GitHub Actions"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"
}

# Assign Contributor role to GitHub Actions service principal
resource "azurerm_role_assignment" "github_actions_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github_actions.object_id
}

# Assign AcrPush role to GitHub Actions service principal
resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = module.acr.acr_id
  role_definition_name = "AcrPush"
  principal_id         = azuread_service_principal.github_actions.object_id
}

# Data source for Terraform state storage account (if configured)
data "azurerm_storage_account" "tfstate" {
  count               = var.tf_state_storage_account != "" ? 1 : 0
  name                = var.tf_state_storage_account
  resource_group_name = var.tf_state_resource_group
}

# Assign Storage Blob Data Contributor role to GitHub Actions service principal for Terraform state
resource "azurerm_role_assignment" "github_actions_tfstate" {
  count                = var.tf_state_storage_account != "" ? 1 : 0
  scope                = data.azurerm_storage_account.tfstate[0].id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.github_actions.object_id
}

# Store GitHub Actions credentials in Key Vault
resource "azurerm_key_vault_secret" "github_client_id" {
  name         = "github-client-id"
  value        = azuread_application.github_actions.client_id
  key_vault_id = module.keyvault.key_vault_id

  depends_on = [module.keyvault]
}
