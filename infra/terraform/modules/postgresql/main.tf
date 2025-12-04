resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${var.project_name}-${var.suffix}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  delegated_subnet_id    = var.subnet_id
  private_dns_zone_id    = var.private_dns_zone_id
  administrator_login    = "psqladmin"
  administrator_password = var.admin_password
  zone                   = "1"
  public_network_access_enabled = false  # Enforce private access when using delegated subnet
  
  storage_mb = 32768
  sku_name   = "B_Standard_B1ms"
  
  tags = var.tags
  
  depends_on = [var.private_dns_zone_id]
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}
