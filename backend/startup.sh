#!/bin/bash
set -e

# Start SSH daemon for Azure App Service
echo "Starting SSH daemon..."
/usr/sbin/sshd

# Start the application
echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:8000 "app:create_app()"
