#!/bin/bash
# A.L.F.R.E.D. -- CI/CD Git Polling Deployment Daemon
# Usage: nohup ./deploy-daemon.sh > daemon.log 2>&1 &

INTERVAL=15
echo "Starting A.L.F.R.E.D. CD Polling Daemon (polling every ${INTERVAL}s)..."

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Ensure the deploy-vps.sh script is executable
chmod +x ./deploy-vps.sh

while true; do
    # Fetch latest remote state
    git fetch origin main &>/dev/null || {
        echo "$(date): git fetch failed, retrying in ${INTERVAL}s..."
        sleep $INTERVAL
        continue
    }

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "=========================================================="
        echo "$(date): New commit detected on remote! Pulling changes..."
        echo "=========================================================="
        
        # Reset local changes if any, and pull
        git reset --hard origin/main
        git pull origin main
        
        echo "Triggering VPS deployment script..."
        ./deploy-vps.sh
    fi

    sleep $INTERVAL
done
