output "resource_group_name" {
  description = "Name of the resource group that contains all Azure resources."
  value       = azurerm_resource_group.main.name
}

output "container_registry_login_server" {
  description = "Login server URL for the Azure Container Registry."
  value       = azurerm_container_registry.acr.login_server
}

output "container_registry_admin_username" {
  description = "Admin-enabled username for the container registry (used for CI/CD pushes)."
  value       = azurerm_container_registry.acr.admin_username
}

output "backend_web_app_url" {
  description = "Default hostname for the backend App Service."
  value       = azurerm_linux_web_app.api.default_hostname
}

output "storage_static_website_url" {
  description = "Primary endpoint serving the frontend static website."
  value       = azurerm_storage_account_static_website.frontend.primary_endpoint
}

output "postgres_fqdn" {
  description = "Fully qualified domain name for the PostgreSQL flexible server."
  value       = azurerm_postgresql_flexible_server.db.fqdn
}

output "key_vault_uri" {
  description = "URI of the Azure Key Vault storing application secrets."
  value       = azurerm_key_vault.main.vault_uri
}

output "key_vault_secret_uris" {
  description = "Helper map of Key Vault secret URIs the app expects (no secret values)."
  value = {
    postgres_admin_password = format("%ssecrets/%s", azurerm_key_vault.main.vault_uri, var.postgres_admin_password_secret_name)
    backend_secret_key      = format("%ssecrets/%s", azurerm_key_vault.main.vault_uri, var.app_secret_key_secret_name)
    database_url            = format("%ssecrets/%s", azurerm_key_vault.main.vault_uri, var.database_url_secret_name)
  }
}
