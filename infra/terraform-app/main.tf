locals {
  normalized_project = lower(join("", regexall("[A-Za-z0-9]", var.project_name)))
  normalized_env     = lower(join("", regexall("[A-Za-z0-9]", var.environment)))
  name_prefix        = substr("${local.normalized_project}-${local.normalized_env}", 0, 40)

  resource_group_name = "${local.name_prefix}-app-rg"
  service_plan_name   = "${local.name_prefix}-plan"
  web_app_name        = "${local.name_prefix}-api"
  storage_account_name = substr(
    "${local.normalized_project}${local.normalized_env}sa",
    0,
    24
  )
  postgres_server_name = substr(
    "${local.normalized_project}${local.normalized_env}pg",
    0,
    63
  )

  tags = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
    },
    var.tags
  )
}

data "terraform_remote_state" "shared" {
  backend = "local"

  config = {
    path = abspath("${path.module}/${var.shared_state_path}")
  }
}

data "azurerm_key_vault" "shared" {
  name                = data.terraform_remote_state.shared.outputs.key_vault_name
  resource_group_name = data.terraform_remote_state.shared.outputs.resource_group_name
}

resource "azurerm_resource_group" "app" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_service_plan" "api" {
  name                = local.service_plan_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = local.tags
}

resource "azurerm_storage_account" "frontend" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.app.name
  location                 = azurerm_resource_group.app.location
  account_tier             = "Standard"
  account_replication_type = var.storage_account_replication
  access_tier              = "Hot"
  allow_nested_items_to_be_public = true
  https_traffic_only_enabled      = true
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  tags                            = local.tags
}

resource "azurerm_storage_account_static_website" "frontend" {
  storage_account_id = azurerm_storage_account.frontend.id
  index_document     = var.static_site_index_document
  error_404_document = var.static_site_error_document
}

data "azurerm_key_vault_secret" "postgres_admin_password" {
  name         = var.postgres_admin_password_secret_name
  key_vault_id = data.azurerm_key_vault.shared.id
}

resource "azurerm_postgresql_flexible_server" "db" {
  name                = local.postgres_server_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location
  version             = var.postgres_version
  sku_name            = var.postgres_sku_name
  storage_mb          = var.postgres_storage_mb
  backup_retention_days      = var.postgres_backup_retention_days
  administrator_login        = var.postgres_admin_username
  administrator_password     = data.azurerm_key_vault_secret.postgres_admin_password.value
  zone = var.enable_zone_redundant ? "1" : null

  dynamic "high_availability" {
    for_each = var.enable_zone_redundant ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = "2"
    }
  }

  public_network_access_enabled = true
  tags                           = local.tags
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_linux_web_app" "api" {
  name                = local.web_app_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location
  service_plan_id     = azurerm_service_plan.api.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      docker_image_name   = var.initial_container_image
      docker_registry_url = "https://registry.hub.docker.com"
    }
    always_on   = true
    ftps_state  = "Disabled"
    http2_enabled = true
  }

  app_settings = {
    "WEBSITES_PORT"                       = tostring(var.app_service_container_port)
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DATABASE_URL" = format(
      "@Microsoft.KeyVault(SecretUri=%s)",
      format("%ssecrets/%s", data.terraform_remote_state.shared.outputs.key_vault_uri, var.database_url_secret_name)
    )
    "SECRET_KEY" = format(
      "@Microsoft.KeyVault(SecretUri=%s)",
      format("%ssecrets/%s", data.terraform_remote_state.shared.outputs.key_vault_uri, var.app_secret_key_secret_name)
    )
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "KEY_VAULT_URI"                  = data.terraform_remote_state.shared.outputs.key_vault_uri
  }

  tags = local.tags
}

resource "azurerm_key_vault_access_policy" "webapp" {
  key_vault_id = data.azurerm_key_vault.shared.id
  tenant_id    = var.tenant_id
  object_id    = azurerm_linux_web_app.api.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
