#!/bin/bash

# =============================================================
# RoundBuy Backend - Live Deployment Script
# Server:  72.61.147.51 (Hostinger VPS, CloudPanel)
# Site:    api.roundbuy.com
# Path:    /home/roundbuy-api/htdocs/api.roundbuy.com
# User:    roundbuy-api
#
# Usage (run from backend/, in your own terminal so password
# prompts work):
#   ./deploy.sh
#
# What it does:
#   1. rsyncs your local backend/ source straight to the server
#      (no git/GitHub involved - whatever's on disk locally ships,
#      excluding node_modules, .env, uploads/, and this script's
#      own staging files)
#   2. npm install on the server
#   3. runs any pending SQL migrations (backend/migrations/*.sql)
#   4. restarts the app with PM2
#   5. health-checks https://api.roundbuy.com/health
#
# First time only: run ./bootstrap-production.sh instead, which
# sets up .env, uploads/, the database, and PM2, then calls this.
# =============================================================

set -euo pipefail

REMOTE_HOST="72.61.147.51"
REMOTE_USER="roundbuy-api"
REMOTE_PATH="/home/roundbuy-api/htdocs/api.roundbuy.com"
PM2_APP_NAME="roundbuy-backend"
HEALTH_URL="https://api.roundbuy.com/health"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  RoundBuy Backend - Live Deployment        ${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# ─── Step 1: Sync source code ────────────────────────────────
echo -e "${YELLOW}[1/4] Syncing source code to server...${NC}"
rsync -az --delete \
  --exclude 'node_modules/' \
  --exclude '.env' \
  --exclude '.env.production' \
  --exclude '.deploy-tmp/' \
  --exclude 'uploads/' \
  --exclude '.git/' \
  --exclude 'tests/' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
echo -e "${GREEN}✓ Code synced${NC}"

# ─── Step 2-4: Install, migrate, restart (remote) ────────────
echo -e "${YELLOW}[2/4] Installing dependencies, migrating, restarting...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- "$REMOTE_PATH" "$PM2_APP_NAME" <<'REMOTE_SCRIPT'
set -e
REMOTE_PATH="$1"
PM2_APP_NAME="$2"

cd "$REMOTE_PATH"

# npm/node aren't on PATH in this non-interactive shell (NVM's rc-file
# hook isn't wired up here) - load them directly instead.
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -d "$NVM_DIR/versions/node" ]; then
  NODE_BIN_DIR=$(ls -d "$NVM_DIR"/versions/node/*/bin 2>/dev/null | tail -1)
  export PATH="$NODE_BIN_DIR:$PATH"
fi
echo "  → using node $(command -v node) ($(node -v))"

echo "  → npm install..."
npm install --omit=dev

echo "  → Ensuring PM2 is available..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "  → Running pending migrations..."
if [ -f "database/run-pending-migrations.js" ]; then
  node database/run-pending-migrations.js
else
  echo "  ⚠ No migration runner found, skipping."
fi

echo "  → Restarting PM2 process '$PM2_APP_NAME'..."
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start server.js --name "$PM2_APP_NAME" --env production
fi
pm2 save
pm2 status
REMOTE_SCRIPT
echo -e "${GREEN}✓ Server updated and restarted${NC}"

# ─── Health check ─────────────────────────────────────────────
echo -e "${YELLOW}[3/4] Waiting for the app to come back up...${NC}"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ $HEALTH_URL responded 200 OK${NC}"
else
  echo -e "${RED}✗ $HEALTH_URL responded with HTTP $HTTP_CODE - check 'pm2 logs $PM2_APP_NAME' on the server${NC}"
fi

echo -e "${YELLOW}[4/4] Done.${NC}"
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  ✅ Backend Deployed Successfully!          ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "  ${BLUE}Path:${NC} $REMOTE_PATH"
echo -e "  ${BLUE}PM2:${NC}  $PM2_APP_NAME"
echo -e "  ${BLUE}Time:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
