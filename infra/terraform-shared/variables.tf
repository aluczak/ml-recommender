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

variable "storage_account_replication" {
  description = "Replication strategy for the storage account (LRS, GRS, RA-GRS, etc.)."
  type        = string
  default     = "LRS"
}

variable "static_site_index_document" {
  description = "Index document served by the static website for the frontend."
  type        = string
  default     = "index.html"
}

variable "static_site_error_document" {
  description = "Error document served for unmatched routes (SPA fallback)."
  type        = string
  default     = "index.html"
}
