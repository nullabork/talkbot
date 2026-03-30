# Feature: Phase 1 — Project Scaffolding

## Summary

Establish the TypeScript build infrastructure for TalkBot so that all subsequent migration phases work in TypeScript. This includes: `tsconfig.json` with path aliases replacing `module-alias`, build scripts (`tsc` + `tsc-alias`), Zod-validated `.env` for secrets, updated `package.json` with proper `engines`/`scripts`/devDependencies, and updated `.gitignore`. The bot will not yet function after this phase — the goal is a compilable empty `src/index.ts` entry point with working path aliases, env loading, and build pipeline.

## User Story

As a developer working on TalkBot
I want a TypeScript build pipeline with path aliases, env validation, and proper scripts
So that all subsequent migration work is done in TypeScript with type safety from the start

## Problem Statement

The project has zero build infrastructure — it runs raw JavaScript via `node bot.js` with runtime `module-alias` path resolution, secrets hardcoded in `config/auth.json`, no `start`/`build`/`test`/`dev` scripts, and no declared Node.js version requirement. This must be replaced with a proper TypeScript pipeline before any code can be converted.

## Solution Statement

Add `tsconfig.json` (CommonJS module, ES2023 target) with `paths` mirroring existing `_moduleAliases`. Use `tsc` + `tsc-alias` for production builds (compile then rewrite aliases). Use `dotenv` + Zod v4 for env validation. Add all necessary npm scripts. Keep `config/auth.json` as a fallback config source (non-secret settings) while moving secrets to `.env`.

## Metadata

| Field            | Value |
| ---------------- | ----- |
| Type             | REFACTOR |
| Complexity       | MEDIUM |
| Systems Affected | build pipeline, config loading, package.json, .gitignore |
| Dependencies     | typescript ^5.x, tsc-alias ^1.x, zod ^4.x, dotenv ^16.x, vitest ^3.x, @types/node ^22.x |
| Estimated Tasks  | 9 |

---

## UX Design

### Before State

