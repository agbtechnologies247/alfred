#!/bin/bash
# A.L.F.R.E.D. -- Single-command VPS Re-deployment Script
set -e

echo "=========================================================="
echo " Starting VPS Deployment for A.L.F.R.E.D. services..."
echo "=========================================================="

# Determine project root directory
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "1. Pulling latest commits from origin main..."
git fetch origin main
git reset --hard origin/main

echo "2. Rebuilding Docker container images without stale layer cache..."
docker compose build --no-cache frontend api-gateway public-site

echo "3. Starting containerized services in detached mode..."
docker compose up -d

echo "4. Cleaning up unused dangling Docker images/caches..."
docker image prune -f

echo "=========================================================="
echo " Deployment completed successfully. All services nominal!"
echo "=========================================================="
