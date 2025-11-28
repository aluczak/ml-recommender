output "resource_group_name" {
  description = "Name of the shared resource group."
  value       = azurerm_resource_group.shared.name
}

output "resource_group_location" {
  description = "Location of the shared resource group."
  value       = azurerm_resource_group.shared.location
}

output "key_vault_id" {
  description = "Resource ID of the shared Key Vault."
  value       = azurerm_key_vault.shared.id
}

output "key_vault_name" {
  description = "Name of the shared Key Vault."
  value       = azurerm_key_vault.shared.name
}

output "key_vault_uri" {
  description = "URI endpoint of the shared Key Vault for secret references."
  value       = azurerm_key_vault.shared.vault_uri
}

output "storage_account_id" {
  description = "Resource ID of the frontend storage account."
  value       = azurerm_storage_account.frontend.id
}

output "storage_account_name" {
  description = "Name of the frontend storage account."
  value       = azurerm_storage_account.frontend.name
}

output "storage_primary_web_endpoint" {
  description = "Primary endpoint serving the frontend static website."
  value       = azurerm_storage_account.frontend.primary_web_endpoint
}

output "container_registry_name" {
  description = "Name of the Azure Container Registry."
  value       = azurerm_container_registry.acr.name
}

output "container_registry_login_server" {
  description = "Login server URL for the Azure Container Registry."
  value       = azurerm_container_registry.acr.login_server
}

output "container_registry_admin_username" {
  description = "Admin-enabled username for the container registry (useful for bootstrapping CI)."
  value       = azurerm_container_registry.acr.admin_username
}
