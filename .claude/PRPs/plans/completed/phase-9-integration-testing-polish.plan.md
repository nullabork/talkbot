# Feature: Phase 9 — Integration Testing & Polish

## Summary

Final cleanup phase: verify the compiled `dist/` output works end-to-end (module resolution, no missing imports), run a final DRY pass across the codebase, remove legacy files (`bot.js`, `module-alias` dependency, `_moduleAliases` config, `jsconfig.json` remnant, `command.sh`), clean up `package.json`, ensure `npm run build && node dist/src/index.js` starts without import errors, and verify all 263+ tests pass with the final clean state.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | LOW |
| Systems Affected | root files, package.json, dist/ output |
| Estimated Tasks | 7 |

---

## Step-by-Step Tasks

### Task 1: Verify `dist/` output has no broken imports

- **ACTION**: Build and check for unrewritten aliases or missing modules
- **IMPLEMENT**:
  ```bash
  rm -rf dist/ && npm run build
  grep -r "require('@" dist/ | grep -v "require('@discordjs" | grep -v "require('@google-cloud" | grep -v "require('@ffmpeg" | grep -v "require('@snazzah"
  ```
  Any matches = unrewritten path aliases that need fixing.
- **VALIDATE**: Zero custom `@`-alias requires remain in `dist/`

### Task 2: Verify `node dist/src/index.js` starts without import errors

- **ACTION**: Run the compiled entry point with a test .env to verify module resolution
- **IMPLEMENT**: Run `node dist/src/index.js` — it should get past all `require()` calls and fail only at Discord login (no real token). Must NOT fail on `Cannot find module` or `MODULE_NOT_FOUND`.
- **GOTCHA**: Needs `.env` with DISCORD_TOKEN and CLIENT_ID set (can be dummy values)
- **VALIDATE**: Process starts, prints "TalkBot starting in..." or fails at API connection (not module resolution)

### Task 3: Remove legacy files

- **ACTION**: Delete files no longer needed
- **FILES TO DELETE**:
  - `bot.js` — replaced by `src/index.ts` → `dist/src/index.js`
  - `command.sh` — was Docker entrypoint for old setup
  - `jsconfig.json` — should already be deleted (Phase 1), verify
- **GOTCHA**: `bin/ffmpeg-test.js` and `bin/create-samples.js` use `module-alias/register` — update them to use the compiled dist/ paths or keep module-alias as a dev dependency for bin scripts only
- **VALIDATE**: Files deleted, `npm run build && npm test` still pass

### Task 4: Clean up `package.json`

- **ACTION**: Remove obsolete entries
- **IMPLEMENT**:
  - Remove `"main": "dist/src/index.js"` if unnecessary (it's a bot, not a library)
  - Remove or move `module-alias` to devDependencies (only used by bin/ scripts now)
  - Remove `_moduleAliases` section — TypeScript path aliases handle everything
  - Remove `start:legacy` script
  - Verify `engines: { node: ">=22.12.0" }` is present
  - Verify all scripts are correct: build, start, dev, test, deploy:commands, etc.
- **VALIDATE**: `npm install && npm run build && npm test`

### Task 5: Final DRY pass

- **ACTION**: Use a code review agent to identify remaining duplication or cleanup opportunities
- **IMPLEMENT**: Quick scan for:
  - Any remaining `/*jshint esversion: 9 */` comments in .ts files
  - Unused imports
  - `any` types that could be tightened
  - Duplicate code patterns across command modules
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: Final linting pass

- **ACTION**: Run type-check and fix any warnings
- **IMPLEMENT**: `npx tsc --noEmit` — must be zero errors
- **VALIDATE**: Exit 0

### Task 7: Final comprehensive validation

- **ACTION**: Run the full validation suite
- **IMPLEMENT**:
  ```bash
  npx tsc --noEmit    # type check
  npm test             # all tests pass
  npm run build        # build succeeds
  # Verify no .js files in src/
  find src/ -name "*.js" | head -5
  # Verify dist/ output
  ls dist/src/index.js dist/src/env.js
  ```
- **VALIDATE**: Everything passes, zero errors

---

## Validation Commands

```bash
npx tsc --noEmit
npm test
npm run build
find src/ -name "*.js" -not -path "*/node_modules/*"
```

---

## Acceptance Criteria

- [ ] `npm run build` succeeds with zero errors
- [ ] All 263+ tests pass
- [ ] Zero `.js` files in `src/`
- [ ] Zero unrewritten `@`-aliases in `dist/`
- [ ] `node dist/src/index.js` starts without module resolution errors
- [ ] Legacy `bot.js` removed
- [ ] `package.json` cleaned up (no `_moduleAliases`, clean scripts)
- [ ] No `/*jshint` comments remaining in `.ts` files
