# Security Recommendations for Production

This document outlines security improvements that should be considered when moving from development/learning to production deployment.

## Current Implementation

The current infrastructure implements several security best practices:

✅ **Implemented**
- Private networking for PostgreSQL (not publicly accessible)
- Managed Identity for App Service to Key Vault access
- Federated Identity for GitHub Actions (no long-lived credentials)
- SSL/TLS required for all connections
- CORS restricted to specific origins
- Secrets stored in Key Vault
- HTTPS-only enforcement

## Recommended Improvements for Production

### 1. Database Connection String Management

**Current**: Connection string with password is stored in Terraform state and Key Vault.

**Recommendation**: Use Azure AD authentication for PostgreSQL instead of password-based authentication.

```hcl
# Enable Azure AD authentication on PostgreSQL
resource "azurerm_postgresql_flexible_server_active_directory_administrator" "main" {
  server_name         = azurerm_postgresql_flexible_server.main.name
  resource_group_name = var.resource_group_name
  tenant_id           = var.tenant_id
  object_id           = var.app_service_principal_id
  principal_name      = "app-service-identity"
  principal_type      = "ServicePrincipal"
}
```

**Impact**: Eliminates password storage, uses managed identity for database access.

### 2. Key Vault References in App Settings

**Current**: Secrets passed directly as App Service environment variables.

**Recommendation**: Use Key Vault references in App Settings.

```hcl
app_settings = {
  SECRET_KEY   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.app_secret.id})"
  DATABASE_URL = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.db_url.id})"
}
```

**Benefits**:
- Secrets never stored in App Service configuration
- Automatic rotation support
- Centralized secret management

**Note**: Requires App Service to have Key Vault "Get Secret" permission (already configured).

### 3. PostgreSQL Firewall Rules

**Current**: Allows all Azure services (0.0.0.0-0.0.0.0).

**Recommendation**: Use service endpoints or private endpoint exclusively.

```hcl
# Remove the allow-all Azure services rule
# Instead, rely on VNet integration and delegated subnet
# The App Service subnet already has service endpoints configured
```

**Benefits**:
- Restricts access to only the App Service subnet
- No other Azure services can access the database

**Implementation**:
- Remove `azurerm_postgresql_flexible_server_firewall_rule` resource
- Ensure VNet integration is working correctly
- Test connectivity from App Service

### 4. Container Registry Authentication

**Current**: Admin credentials enabled for simplicity.

**Recommendation**: Use managed identity or service principal.

```hcl
# Disable admin
resource "azurerm_container_registry" "main" {
  admin_enabled = false
  # ... other settings
}

# Grant App Service AcrPull role
resource "azurerm_role_assignment" "app_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id
}

# Configure App Service to use managed identity
site_config {
  application_stack {
    docker_image_name = "${var.acr_login_server}/mlshop-backend:latest"
    # No credentials needed - uses managed identity
  }
  acr_use_managed_identity_credentials = true
}
```

**Benefits**:
- No static credentials to manage or rotate
- Audit trail of who accessed the registry
- Follows principle of least privilege

### 5. Database Migration Strategy

**Current**: Migrations run via SSH in GitHub Actions workflow.

**Recommendation**: Use Azure Container Instances or separate job for migrations.

**Option A: Azure Container Instances**

```yaml
- name: Run database migrations
  run: |
    az container create \
      --resource-group $RESOURCE_GROUP \
      --name migration-job-${{ github.run_id }} \
      --image $ACR_LOGIN_SERVER/mlshop-backend:$IMAGE_TAG \
      --registry-login-server $ACR_LOGIN_SERVER \
      --registry-username $ACR_USERNAME \
      --registry-password $ACR_PASSWORD \
      --environment-variables DATABASE_URL=$DATABASE_URL \
      --command-line "alembic upgrade head" \
      --restart-policy Never
    
    # Wait for completion and check logs
    az container logs --resource-group $RESOURCE_GROUP --name migration-job-${{ github.run_id }}
    
    # Cleanup
    az container delete --resource-group $RESOURCE_GROUP --name migration-job-${{ github.run_id }} --yes
```

**Option B: Separate Job with Retry Logic**

```yaml
- name: Wait for App Service to be ready
  run: |
    for i in {1..30}; do
      if az webapp ssh --name $APP_NAME --resource-group $RG --command "echo ready" 2>/dev/null; then
        break
      fi
      echo "Waiting for SSH... ($i/30)"
      sleep 10
    done

- name: Run migrations with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: |
      az webapp ssh --name $APP_NAME --resource-group $RG \
        --command "cd /app && alembic upgrade head"
```

