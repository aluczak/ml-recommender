# Backend Application

Flask backend API for the ML Recommender Shop.

## Docker Container Configuration

This backend is containerized and deployed to Azure App Service. The following files are critical for container operation:

- **`Dockerfile`**: Container build configuration
- **`startup.sh`**: Startup script that launches SSH daemon and Gunicorn
- **`sshd_config`**: SSH daemon configuration for Azure App Service

### Important: Line Endings

⚠️ **These files MUST use LF (Unix) line endings, not CRLF (Windows)**

If you edit these files on Windows, ensure your editor saves with LF line endings:
- **VS Code**: Check the bottom-right status bar - it should say "LF" not "CRLF"
- **Git**: The `.gitattributes` file in the root ensures correct line endings on checkout

If you see errors like `exec /usr/local/bin/startup.sh: no such file or directory` in Azure App Service logs, it's likely due to CRLF line endings.

**To fix locally:**
```bash
# Convert CRLF to LF
dos2unix Dockerfile startup.sh sshd_config

# Or using sed
sed -i 's/\r$//' Dockerfile startup.sh sshd_config
```

## SSH Access

The container includes SSH support for Azure App Service:
- SSH runs on port 2222 (Azure requirement)
- Access via `az webapp ssh --name <app-name> --resource-group <rg>`
- Or use Azure Portal → App Service → SSH

## Local Development

See the main [README.md](../README.md) for development setup instructions.

## Docker Build

```bash
# Build locally
docker build -t mlshop-backend .

# Run locally
docker run -p 8000:8000 -p 2222:2222 mlshop-backend
```

## Deployment

See [infra/README.md](../infra/README.md) for deployment instructions.