```
╔════════════════════════════════════════════════════════════════════════╗
║                           BEFORE STATE                               ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   Developer clones repo                                              ║
║       │                                                              ║
║       ▼                                                              ║
║   npm install                                                        ║
║       │                                                              ║
║       ▼                                                              ║
║   Manually create config/auth.json from example                      ║
║   (edit JSON, paste Discord token, TTS API keys)                     ║
║       │                                                              ║
║       ▼                                                              ║
║   node bot.js  (or PM2 via ecosystem.config.js)                      ║
║       │                                                              ║
║       ▼                                                              ║
║   module-alias/register hooks into require()                         ║
║   @auth → config/auth.json loaded as JSON module                     ║
║                                                                      ║
║   PAIN: No types, no build step, secrets in JSON, no npm scripts,    ║
║         no declared Node version, jshint only linting                ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔════════════════════════════════════════════════════════════════════════╗
║                            AFTER STATE                               ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   Developer clones repo                                              ║
║       │                                                              ║
║       ▼                                                              ║
║   cp .env.example .env  (fill in secrets)                            ║
║       │                                                              ║
║       ▼                                                              ║
║   npm install                                                        ║
║       │  (postinstall: patch-package)                                ║
║       ▼                                                              ║
║   npm run build                                                      ║
║       │  tsc → dist/    then    tsc-alias rewrites @paths            ║
║       ▼                                                              ║
║   npm start                                                          ║
║       │  node dist/index.js                                          ║
║       ▼                                                              ║
║   src/env.ts validates .env with Zod at startup                      ║
║   Path aliases resolved via tsc-alias rewritten imports              ║
║                                                                      ║
║   VALUE: TypeScript types, Zod env validation, proper scripts,       ║
║          Node 22 declared, secrets in .env not JSON                  ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Setup | Edit `config/auth.json` manually | `cp .env.example .env` and fill values | Simpler, familiar pattern |
| Build | None — run JS directly | `npm run build` compiles TS | Required step, but enables type safety |
| Start | `node bot.js` or PM2 | `npm start` → `node dist/index.js` | Standard npm convention |
| Dev | `nodemon bot.js` | `npm run dev` with ts-node | Live reload with types |
| Errors | Runtime crashes on missing config | Zod prints clear missing-var errors at startup | Fail-fast with helpful messages |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `/workspace/package.json` | all | Current deps, scripts, _moduleAliases to replace |
| P0 | `/workspace/bot.js` | 1-40 | Entry point bootstrap — understand module-alias registration order |
| P0 | `/workspace/jsconfig.json` | all | Current path aliases for IDE — will be replaced by tsconfig |
| P1 | `/workspace/src/paths.js` | all | Path resolver — must understand to replicate in TS |
| P1 | `/workspace/config/auth.example.json` | all | Full config shape — determines which fields move to .env |
| P1 | `/workspace/ecosystem.config.js` | all | PM2 config — must understand GOOGLE_APPLICATION_CREDENTIALS patterns |
| P2 | `/workspace/.gitignore` | all | Must add dist/, .env |
| P2 | `/workspace/.prettierrc` | all | Formatting config — ensure TS files follow same rules |
| P2 | `/workspace/Dockerfile` | all | Current Docker setup — will be updated in Phase 8 but must not break |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [tsc-alias npm docs](https://www.npmjs.com/package/tsc-alias) | Usage with tsconfig paths | Ensure path rewriting works for JSON file aliases |
| [Zod v4 docs](https://zod.dev/v4) | Schema definition, safeParse | Env validation pattern |
| [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig) | resolveJsonModule, paths, baseUrl | JSON import + alias config |

---

## Patterns to Mirror

**MODULE ALIAS MAP** (from `package.json:41-52` `_moduleAliases` — must be replicated exactly in tsconfig `paths`):

```json
// SOURCE: /workspace/package.json:41-52
// REPLICATE THIS MAPPING:
{
    "@config": "config",
    "@state":  "config/state.json",
    "@auth":   "config/auth.json",
    "@paths":  "src/paths",
    "@src":    "src",
    "@helpers":  "src/helpers",
    "@commands": "src/commands",
    "@models":   "src/models",
    "@services": "src/services",
    "@tts":      "src/services/tts"
}
```

**ENTRY POINT BOOTSTRAP ORDER** (from `bot.js:15-30` — env loading must happen before any alias imports):

```javascript
// SOURCE: /workspace/bot.js:13-30
// In the new src/index.ts, env validation MUST be the first import:
(async () => {
    require('module-alias/register');       // → replaced by tsc-alias at compile time
    const commands = require('@commands'),   // → these use aliases
        botStuff = require('@helpers/bot-stuff'),
        Common = require('@helpers/common'),
        testing = require('@helpers/runtime-testing');
    const world = require('@models/World');
    await testing.TestIfTTSAPIServicesAreConfigured();
})();
```

**AUTH CONFIG SHAPE** (from `config/auth.example.json` — determines .env fields):

```json
// SOURCE: /workspace/config/auth.example.json
// These fields contain SECRETS that must move to .env:
{
    "token": "yourdiscord.tokenhere",           // → DISCORD_TOKEN
    "tts": {
        "amazon": {
            "accessKeyId": "",                  // → AWS_ACCESS_KEY_ID
            "secretAccessKey": ""               // → AWS_SECRET_ACCESS_KEY
        },
        "azure": {
            "subscriptionKey": ""               // → AZURE_SUBSCRIPTION_KEY
        },
        "watson": {
            "apikey": ""                        // → WATSON_API_KEY
        },
        "tencent": {
            "accessKeyId": "",                  // → TENCENT_ACCESS_KEY_ID
            "secretAccessKey": ""               // → TENCENT_SECRET_ACCESS_KEY
        },
        "alibaba": {
            "appkey": "",                       // → ALIBABA_APP_KEY
            "token": ""                         // → ALIBABA_TOKEN
        }
    }
}
// Non-secret fields (command_char, neglect_timeout, logging, etc.) stay in config/
```

**PRETTIER CONFIG** (from `.prettierrc` — TS files must follow same formatting):

```json
// SOURCE: /workspace/.prettierrc
{
    "printWidth": 110,
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all"
}
```

---

## Files to Change

| File | Action | Justification |
| ---- | ------ | ------------- |
| `/workspace/tsconfig.json` | CREATE | TypeScript compiler configuration with path aliases |
| `/workspace/src/env.ts` | CREATE | Zod-validated environment variable loading |
| `/workspace/src/index.ts` | CREATE | Minimal TS entry point (placeholder for Phase 6) |
| `/workspace/.env.example` | CREATE | Template for all environment variables with comments |
| `/workspace/package.json` | UPDATE | Add engines, scripts, devDependencies, remove module-alias from deps |
| `/workspace/.gitignore` | UPDATE | Add dist/, .env, *.tsbuildinfo |
| `/workspace/jsconfig.json` | DELETE | Replaced by tsconfig.json |
| `/workspace/.prettierrc` | UPDATE | Add TypeScript parser config if needed |
| `/workspace/vitest.config.ts` | CREATE | Vitest configuration for test suite (Phase 7 will use this) |

---

## NOT Building (Scope Limits)

- **NOT converting any existing `.js` files** — this phase only creates the build scaffold; actual JS→TS conversion happens in Phases 2-6
- **NOT updating Docker** — Dockerfile changes happen in Phase 8; current Dockerfile still works with the old `bot.js`
- **NOT removing `module-alias` from runtime yet** — the old `bot.js` entry point still needs it until Phase 6 replaces it
- **NOT adding tests yet** — Vitest config is created but test files come in Phase 7
- **NOT changing the command system** — slash command migration is Phase 5

---

## Step-by-Step Tasks

### Task 1: CREATE `tsconfig.json`

- **ACTION**: Create TypeScript compiler configuration at project root
- **IMPLEMENT**: CommonJS module system, ES2023 target, strict mode, path aliases matching all 10 `_moduleAliases` entries, `resolveJsonModule` for JSON imports, `sourceMap` for debugging
- **PATH ALIAS MAPPING** (must match `_moduleAliases` exactly):

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@config/*": ["config/*"],
      "@state":    ["config/state.json"],
      "@auth":     ["config/auth.json"],
      "@paths":    ["src/paths"],
      "@src/*":    ["src/*"],
      "@helpers/*":  ["src/helpers/*"],
      "@commands":   ["src/commands/index"],
      "@commands/*": ["src/commands/*"],
      "@models/*":   ["src/models/*"],
      "@services/*": ["src/services/*"],
      "@tts/*":      ["src/services/tts/*"]
    },
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": true,
    "allowJs": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- **GOTCHA**: `rootDir` must be `"."` not `"./src"` because `@auth` and `@config/*` resolve to `config/` which is outside `src/`. If `rootDir` is `"./src"`, tsc will error when `resolveJsonModule` tries to include `config/auth.json`.
- **GOTCHA**: `@commands` needs BOTH a bare alias (`["src/commands/index"]` for `require('@commands')`) AND a wildcard (`["src/commands/*"]` for `require('@commands/modules/...')`).
- **GOTCHA**: `allowJs: true` is needed during migration so `.ts` and `.js` files can coexist.
- **VALIDATE**: `npx tsc --noEmit` should succeed (once `src/index.ts` exists)

### Task 2: UPDATE `package.json`

- **ACTION**: Add engines, scripts, new devDependencies
- **IMPLEMENT**:

**Add `engines`:**
```json
"engines": {
  "node": ">=22.12.0"
}
```

**Replace `scripts` with:**
```json
"scripts": {
  "build": "tsc && tsc-alias",
  "start": "node dist/src/index.js",
  "start:legacy": "node bot.js",
  "dev": "nodemon --watch src --ext ts --exec \"node -r dotenv/config -r tsconfig-paths/register -r ts-node/register src/index.ts\"",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "tsc --noEmit",
  "samples": "node bin/create-samples.js",
  "postinstall": "patch-package"
}
```

**Add to `devDependencies`:**
```json
{
  "typescript": "^5.7.0",
  "tsc-alias": "^1.8.0",
  "tsconfig-paths": "^4.2.0",
  "ts-node": "^10.9.0",
  "@types/node": "^22.0.0",
  "vitest": "^3.0.0",
  "dotenv": "^16.4.0",
  "zod": "^4.0.0"
}
```

- **GOTCHA**: Keep `module-alias` in `dependencies` for now — `bot.js` (legacy entry) still uses it. It will be removed in Phase 6.
- **GOTCHA**: `start` path is `dist/src/index.js` not `dist/index.js` because `rootDir` is `.` (not `./src`), so tsc outputs to `dist/src/`.
- **GOTCHA**: Keep `"postinstall": "patch-package"` — the `@ffmpeg/core` patch in `/workspace/patches/` must still apply.
- **MIRROR**: Preserve existing `"samples"` script.
- **VALIDATE**: `npm install` succeeds; `npx tsc --version` outputs 5.x

### Task 3: CREATE `.env.example`

- **ACTION**: Create environment variable template with ALL secret fields from `config/auth.example.json` plus operational env vars
- **IMPLEMENT**:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id

# Google TTS (also requires GOOGLE_APPLICATION_CREDENTIALS pointing to service account JSON)
GOOGLE_APPLICATION_CREDENTIALS=./config/google-auth.json

# Amazon Polly TTS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Azure Cognitive Services TTS
AZURE_SUBSCRIPTION_KEY=
AZURE_ENDPOINT=https://eastus.tts.speech.microsoft.com/

# IBM Watson TTS
WATSON_API_KEY=
WATSON_SERVICE_URL=

# Tencent Cloud TTS
TENCENT_ACCESS_KEY_ID=
TENCENT_SECRET_ACCESS_KEY=

# Alibaba Cloud TTS
ALIBABA_APP_KEY=
ALIBABA_TOKEN=
ALIBABA_ENDPOINT=

# Application Settings
NODE_ENV=development
LOG_LEVEL=info
```

- **GOTCHA**: `GOOGLE_APPLICATION_CREDENTIALS` is already used as an env var by the Google SDK and PM2 config — keep this convention.
- **GOTCHA**: Do NOT move non-secret config like `command_char`, `neglect_timeout`, `dev_ids` etc to .env — those stay in `config/auth.json` for now.
- **VALIDATE**: File exists and is well-commented

### Task 4: CREATE `src/env.ts`

- **ACTION**: Create Zod-validated environment variable loader
- **IMPLEMENT**:

```typescript
import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment variable schema.
 * Validates and types all env vars at startup.
 * Secrets that were previously in config/auth.json are now loaded from .env.
 */
