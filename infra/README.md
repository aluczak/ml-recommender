# Infrastructure

Terraform is now split into two independent stacks so that shared, long-lived resources can be provisioned separately from application infrastructure:

| Path | Purpose |
| --- | --- |
| `infra/terraform-shared` | Creates the shared resource group, Azure Container Registry, Key Vault (plus an access policy for the current identity), and the Storage Account that serves the static frontend. |
| `infra/terraform-app` | Creates the application resource group, App Service plan + Web App, PostgreSQL flexible server/database, firewall rules, and the Key Vault access policy for the Web App’s managed identity. This stack consumes outputs from the shared stack via a `terraform_remote_state` data source. |

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
	This creates the shared resource group, Key Vault, Storage Account, and ACR. Once the Key Vault exists, add the required secrets (`postgres-admin-password`, `backend-secret-key`, `backend-database-url` by default) via Azure CLI or the portal.
2. **App stack**
	```pwsh
	cd ../terraform-app
	cp terraform.tfvars.example terraform.tfvars   # reuse subscription/tenant plus app-specific settings
	terraform init
	terraform plan
	terraform apply
	```
	The default configuration for `data "terraform_remote_state" "shared"` expects the shared stack to store its state locally at `../terraform-shared/terraform.tfstate`. If you switch to a remote backend, update `shared_state_path` (or change the backend block entirely) so the app stack can locate the shared outputs.

Destroy environments with `terraform destroy` inside each stack when experimenting.

## Important variables
- `subscription_id` / `tenant_id` – Azure context
- `project_name`, `environment`, `location` – naming + region for both stacks
- `shared_state_path` (app stack) – where to read the shared state when using the local backend
- `postgres_admin_password_secret_name`, `app_secret_key_secret_name`, `database_url_secret_name` – names of secrets you manually place inside the shared Key Vault
- `postgres_admin_username`, `postgres_sku_name`, `app_service_sku` – performance knobs per environment

## Outputs
- **Shared stack**: resource group/location, Key Vault ID/name/URI, storage account identifiers, static website endpoint, and container registry details.
- **App stack**: app resource group, backend hostname, PostgreSQL FQDN, and helper URIs for the expected Key Vault secrets (sourced from the shared stack).

## Key Vault workflow
1. Apply the shared stack (creates the Key Vault and grants the current identity `get/list/set`).
2. Populate the required secrets manually.
3. Apply the app stack. Terraform now reads the admin password secret value to configure PostgreSQL, while the App Service only consumes secret URIs through Key Vault references. The Web App’s managed identity receives `get/list` permissions from this stack.

## CI/CD considerations
- Configure both stacks to use the same remote backend (Azure Storage + blob container, Terraform Cloud, etc.) but different state file names. This lets local runs and GitHub Actions operate against a single source of truth with locking.
- Run the shared stack job first (it often becomes a no-op), then the app stack.

## Automation
- `.github/workflows/terraform-shared.yml` deploys the shared stack on pushes to `infra/terraform-shared/**` (or manually). It expects the following repository secrets:
	- `AZURE_CREDENTIALS`: same JSON used elsewhere for `azure/login` (OIDC or client secret flow).
	- `TF_SHARED_TFVARS`: contents of the `terraform-shared` tfvars file (subscription/tenant IDs, naming prefs, etc.).
	- `TF_STATE_STORAGE`, `TF_STATE_CONTAINER`, `TF_STATE_KEY_SHARED`: storage account name, blob container, and blob key where the shared state is stored.
	- `TF_STATE_STORAGE_KEY`: storage account access key so Terraform can read/write the backend blob in CI.
- The workflow writes the tfvars/backend config at runtime, runs `terraform init/plan/apply`, and scrubs the generated files afterwards. Mirror a similar workflow for `terraform-app` once its backend is ready so both stacks can be deployed automatically.