**Benefits**:
- More reliable than SSH
- Better error handling
- Cleaner separation of concerns

### 6. Additional Security Hardening

#### Network Security Groups

```hcl
# Add NSG to control traffic flow
resource "azurerm_network_security_group" "database" {
  name                = "nsg-database"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowAppServiceSubnet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.1.0/24"  # App Service subnet
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAll"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}
```

#### Web Application Firewall

For production, consider Azure Front Door with WAF:

```hcl
resource "azurerm_frontdoor" "main" {
  name                = "fd-${var.project_name}"
  resource_group_name = var.resource_group_name

  frontend_endpoint {
    name      = "frontend"
    host_name = "mlshop.example.com"
  }

  backend_pool {
    name = "backend-pool"
    backend {
      host_header = azurerm_linux_web_app.main.default_hostname
      address     = azurerm_linux_web_app.main.default_hostname
      http_port   = 80
      https_port  = 443
    }
  }

  # Add WAF policy
  web_application_firewall_policy_link_id = azurerm_frontdoor_firewall_policy.main.id
}
```

#### Automated Secret Rotation

Implement Azure Function or Logic App to rotate secrets:
- PostgreSQL password rotation
- Flask secret key rotation
- ACR credentials rotation (if using admin)

### 7. Compliance and Auditing

#### Enable Azure Policy

```hcl
# Require HTTPS only
resource "azurerm_policy_assignment" "https_only" {
  name                 = "require-https"
  scope                = azurerm_resource_group.main.id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/..."
}
```

#### Enable Azure Monitor

```hcl
resource "azurerm_monitor_diagnostic_setting" "app_service" {
  name                       = "diag-app-service"
  target_resource_id         = azurerm_linux_web_app.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  log {
    category = "AppServiceHTTPLogs"
    enabled  = true
  }

  log {
    category = "AppServiceConsoleLogs"
    enabled  = true
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
```

#### Enable Azure Security Center

```hcl
resource "azurerm_security_center_subscription_pricing" "main" {
  tier          = "Standard"
  resource_type = "VirtualMachines"
}
```

## Implementation Priority

### High Priority (Production Blockers)
1. Key Vault references in App Settings
2. Disable admin credentials on ACR
3. Remove all-Azure-services firewall rule

### Medium Priority (Security Improvements)
1. Azure AD authentication for PostgreSQL
2. Improved migration strategy
3. Network Security Groups

### Low Priority (Enhanced Security)
1. Web Application Firewall
2. Automated secret rotation
3. Azure Policy compliance

## Testing Security Changes

After implementing security improvements, verify:

1. **Connectivity**
   ```bash
   az webapp ssh --name $APP_NAME --resource-group $RG
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

2. **Authentication**
   ```bash
   # Verify managed identity is working
   az webapp identity show --name $APP_NAME --resource-group $RG
   ```

3. **Network Isolation**
   ```bash
   # Should fail from outside VNet
   psql -h <postgresql-fqdn> -U psqladmin -d mlshop
   ```

4. **CORS Configuration**
   ```bash
   curl -H "Origin: https://malicious.com" https://<app-url>/api/health
   # Should return CORS error
   ```

## Cost Impact

| Change | Monthly Cost Impact |
|--------|-------------------|
| Azure AD Auth | No cost |
| Key Vault References | No additional cost |
| Remove ACR admin | No cost |
| Container Instances (migrations) | ~$1-2 (minimal usage) |
| Azure Monitor | $2-5 per GB |
| Front Door + WAF | $35+ base + traffic |
| Security Center | Varies by resources |

## Migration Path

1. **Phase 1**: Non-breaking changes
   - Enable Key Vault references
   - Add monitoring and logging
   - Implement better migration strategy

2. **Phase 2**: Breaking changes
   - Switch to managed identity for ACR
   - Enable Azure AD for PostgreSQL
   - Remove firewall rules

3. **Phase 3**: Advanced features
   - Add WAF
   - Implement secret rotation
   - Add compliance policies

## Conclusion

The current implementation provides a solid security foundation suitable for development and learning environments. For production use:

1. **Must Have**: Key Vault references, disable ACR admin
2. **Should Have**: Azure AD auth, NSGs, improved migrations
3. **Nice to Have**: WAF, automated rotation, compliance policies

All changes should be tested in a non-production environment first and deployed using the same Terraform workflow to maintain infrastructure as code principles.
