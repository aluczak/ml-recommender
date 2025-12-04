output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "Login server URL for Azure Container Registry"
  value       = module.acr.login_server
}

output "acr_name" {
  description = "Name of the Azure Container Registry"
  value       = module.acr.acr_name
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.keyvault.key_vault_uri
}

output "app_service_name" {
  description = "Name of the App Service"
  value       = module.app_service.app_service_name
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = "https://${module.app_service.default_hostname}"
}

output "static_web_app_url" {
  description = "URL of the Static Web App"
  value       = module.static_web_app.default_hostname
}

output "static_web_app_name" {
  description = "Name of the Static Web App"
  value       = module.static_web_app.static_web_app_name
}

output "static_web_app_api_key" {
  description = "API key for Static Web App deployment"
  value       = module.static_web_app.api_key
  sensitive   = true
}

output "postgresql_fqdn" {
  description = "Fully qualified domain name of PostgreSQL server"
  value       = module.postgresql.fqdn
}

output "github_actions_client_id" {
  description = "Client ID for GitHub Actions federated identity"
  value       = azuread_application.github_actions.client_id
}

output "github_actions_tenant_id" {
  description = "Tenant ID for GitHub Actions"
  value       = data.azurerm_client_config.current.tenant_id
}

output "github_actions_subscription_id" {
  description = "Subscription ID for GitHub Actions"
  value       = data.azurerm_client_config.current.subscription_id
}
