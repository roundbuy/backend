#!/bin/bash

# =============================================================
# RoundBuy Backend - Live Deployment Script
# Server:  72.61.147.51 (Hostinger VPS, CloudPanel)
# Site:    api.roundbuy.com
# Path:    /home/roundbuy-api/htdocs/api.roundbuy.com
# User:    roundbuy-api
#
# Usage (run from backend/, on your local machine):
#   ./deploy.sh
#
# What it does:
#   1. Refuses to run if you have uncommitted local changes
#   2. Pushes your current branch to GitHub
#   3. SSHes into the server and:
#      - pulls the same branch
#      - installs dependencies
#      - runs any pending SQL migrations (backend/migrations/*.sql)
#      - restarts the app with PM2
#
# Requires: SSH key auth already set up for roundbuy-api@72.61.147.51
# (see backend/PRODUCTION_SETUP.md for the one-time bootstrap steps)
# =============================================================

set -e
set -o pipefail

# ─── Config ───────────────────────────────────────────────────
REMOTE_HOST="72.61.147.51"
REMOTE_USER="roundbuy-api"
REMOTE_PATH="/home/roundbuy-api/htdocs/api.roundbuy.com"
SSH_KEY="$HOME/.ssh/roundbuy_deploy_ed25519"
PM2_APP_NAME="roundbuy-backend"
HEALTH_URL="https://api.roundbuy.com/health"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_OPTS=(-i "$SSH_KEY" -o ConnectTimeout=15)

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  RoundBuy Backend - Live Deployment        ${NC}"
echo -e "${BLUE}  Branch: ${BRANCH}${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# ─── Step 1: Refuse to deploy dirty working tree ────────────
echo -e "${YELLOW}[1/5] Checking working tree is clean...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}✗ You have uncommitted changes. Commit or stash them first:${NC}"
  git status --short
  exit 1
fi
echo -e "${GREEN}✓ Working tree clean${NC}"

# ─── Step 2: Push current branch to GitHub ──────────────────
echo -e "${YELLOW}[2/5] Pushing '${BRANCH}' to GitHub...${NC}"
git push origin "$BRANCH"
echo -e "${GREEN}✓ Pushed${NC}"

# ─── Step 3-5: Remote deploy over SSH ────────────────────────
echo -e "${YELLOW}[3/5] Deploying on server (${REMOTE_HOST})...${NC}"
ssh "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- "$BRANCH" "$REMOTE_PATH" "$PM2_APP_NAME" <<'REMOTE_SCRIPT'
set -e
BRANCH="$1"
REMOTE_PATH="$2"
PM2_APP_NAME="$3"

cd "$REMOTE_PATH"

echo "  → Fetching origin/$BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "  → Installing dependencies..."
npm install --omit=dev

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
echo -e "${YELLOW}[4/5] Waiting for the app to come back up...${NC}"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ $HEALTH_URL responded 200 OK${NC}"
else
  echo -e "${RED}✗ $HEALTH_URL responded with HTTP $HTTP_CODE - check 'pm2 logs $PM2_APP_NAME' on the server${NC}"
fi

echo -e "${YELLOW}[5/5] Done.${NC}"
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  ✅ Backend Deployed Successfully!          ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "  ${BLUE}Branch:${NC} $BRANCH"
echo -e "  ${BLUE}Path:${NC}   $REMOTE_PATH"
echo -e "  ${BLUE}PM2:${NC}    $PM2_APP_NAME"
echo -e "  ${BLUE}Time:${NC}   $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
