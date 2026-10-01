#!/bin/bash

# =============================================================
# RoundBuy Backend - ONE-TIME Production Bootstrap
# Run this ONCE from your own terminal (needs interactive password
# prompts, which only work when you run it directly). After this
# succeeds, use ./deploy.sh for every future deploy.
#
# What it does:
#   1. Shows you what's currently in the server's site directory
#   2. Uploads the prepared production .env
#   3. Uploads the local uploads/ folder (~40MB)
#   4. Uploads and imports a full dump of your local database
#   5. Calls ./deploy.sh, which syncs code, npm installs, ensures PM2
#      is installed, starts the app, and health-checks the /health endpoint
# =============================================================

set -euo pipefail

REMOTE_HOST="72.61.147.51"
REMOTE_USER="roundbuy-api"
REMOTE_PATH="/home/roundbuy-api/htdocs/api.roundbuy.com"

ENV_FILE="$(pwd)/.deploy-tmp/backend.env.production"
DUMP_FILE="$(pwd)/.deploy-tmp/roundbuy_full_dump.sql"

if [ ! -f "$ENV_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Expected files not found in .deploy-tmp/ - run this from backend/"
  exit 1
fi

echo "== Step 1/6: Inspecting remote directory =="
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p '${REMOTE_PATH}' && ls -la '${REMOTE_PATH}'"
echo ""
read -p "Continue and set this directory up as the live backend? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

echo "== Step 2/6: Uploading production .env =="
scp "$ENV_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/.env"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod 600 '${REMOTE_PATH}/.env'"
echo "  ✓ .env uploaded"

echo "== Step 3/6: Uploading uploads/ folder (~40MB) =="
rsync -az --progress uploads/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/uploads/"

echo "== Step 4/6: Uploading and importing database dump =="
scp "$DUMP_FILE" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/roundbuy_full_dump.sql"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "MYSQL_PWD='LpWOl5BVn4Jx7D186fA6' mysql -u roundbuy roundbuy < /tmp/roundbuy_full_dump.sql && rm -f /tmp/roundbuy_full_dump.sql"
echo "  ✓ Database imported"

echo "== Step 5/5: Syncing code, installing deps, ensuring PM2, starting app =="
./deploy.sh

echo ""
echo "Bootstrap complete. From now on, just run ./deploy.sh for future changes."
