variable "subscription_id" {
  description = "Azure subscription ID that will own the shared resources."
  type        = string
}

variable "tenant_id" {
  description = "Azure Active Directory tenant ID used for authentication."
  type        = string
}

variable "location" {
  description = "Azure region where shared resources will be provisioned."
  type        = string
  default     = "eastus"
}

variable "project_name" {
  description = "Short project name used for resource naming."
  type        = string
  default     = "mlshop"
}

variable "environment" {
  description = "Environment label appended to resource names (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "shared_namespace" {
  description = "Optional logical namespace for shared resources; defaults to project_name when unset."
  type        = string
  default     = null
}

variable "tags" {
  description = "Optional map of tags to spread across all shared resources."
  type        = map(string)
  default     = {}
}

variable "acr_sku" {
  description = "Container registry SKU (Basic, Standard, or Premium)."
  type        = string
  default     = "Basic"
}

variable "key_vault_sku" {
  description = "SKU for Azure Key Vault (standard or premium)."
  type        = string
  default     = "standard"
}

variable "key_vault_purge_protection" {
  description = "Enable purge protection on the Key Vault (cannot be disabled for 90 days)."
  type        = bool
  default     = false
}

variable "tfstate_account_replication" {
  description = "Replication strategy for the Terraform state storage account (LRS, GRS, etc.)."
  type        = string
  default     = "LRS"
}

variable "enable_github_oidc" {
  description = "Whether to create an Azure AD application/service principal with a GitHub Actions federated credential."
  type        = bool
  default     = true
}

variable "github_app_display_name" {
  description = "Display name for the Azure AD application used by GitHub Actions."
  type        = string
  default     = "mlshop-github-ci"
}

variable "github_oidc_subject" {
  description = "OIDC subject string GitHub will use (e.g., repo:owner/repo:ref:refs/heads/main)."
  type        = string
  default     = "repo:aluczak/ml-recommender:ref:refs/heads/main"
}
