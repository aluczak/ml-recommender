# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies including OpenSSH for Azure App Service SSH support
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        openssh-server \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH for Azure App Service
RUN mkdir -p /var/run/sshd \
    && echo "root:Docker!" | chpasswd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Copy SSH configuration for Azure App Service
COPY sshd_config /etc/ssh/

COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p instance

ENV PORT=8000
EXPOSE 8000 2222

# Copy startup script
COPY startup.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/startup.sh

CMD ["/usr/local/bin/startup.sh"]
