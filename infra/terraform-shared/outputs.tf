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

output "tfstate_storage_account_name" {
  description = "Storage account used to host Terraform state blobs."
  value       = azurerm_storage_account.tfstate.name
}

output "tfstate_storage_account_primary_key" {
  description = "Primary access key for the Terraform state storage account (handle securely)."
  value       = azurerm_storage_account.tfstate.primary_access_key
  sensitive   = true
}

output "tfstate_container_name" {
  description = "Name of the private container that stores Terraform state blobs."
  value       = azurerm_storage_container.tfstate.name
}
