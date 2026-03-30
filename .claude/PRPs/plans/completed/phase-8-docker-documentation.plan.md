# Feature: Phase 8 — Docker & Documentation

## Summary

Modernize the Docker setup (multi-stage Node 22 Alpine build replacing the Python 2.7 + NVM base), update docker-compose.yml, create comprehensive README with Docker and local setup instructions, and update .env.example with complete documentation.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Dockerfile, docker-compose.yml, README.md, .env.example |
| Dependencies | node:22-alpine Docker image |
| Estimated Tasks | 5 |

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `Dockerfile` | UPDATE | Replace python:2.7+NVM with multi-stage node:22-alpine |
| `docker-compose.yml` | UPDATE | Use local build instead of faxwang/talkbot image, add .env support |
| `README.md` | CREATE | Comprehensive setup guide for Docker and local install |
| `.env.example` | UPDATE | Add comments for every variable, group by section |
| `ecosystem.config.js` | UPDATE | Point to dist/src/index.js instead of bot.js |

---

## Step-by-Step Tasks

### Task 1: UPDATE `Dockerfile`

Replace the current `FROM python:2.7` / NVM / Node 18 setup with a modern multi-stage build:

**Stage 1 — Dependencies:**
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
```

**Stage 2 — Build TypeScript:**
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```

**Stage 3 — Production:**
```dockerfile
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY config/default.textrules.json config/lang.json ./config/
USER node
CMD ["node", "dist/src/index.js"]
```

- **GOTCHA**: `config/auth.json` must NOT be baked into the image — it's mounted via docker-compose volume or .env
- **GOTCHA**: `patches/` directory needed for `postinstall: patch-package` — COPY it in deps stage
- **GOTCHA**: `src/lang.json` compiled to `dist/src/lang.json` — config files in `config/` need to be copied separately since they're outside `src/`

### Task 2: UPDATE `docker-compose.yml`

Replace `faxwang/talkbot:latest` with local build:
```yaml
version: '3.8'
services:
  talkbot:
    build: .
    env_file: .env
    volumes:
      - ./config:/app/config
    restart: unless-stopped
```

- Remove the old `expose: 80, 443` (not a web server)
- Remove `entrypoint: command.sh` (replaced by Dockerfile CMD)
- Add `restart: unless-stopped` for auto-restart

### Task 3: CREATE `README.md`

Comprehensive README covering:
1. **What is TalkBot** — brief description
2. **Prerequisites** — Node.js 22+, Discord bot token, at least one TTS provider API key
3. **Quick Start (Docker)** — `cp .env.example .env`, edit .env, `docker compose up -d`
4. **Quick Start (Local)** — `npm install`, `npm run build`, `npm start`
5. **Configuration** — .env variables explained, config/auth.json for non-secret settings
6. **TTS Providers** — how to enable each (Google, Amazon, Azure, Watson, Tencent, Alibaba)
7. **Discord Setup** — create bot, get token, enable intents (MessageContent, GuildVoiceStates), invite to server
8. **Slash Commands** — `npm run deploy:commands` to register
9. **Development** — `npm run dev`, `npm test`, project structure
10. **Troubleshooting** — common issues and solutions

### Task 4: UPDATE `.env.example`

Already exists but enhance with:
- Group headers with clear sections
- Comments explaining each variable
- Which are required vs optional
- Default values noted
- Links to where to get API keys

### Task 5: UPDATE `ecosystem.config.js`

Update PM2 config to point to the compiled TypeScript output:
- Change `script: './bot.js'` to `script: './dist/src/index.js'`
- Remove `--experimental-wasm-threads` node arg (may no longer be needed with Node 22)
- Update GOOGLE_APPLICATION_CREDENTIALS paths

---

## Validation Commands

```bash
# Docker build
docker build -t talkbot:test .

# Type check + tests + build
npm test && npm run build

# Verify dist structure
ls dist/src/index.js
```

---

## Acceptance Criteria

- [ ] `docker build .` succeeds with node:22-alpine
- [ ] `docker compose up` starts the bot (with valid .env)
- [ ] README covers Docker and local setup clearly
- [ ] .env.example is fully documented
- [ ] `npm run build && npm start` works locally
- [ ] ecosystem.config.js points to dist/src/index.js
