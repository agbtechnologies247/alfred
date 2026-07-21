#!/bin/bash
# A.L.F.R.E.D. -- Single-command VPS Re-deployment Script
set -e

echo "=========================================================="
echo " Starting VPS Deployment for A.L.F.R.E.D. services..."
echo "=========================================================="

# Determine project root directory
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "1. Rebuilding and starting containerized services in detached mode..."
docker compose up --build -d

echo "2. Cleaning up unused dangling Docker images/caches..."
docker image prune -f

echo "=========================================================="
echo " Deployment completed successfully. All services nominal!"
echo "=========================================================="
