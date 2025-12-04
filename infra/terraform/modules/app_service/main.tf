resource "azurerm_service_plan" "main" {
  name                = "asp-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "B1"
  
  tags = var.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "app-${var.project_name}-backend-${var.suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  
  site_config {
    always_on = true
    
    application_stack {
      docker_image_name   = "${var.acr_login_server}/mlshop-backend:latest"
      docker_registry_url = "https://${var.acr_login_server}"
      docker_registry_username = var.acr_admin_username
      docker_registry_password = var.acr_admin_password
    }
    
    health_check_path = "/api/health"
    
    cors {
      allowed_origins = [
        "https://${var.static_web_app_hostname}",
        "http://localhost:5173",  # Local development
        "http://localhost:3000"   # Alternative local dev port
      ]
      support_credentials = true
    }
  }
  
  app_settings = {
    WEBSITES_PORT                       = "8000"
    DOCKER_ENABLE_CI                    = "true"
    APP_ENV                             = "production"
    FLASK_DEBUG                         = "0"
    SECRET_KEY                          = var.secret_key
    DATABASE_URL                        = var.database_connection_string
    ACCESS_TOKEN_EXP_MINUTES            = "120"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    # Enable SSH for az webapp ssh command
    SSH_PORT                            = "2222"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = var.tags
}

# VNet integration
resource "azurerm_app_service_virtual_network_swift_connection" "main" {
  app_service_id = azurerm_linux_web_app.main.id
  subnet_id      = var.subnet_id
}