const envSchema = z.object({
    // Discord
    DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
    CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),

    // Google TTS
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

    // Amazon Polly TTS
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),

    // Azure Cognitive Services TTS
    AZURE_SUBSCRIPTION_KEY: z.string().optional(),
    AZURE_ENDPOINT: z.string().optional(),

    // IBM Watson TTS
    WATSON_API_KEY: z.string().optional(),
    WATSON_SERVICE_URL: z.string().optional(),

    // Tencent Cloud TTS
    TENCENT_ACCESS_KEY_ID: z.string().optional(),
    TENCENT_SECRET_ACCESS_KEY: z.string().optional(),

    // Alibaba Cloud TTS
    ALIBABA_APP_KEY: z.string().optional(),
    ALIBABA_TOKEN: z.string().optional(),
    ALIBABA_ENDPOINT: z.string().optional(),

    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    process.exit(1);
}

export const env = result.data;
export type Env = z.infer<typeof envSchema>;
```

- **GOTCHA**: TTS provider keys are `optional()` — not every installation uses every provider. Only `DISCORD_TOKEN` and `CLIENT_ID` are required.
- **GOTCHA**: `import 'dotenv/config'` must be the FIRST import in this file — it populates `process.env` before Zod reads it.
- **VALIDATE**: `npx tsc --noEmit` — file compiles with no errors

### Task 5: CREATE `src/index.ts`

- **ACTION**: Create minimal TypeScript entry point placeholder
- **IMPLEMENT**:

```typescript
/**
 * TalkBot — Discord Text-to-Speech Bot
 *
 * This is the TypeScript entry point. It replaces bot.js.
 * Full implementation will be wired in Phase 6.
 *
 * http://github.com/nullabork/talkbot
 */

