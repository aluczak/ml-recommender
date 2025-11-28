output "resource_group_name" {
  description = "Name of the resource group for application resources."
  value       = azurerm_resource_group.app.name
}

output "backend_web_app_url" {
  description = "Default hostname for the backend App Service."
  value       = azurerm_linux_web_app.api.default_hostname
}

output "postgres_fqdn" {
  description = "Fully qualified domain name for the PostgreSQL flexible server."
  value       = azurerm_postgresql_flexible_server.db.fqdn
}

output "key_vault_uri" {
  description = "URI of the shared Azure Key Vault storing application secrets."
  value       = data.terraform_remote_state.shared.outputs.key_vault_uri
}

output "key_vault_secret_uris" {
  description = "Helper map of Key Vault secret URIs the app expects (no secret values)."
  value = {
    postgres_admin_password = format("%ssecrets/%s", data.terraform_remote_state.shared.outputs.key_vault_uri, var.postgres_admin_password_secret_name)
    backend_secret_key      = format("%ssecrets/%s", data.terraform_remote_state.shared.outputs.key_vault_uri, var.app_secret_key_secret_name)
    database_url            = format("%ssecrets/%s", data.terraform_remote_state.shared.outputs.key_vault_uri, var.database_url_secret_name)
  }
}
