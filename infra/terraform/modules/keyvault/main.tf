resource "azurerm_key_vault" "main" {
  name                       = "kv-${var.project_name}-${var.suffix}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  
  tags = var.tags
}

# Access policy for admin users
resource "azurerm_key_vault_access_policy" "admin" {
  count = length(var.admin_object_ids)
  
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = var.tenant_id
  object_id    = var.admin_object_ids[count.index]
  
  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Backup",
    "Restore",
    "Purge"
  ]
  
  key_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Recover",
    "Backup",
    "Restore",
    "Purge"
  ]
}