// Environment validation must be the absolute first import
import { env } from './env';

console.log(`TalkBot starting in ${env.NODE_ENV} mode...`);
console.log('TypeScript build pipeline is working.');
console.log('Full bot initialization will be added in Phase 6.');
```

- **GOTCHA**: This is intentionally minimal — it only validates that the build pipeline works. Phase 6 will add the real bot initialization.
- **VALIDATE**: `npm run build` succeeds; `node dist/src/index.js` runs and prints the messages (requires `.env` with DISCORD_TOKEN and CLIENT_ID set)

### Task 6: UPDATE `.gitignore`

- **ACTION**: Add TypeScript build artifacts and .env to gitignore
- **IMPLEMENT**: Add these lines:

```
# TypeScript build output
/dist/
*.tsbuildinfo

# Environment variables (secrets)
.env
.env.local
.env.*.local

# Keep .env.example tracked (it has no secrets)
!.env.example
```

- **GOTCHA**: Existing `.gitignore` already ignores `auth.json`, `state.json`, `*.server` files, `node_modules` — don't duplicate those.
- **VALIDATE**: `git status` shows `.gitignore` as modified; `dist/` and `.env` are not tracked

### Task 7: DELETE `jsconfig.json`

- **ACTION**: Remove `jsconfig.json` — it's replaced by `tsconfig.json`
- **IMPLEMENT**: `git rm jsconfig.json`
- **GOTCHA**: VS Code will now use `tsconfig.json` for IntelliSense automatically.
- **VALIDATE**: File no longer exists; `npx tsc --noEmit` still works

### Task 8: CREATE `vitest.config.ts`

- **ACTION**: Create Vitest configuration for the test suite (used in Phase 7)
- **IMPLEMENT**:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/index.ts'],
        },
    },
    resolve: {
        alias: {
            '@helpers': path.resolve(__dirname, 'src/helpers'),
            '@models': path.resolve(__dirname, 'src/models'),
            '@commands': path.resolve(__dirname, 'src/commands'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@tts': path.resolve(__dirname, 'src/services/tts'),
            '@config': path.resolve(__dirname, 'config'),
            '@auth': path.resolve(__dirname, 'config/auth.json'),
            '@paths': path.resolve(__dirname, 'src/paths'),
            '@src': path.resolve(__dirname, 'src'),
        },
    },
});
```

