# Infrastructure

Terraform definitions for Azure live inside `infra/terraform`. The configuration provisions the minimum resources required for Milestone 1 deployments:

- Resource group that keeps everything together
- Azure Container Registry (ACR) for backend images
- Linux App Service plan + Web App configured for a containerized backend
- Azure Database for PostgreSQL Flexible Server with a dedicated `appdb` database
- Storage account with static website hosting for serving the React build artifacts
- Azure Key Vault that stores the database admin password, `SECRET_KEY`, and the `DATABASE_URL` secret that the App Service reads via Key Vault references (secrets themselves are authored manually, not via Terraform)

## Prerequisites
- Terraform 1.6+
- Azure CLI authenticated to the subscription that should own the resources
- Service principal with `Contributor` rights (used by Terraform locally and by GitHub Actions)

## Usage
```
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars  # fill in subscription_id, tenant_id, passwords, etc.
terraform init
terraform plan
terraform apply
```

Key variables you are expected to override:
- `subscription_id` / `tenant_id` – the Azure context Terraform should target
- `project_name`, `environment`, `location` – influence how resources are named and where they live
- `postgres_admin_password_secret_name`, `app_secret_key_secret_name`, `database_url_secret_name` – Key Vault secret names Terraform/ App Service will reference (values are created manually by you)
- `postgres_admin_username` – admin login for PostgreSQL (password fetched from the above secret)
- `app_service_sku`, `postgres_sku_name` – scale settings you can dial up/down per environment
- `key_vault_sku` / `key_vault_purge_protection` – Key Vault tier and whether purge protection is enforced

Destroy the environment with `terraform destroy` when experimenting.

## Outputs
`terraform output` surfaces the resource group, backend hostname, ACR login server, Key Vault URI/secret URIs, and the static website endpoint. Feed those values into GitHub Action secrets or local tooling as needed.

## Key Vault workflow
1. Run `terraform apply -target=azurerm_key_vault.main` the first time to create the Key Vault (no secrets yet).
2. Add the required secrets manually (Azure Portal or CLI), matching the names in `postgres_admin_password_secret_name`, `app_secret_key_secret_name`, and `database_url_secret_name`.
	- The admin password secret must exist (and be readable by your Terraform principal) before you run a full `terraform apply`, because the PostgreSQL server resource needs that value.
	- The database URL secret is what the App Service reads at runtime. Populate it after Terraform outputs the database FQDN if you don’t already have the connection string.
3. Re-run `terraform apply` without `-target`. Terraform will read the admin password secret value to configure PostgreSQL, while the App Service simply references the secret URIs (no values are stored in code).
4. The App Service’s managed identity has `get/list` access to the vault, enabling it to resolve Key Vault references at runtime.

## Next Steps
- After the infrastructure is in place, add the output values as GitHub repository secrets so the deployment workflow can push containers, configure the App Service, and upload frontend assets.
