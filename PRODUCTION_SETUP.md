# RoundBuy Backend — Production Deployment (CloudPanel VPS)

Server: `72.61.147.51` (Hostinger, CloudPanel)
Site: `api.roundbuy.com` — Node.js site, user `roundbuy-api`
Path: `/home/roundbuy-api/htdocs/api.roundbuy.com`
Database: MySQL `roundbuy` / user `roundbuy` (CloudPanel-managed, local to the VPS)
Process manager: PM2, app name `roundbuy-backend`

## One-time setup (done once per server)

1. **SSH key auth** — a dedicated deploy key is generated locally at
   `~/.ssh/roundbuy_deploy_ed25519`. Its public key was added to
   `roundbuy-api`'s `~/.ssh/authorized_keys` on the server so deploys never
   need a password.

2. **CloudPanel Node.js site settings** (set once in the CloudPanel UI):
   - App port: `5001` (must match `PORT` in `.env` — see below)
   - Node.js version: 20.x (matches local dev)
   - Startup file: not used directly — the app is run and supervised by
     **PM2** instead of CloudPanel's built-in Node process manager, so PM2's
     restart/`pm2 save`/reboot-persistence is what keeps it alive.

3. **Nginx `/backend` prefix compatibility** — the mobile app and web app are
   already built to call `https://api.roundbuy.com/backend/api/v1/...`
   (see `mobile-app/src/config/api.config.js` and `CLAUDE.md`), but the
   Express app itself only mounts routes at `/api/v1/...` (no `/backend`
   prefix - see `src/app.js`). CloudPanel's default Node.js vhost only
   proxies `/` to the app, so a custom location block was added via
   CloudPanel's **Vhost** editor for this site:

   ```nginx
   location /backend/ {
       proxy_pass http://127.0.0.1:5001/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   This means both `https://api.roundbuy.com/api/v1/...` (CloudPanel's
   default root proxy) and `https://api.roundbuy.com/backend/api/v1/...`
   (existing app builds) reach the same Node process.

4. **`.env`** on the server (`/home/roundbuy-api/htdocs/api.roundbuy.com/.env`,
   `chmod 600`, never committed to git):
   - Same values as local dev **except**: `NODE_ENV=production`,
     production DB credentials, freshly-generated `JWT_SECRET` /
     `JWT_REFRESH_SECRET` (the local `.env` still has the placeholder
     `your-super-secret-jwt-key-change-this-in-production` — that must
     never be used in production), `APP_URL=https://api.roundbuy.com`,
     and `CORS_ORIGIN` set to the production frontend domains.
   - **Action needed from you:** confirm the real production domains for
     web-app and admin-panel so `CORS_ORIGIN` is accurate (currently set to
     `https://roundbuy.com,https://www.roundbuy.com,https://admin.roundbuy.com,https://api.roundbuy.com`
     as a placeholder guess).

5. **Database bootstrap** (first deploy only) — a full `mysqldump` of the
   local `roundbuy_db` (117 tables, schema + data) was imported into the
   VPS's `roundbuy` database, so production starts with full parity to
   local, per your instruction. **Every deploy after this one only runs
   `database/run-pending-migrations.js`** (schema-only, additive) — it does
   **not** re-import or overwrite data.

6. **`uploads/`** — actual uploaded files aren't in git (`.gitignore` only
   keeps `uploads/.gitkeep`), so the local `uploads/` folder (~40MB) was
   copied to the server once via `rsync` to keep existing image references
   working. New uploads after go-live happen directly on the server.

## Ongoing deploys

From your machine, in `backend/`:

```bash
./deploy.sh
```

This will refuse to run if you have uncommitted changes, push your current
branch to GitHub, then SSH to the server to pull, `npm install`, run any new
pending migrations, and restart PM2 — then does a health check against
`https://api.roundbuy.com/health`.

Currently deploys whatever branch you're on (`git rev-parse --abbrev-ref
HEAD`), which today is `feat/slc-mobile-app`. Once you settle on `main` as
the production branch, either merge into `main` and hardcode `BRANCH="main"`
in `deploy.sh`, or keep working this way if you intend to ship straight from
the feature branch for now.

## Known pre-existing issues (not introduced by this setup, carried over from local)

- `APPLE_PRIVATE_KEY_PATH` points to `./config/apple-private-key.p8`, but the
  file actually committed is `config/apple_auth_key.p8` — this mismatch
  already exists locally, so Apple server-side key verification is
  presumably already inactive in dev. Flagging in case it matters for
  go-live; not changed here since I don't know which is the intended name.
- `config/apple_auth_key.p8` (an Apple private key) is committed to the
  `backend` git repo. Consider whether that repo should really hold it, or
  if it should move to a secrets-only path that's git-ignored.
- Local `ADMIN_PASSWORD=Admin@123` carried over as-is since production DB is
  a full copy of local (same admin account/password). Worth rotating once
  live.
- `PADDLE_ENVIRONMENT=sandbox` even though `PADDLE_API_KEY`/`PADDLE_CLIENT_TOKEN`
  look like **live** Paddle keys (`pdl_live_apikey_...`). Left as-is since
  switching this affects real payments — confirm intentionally before
  flipping to `production`.