- **GOTCHA**: Vitest needs its own alias resolution — it doesn't use tsconfig paths by default. The `resolve.alias` block must mirror the tsconfig `paths`.
- **VALIDATE**: `npx vitest run` exits cleanly (no tests yet, but config loads without errors)

### Task 9: VERIFY full build pipeline

- **ACTION**: End-to-end verification that the entire pipeline works
- **IMPLEMENT**: Run these commands in sequence:

```bash
# 1. Clean install
rm -rf node_modules && npm install

# 2. Create test .env
cp .env.example .env
# Edit .env: set DISCORD_TOKEN=test_token_placeholder CLIENT_ID=test_client_id

# 3. Build
npm run build

# 4. Verify dist/ output exists
ls dist/src/index.js dist/src/env.js

# 5. Verify tsc-alias rewrote imports (no @-prefixed requires remain in dist/)
grep -r "require('@" dist/ || echo "No unrewritten aliases - GOOD"

# 6. Type check
npm run lint

# 7. Vitest config loads
npx vitest run

# 8. Legacy entry still works
npm run start:legacy  # (will fail without real auth.json, but should get past module loading)
```

- **VALIDATE**: Steps 1-7 all succeed. Step 8 may fail at Discord login (expected — no real token) but must NOT fail at `require('module-alias/register')` or any alias resolution.

---

## Testing Strategy

### Unit Tests to Write (in Phase 7)

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `src/env.test.ts` | Valid env passes, missing DISCORD_TOKEN fails, missing CLIENT_ID fails, optional TTS keys work when absent, defaults applied correctly | Zod env schema |

### Edge Cases Checklist

