variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "mlshop"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "static_web_app_location" {
  description = "Azure region for Static Web App (limited regions available)"
  type        = string
  default     = "eastus2"
}

variable "database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "mlshop"
}

variable "postgresql_admin_password" {
  description = "Administrator password for PostgreSQL server"
  type        = string
  sensitive   = true
}

variable "app_secret_key" {
  description = "Secret key for Flask application"
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub repository in format owner/repo"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch for federated identity"
  type        = string
  default     = "main"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ML Recommender Shop"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
