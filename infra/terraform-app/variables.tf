variable "subscription_id" {
  description = "Azure subscription ID that will own the resources."
  type        = string
}

variable "tenant_id" {
  description = "Azure Active Directory tenant ID used for authentication."
  type        = string
}

variable "location" {
  description = "Azure region where the resources will be provisioned."
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
  description = "Optional map of tags to spread across all resources."
  type        = map(string)
  default     = {}
}

variable "shared_state_path" {
  description = "Path (relative to this module) to the terraform-shared state file when using the local backend."
  type        = string
  default     = "../terraform-shared/terraform.tfstate"
}

variable "postgres_admin_username" {
  description = "Administrator username for the PostgreSQL flexible server (without @servername suffix)."
  type        = string
  default     = "mlshopadmin"
}

variable "postgres_admin_password_secret_name" {
  description = "Name of the Key Vault secret that contains the PostgreSQL admin password."
  type        = string
  default     = "postgres-admin-password"
}

variable "app_secret_key_secret_name" {
  description = "Name of the Key Vault secret that contains the Flask SECRET_KEY."
  type        = string
  default     = "backend-secret-key"
}

variable "postgres_version" {
  description = "Major version for PostgreSQL flexible server."
  type        = string
  default     = "16"
}

variable "postgres_storage_mb" {
  description = "Allocated storage (in MB) for PostgreSQL flexible server."
  type        = number
  default     = 32768
}

variable "postgres_sku_name" {
  description = "SKU for PostgreSQL flexible server (e.g., Standard_B1ms)."
  type        = string
  default     = "Standard_B1ms"
}

variable "postgres_backup_retention_days" {
  description = "Number of days backups are retained for PostgreSQL flexible server."
  type        = number
  default     = 7
}

variable "app_service_sku" {
  description = "SKU for the Linux App Service plan (e.g., P1v3, B1)."
  type        = string
  default     = "P1v3"
}

variable "database_url_secret_name" {
  description = "Name of the Key Vault secret that stores the DATABASE_URL connection string."
  type        = string
  default     = "backend-database-url"
}

variable "app_service_container_port" {
  description = "Internal port exposed by the backend container."
  type        = number
  default     = 8000
}

variable "enable_zone_redundant" {
  description = "Whether to enable zone redundant configuration for supported resources."
  type        = bool
  default     = false
}

variable "initial_container_image" {
  description = "Placeholder container image to configure on the Linux Web App until CI/CD updates it."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}