- [ ] `.env` file missing entirely — should error with clear message
- [ ] `DISCORD_TOKEN` empty string — should fail validation (`.min(1)`)
- [ ] All optional TTS keys absent — should pass (not every provider needed)
- [ ] `NODE_ENV` invalid value — should fail with enum error
- [ ] `NODE_ENV` absent — should default to `'development'`
- [ ] Build output has no `@`-prefixed requires in `dist/` (tsc-alias working)
- [ ] `config/auth.json` still loadable via `require('@auth')` in legacy `bot.js`

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 2: BUILD

```bash
npm run build
```

**EXPECT**: Exit 0, `dist/src/index.js` and `dist/src/env.js` exist

### Level 3: ALIAS_REWRITE

```bash
# Verify no @-prefixed requires remain in compiled output
! grep -r "require(['\"]@" dist/
```

**EXPECT**: No matches found (exit code 1 from grep = success)

### Level 4: VITEST_CONFIG

```bash
npx vitest run 2>&1 | head -5
```

**EXPECT**: Vitest loads config without errors (may report "no tests found" which is fine)

### Level 5: LEGACY_COMPAT

```bash
node -e "require('module-alias/register'); require('@helpers/common'); console.log('Legacy aliases OK')"
```

**EXPECT**: Prints "Legacy aliases OK" — old bot.js path still works

---

## Acceptance Criteria

- [ ] `tsconfig.json` exists with all 10 path aliases matching `_moduleAliases`
- [ ] `npm run build` compiles `src/index.ts` and `src/env.ts` to `dist/`
- [ ] `tsc-alias` rewrites all `@`-prefixed imports in `dist/` to relative paths
- [ ] `.env.example` lists all secret fields with comments
- [ ] `src/env.ts` validates required vars and exits with clear errors on failure
- [ ] `package.json` has `engines: { node: ">=22.12.0" }` and all required scripts
- [ ] `.gitignore` excludes `dist/`, `.env`, `*.tsbuildinfo`
- [ ] `jsconfig.json` is removed
- [ ] `vitest.config.ts` loads without errors
- [ ] Legacy `bot.js` still runs (module-alias not removed yet)
- [ ] No `.js` linting errors from existing files (`allowJs: true` in tsconfig)

---

## Completion Checklist

- [ ] All 9 tasks completed in order
- [ ] Level 1: `npx tsc --noEmit` passes
- [ ] Level 2: `npm run build` succeeds
- [ ] Level 3: No `@`-prefixed requires in `dist/`
- [ ] Level 4: Vitest config loads
- [ ] Level 5: Legacy `bot.js` compatibility preserved
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `tsc-alias` fails to rewrite JSON file alias (`@auth`) | Medium | High | Test this specific alias first; if it fails, use a manual post-build script |
| `rootDir: "."` causes tsc to include unwanted files | Low | Medium | `"include": ["src/**/*"]` limits compilation scope; `"exclude"` blocks node_modules and dist |
| `tsconfig-paths` Node 22.14.0 regression in dev mode | Medium | Low | Only used in `npm run dev`; production uses compiled output with tsc-alias |
| `patch-package` `@ffmpeg/core` patch conflicts with new deps | Low | Medium | Run `npm install` early and verify patch applies cleanly |
| `zod@4` API differences from older tutorials | Low | Low | Research confirmed Zod v4 API; use `safeParse` not `parse`, `flatten()` for errors |

---

## Notes

- `module-alias` is deliberately kept in `dependencies` during this phase. It will be removed in Phase 6 when `bot.js` is replaced by `src/index.ts`.
- The `start:legacy` script preserves the ability to run the old JavaScript bot while migration is in progress.
- `dotenv` is added as a devDependency since production Docker can use `--env-file` or native env injection. However, for simplicity with self-hosters running locally, it's fine as a regular dependency too.
- `allowJs: true` in tsconfig is a migration aid — it lets `.ts` files import `.js` files during the transition. It will be removed after Phase 6.
- The `dist/src/` output path (instead of `dist/`) is a consequence of `rootDir: "."`. This is acceptable and standard for projects that import from outside `src/`.
