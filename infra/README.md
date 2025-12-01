# Infrastructure

Terraform is now split into two independent stacks so that shared, long-lived resources can be provisioned separately from application infrastructure:

| Path | Purpose |
| --- | --- |
| `infra/terraform-shared` | Creates the shared resource group, Azure Container Registry, Key Vault (plus an access policy for the current identity), the dedicated Storage Account + container that host Terraform state, and (optionally) an Azure AD application/service principal with a GitHub Actions federated credential. |
| `infra/terraform-app` | Creates the application resource group, App Service plan + Web App, PostgreSQL flexible server/database, firewall rules, the frontend storage account with static website enabled, and the Key Vault access policy for the Web App’s managed identity. Supply the shared resource group + Key Vault details as variables so it can reference the already-provisioned secrets. |

Each stack keeps its own state (you can wire both to the same remote backend but give them different state file names/keys). The app stack depends on the outputs produced by the shared stack, so always apply the shared stack first.

## Prerequisites
- Terraform 1.6+
- Azure CLI authenticated to the subscription that should own the resources
- Service principal or user with `Contributor` on both resource groups

## Workflow
1. **Shared stack**
	```pwsh
	cd infra/terraform-shared
	cp terraform.tfvars.example terraform.tfvars   # fill in subscription_id, tenant_id, etc.
	terraform init
	terraform plan
	terraform apply
	```
	This creates the shared resource group, Key Vault, Terraform-state storage account/container, and ACR. Once the Key Vault exists, add the required secrets (`postgres-admin-password` and `backend-secret-key` by default) via Azure CLI or the portal. The app stack will compose and store the `backend-database-url` secret automatically once PostgreSQL is provisioned.
2. **App stack**
	```pwsh
	cd ../terraform-app
	cp terraform.tfvars.example terraform.tfvars   # reuse subscription/tenant plus app-specific settings
	# copy the shared resource group name, Key Vault name, and Key Vault URI from the shared stack outputs
	terraform init
	terraform plan
	terraform apply
	```

Destroy environments with `terraform destroy` inside each stack when experimenting.

## Important variables
- `subscription_id` / `tenant_id` – Azure context
- `project_name`, `environment`, `location` – naming + region for both stacks
- `shared_namespace` (shared stack) – optional identifier that drives shared resource names so they can stay consistent even when multiple apps share the same platform resources (defaults to `project_name`)
- `shared_resource_group_name`, `shared_key_vault_name`, `shared_key_vault_uri` (app stack) – copy these from the shared stack outputs so the app stack can grant access and hydrate secrets without reading another state file
- `frontend_storage_account_name` (app stack, optional) – lets you explicitly set the SPA storage account name so GitHub Actions and Terraform reference the same value
- `postgres_admin_password_secret_name`, `app_secret_key_secret_name`, `database_url_secret_name` – secret names the app relies on; the first two must exist before running the app stack, while Terraform now writes the database URL secret automatically
- `postgres_admin_username`, `postgres_sku_name`, `app_service_sku` – performance knobs per environment
- `enable_github_oidc`, `github_app_display_name`, `github_oidc_subject` – control whether the shared stack provisions an Azure AD application + federated credential for GitHub Actions
- When `enable_github_oidc` is true, the shared stack also grants that service principal the `Contributor` and `Storage Blob Data Contributor` roles at the subscription scope so GitHub workflows can deploy resources and upload frontend assets without extra RBAC steps

## Outputs
- **Shared stack**: resource group/location, Key Vault ID/name/URI, Terraform-state storage account/container details, container registry info, and (if enabled) the Azure AD application/service principal identifiers for GitHub Actions.
- **App stack**: app resource group, backend hostname, PostgreSQL FQDN, frontend storage account/static site endpoint, and helper URIs for the expected Key Vault secrets (sourced from the shared stack).

## Key Vault workflow
1. Apply the shared stack (creates the Key Vault and grants the current identity `get/list/set`).
2. Populate the manual secrets (`postgres-admin-password`, `backend-secret-key`).
3. Apply the app stack. Terraform reads the admin password secret, provisions PostgreSQL, composes the `backend-database-url` secret inside the Key Vault, and configures the Web App to reference it. The Web App’s managed identity receives `get/list` permissions from this stack.

## CI/CD considerations
- Configure both stacks to use the same remote backend (Azure Storage + blob container, Terraform Cloud, etc.) but different state file names. This lets local runs and any future automation operate against a single source of truth with locking.
- If you later add automation, run the shared stack job first (it often becomes a no-op) and reuse the Terraform-state storage account/container emitted by the shared stack.
