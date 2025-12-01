locals {
  normalized_project = lower(join("", regexall("[A-Za-z0-9]", var.project_name)))
  normalized_env     = lower(join("", regexall("[A-Za-z0-9]", var.environment)))
  name_prefix        = substr("${local.normalized_project}-${local.normalized_env}", 0, 40)

  resource_group_name = "${local.name_prefix}-shared-rg"
  key_vault_name      = substr("${local.name_prefix}-kv", 0, 24)
  state_storage_account_name = substr(
    "${local.normalized_project}${local.normalized_env}tfstate",
    0,
    24
  )
  acr_name = substr(
    "${local.normalized_project}${local.normalized_env}acr",
    0,
    50
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

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "shared" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_container_registry" "acr" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  sku                 = var.acr_sku
  admin_enabled       = true
  tags                = local.tags
}

resource "azurerm_storage_account" "tfstate" {
  name                     = local.state_storage_account_name
  resource_group_name      = azurerm_resource_group.shared.name
  location                 = azurerm_resource_group.shared.location
  account_tier             = "Standard"
  account_replication_type = var.tfstate_account_replication
  allow_nested_items_to_be_public = false
  https_traffic_only_enabled      = true
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  tags                            = local.tags
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
}

resource "azurerm_key_vault" "shared" {
  name                        = local.key_vault_name
  location                    = azurerm_resource_group.shared.location
  resource_group_name         = azurerm_resource_group.shared.name
  tenant_id                   = var.tenant_id
  sku_name                    = var.key_vault_sku
  soft_delete_retention_days  = 7
  purge_protection_enabled    = var.key_vault_purge_protection
  public_network_access_enabled = true
  enable_rbac_authorization   = false
  tags                        = local.tags
}

resource "azurerm_key_vault_access_policy" "current" {
  key_vault_id = azurerm_key_vault.shared.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set"
  ]
}
