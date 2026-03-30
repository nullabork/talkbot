# Feature: Phase 6 — Bot Entry Point & Wiring

## Summary

Convert `bot.js` logic into the real `src/index.ts` entry point. Convert `Server.js` and `World.js` to TypeScript. Wire the `interactionCreate` event for slash commands alongside the existing `messageCreate` for TTS reading. Register slash commands on bot `ready`. Remove the `module-alias` dependency from the runtime path (TypeScript path aliases + tsc-alias handle it now). Clean up old `.js` files that now have `.ts` replacements.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | HIGH |
| Systems Affected | src/index.ts, src/models/Server, src/models/World, bot.js |
| Dependencies | discord.js ^14.25.1, @discordjs/voice ^0.19.0 |
| Estimated Tasks | 6 |

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/models/Server.ts` | CREATE | Convert Server class — the largest model |
| `src/models/World.ts` | CREATE | Convert World singleton |
| `src/index.ts` | UPDATE | Replace placeholder with full bot initialization |
| `src/commands/index.ts` | UPDATE | Ensure slash command registration on ready |
| `src/models/entry-point.test.ts` | CREATE | Tests for Server/World/index wiring |
| Old `.js` files | DELETE | Remove all `.js` files that have `.ts` replacements (bulk cleanup) |

---

## NOT Building (Scope Limits)

- **NOT changing any command behavior** — all commands already converted in Phase 5
- **NOT adding new Discord events** — preserve exact same event set as bot.js
- **NOT changing TTS pipeline** — Server.speak() and talk() remain identical logic
- **NOT changing config loading** — auth.json still loaded via require('@auth')

---

## Step-by-Step Tasks

### Task 1: CREATE `src/models/Server.ts`

- **ACTION**: Convert Server class to TypeScript — this is the largest and most critical model
- **IMPLEMENT**: Read `src/models/Server.js` completely. Convert class with:
  - Typed constructor `(guild: Guild, world: any)`
  - All properties with proper types (from `ServerStateData` interface)
  - All methods typed (speak, talk, playAudioContent, joinVoiceChannel, release, save, loadState, etc.)
  - Import discord.js voice types (`joinVoiceChannel`, `createAudioResource`, `AudioPlayer`, etc.)
  - Import `TextToSpeechService` from the .ts version
  - Keep `require('@auth')`, `require('@commands')`, `require('@helpers/common')`, `require('@helpers/bot-stuff')`, `require('@paths')`
  - `module.exports = Server`
- **GOTCHA**: Server.js has a `connection` getter that uses `getVoiceConnection(this.server_id)` — type return as `VoiceConnection | undefined`
- **GOTCHA**: `playAudioContent` accepts both `Readable` and `async () => Readable` — use the `AudioContent` type from types
- **GOTCHA**: save() uses a JSON.stringify replacer to exclude runtime-only fields
- **GOTCHA**: loadState() reads JSON from disk — type return as `ServerStateData | null`
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/models/World.ts`

- **ACTION**: Convert World singleton to TypeScript
- **IMPLEMENT**: Read `src/models/World.js`. Convert class with:
  - `servers: Record<string, any>` (Server instances keyed by guild.id)
  - `presence_timeout: ReturnType<typeof setTimeout> | null`
  - `default_title: string`
  - All methods typed
  - Export singleton: `module.exports = new World()`
- **GOTCHA**: `renderPresenceHelp()` does a lazy `require('@commands')` — keep this
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE `src/index.ts`

- **ACTION**: Replace placeholder with full bot initialization from bot.js
- **IMPLEMENT**: The new entry point should:
  1. Import `{ env }` from `./env` (env validation first)
  2. Require helpers: `commands`, `figlet`, `botStuff`, `Common`, `testing`
  3. Require models: `world`
  4. Get `bot` from `botStuff.bot`
  5. Run TTS startup tests: `await testing.TestIfTTSAPIServicesAreConfigured()`
  6. Show splash screen via figlet
  7. Wire ALL bot events from bot.js:
     - `ready` → `world.startup()` + register slash commands with Discord API
     - `guildCreate` → `world.addServer(guild)`
     - `guildDelete` → `world.removeServer(guild)`
     - `guildMemberRemove` → release if master leaves
     - `voiceStateUpdate` → channel switch/release logic
     - `messageCreate` → TTS speak OR legacy prefix commands
     - `interactionCreate` → `commands.handleInteraction(interaction)` for slash commands
     - `shardDisconnect`, `error`, `guildUnavailable`, `rateLimit`, `shardResume`, `warn`, `shardReconnecting`
  8. Wire process handlers: `SIGINT`, `uncaughtException`
  9. Call `botStuff.connect()`
- **GOTCHA**: The `interactionCreate` handler is NEW — not in bot.js. Add it after messageCreate.
- **GOTCHA**: On `ready`, register slash commands: call `REST.put(Routes.applicationCommands(env.CLIENT_ID), { body: commandData })` — or delegate to a method on the commands registry
- **GOTCHA**: Do NOT use `module-alias/register` — TypeScript aliases are handled by tsc-alias in build output
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: DELETE old `.js` files

- **ACTION**: Remove all `.js` files in `src/` that now have `.ts` replacements
- **IMPLEMENT**: Find all `.js` files in src/ that have a corresponding `.ts` file, and delete the `.js` versions. This includes:
  - `src/helpers/*.js` (common, bot-stuff, ssml-dictionary, discord-to-ssml, runtime-testing, ffmpeg)
  - `src/models/*.js` (SSMLTag, MessageParser, MessageSSML, CommentBuilder, BotCommand, Command, MessageDetails, Server, World)
  - `src/services/TextToSpeechService.js`
  - `src/services/tts/*.js` (all 7 provider .js files + PollyTTS.js)
  - `src/commands/index.js`
  - `src/commands/modules/*.js` (all 30 module .js files)
  - `src/paths.js`
- **GOTCHA**: Do NOT delete `bot.js` at root — keep it as legacy entry point for now
- **GOTCHA**: Do NOT delete config files (`.json` files)
- **GOTCHA**: After deletion, `setupProviders()` in TextToSpeechService.ts uses `fs.readdirSync(paths.tts)` — it must now find `.ts` files (compiled to `.js` in `dist/`) not the old source `.js` files. Since the compiled output in `dist/src/services/tts/` will have `.js` files, this should work.
- **VALIDATE**: `npm run build` — must still build successfully after deletion

### Task 5: UPDATE `package.json`

- **ACTION**: Remove `module-alias` from dependencies, update `start:legacy` note
- **IMPLEMENT**:
  - Remove `module-alias` from `dependencies`
  - Remove `_moduleAliases` section entirely
  - Keep `start:legacy` pointing to `bot.js` but add a comment that it's deprecated
  - Actually: keep `module-alias` in deps for now since `bot.js` still uses it. Just remove the `start:legacy` script to signal that `bot.js` is no longer the primary entry.
- **GOTCHA**: `bin/ffmpeg-test.js` and `bin/create-samples.js` use `module-alias/register` — those scripts would break. Keep `module-alias` for now; remove in Phase 9 cleanup.
- **VALIDATE**: `npm install` works

### Task 6: CREATE `src/models/entry-point.test.ts`

- **ACTION**: Write tests for Server, World, and index wiring
- **IMPLEMENT**: Tests covering:
  - World constructor has correct defaults
  - World.servers is initially empty
  - Server state data serialization (save/load round-trip with mock data)
  - `src/index.ts` can be imported without crashing (with mocked discord client)
- **VALIDATE**: `npm test`

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
npx tsc --noEmit
```

### Level 2: UNIT_TESTS
```bash
npm test
```

### Level 3: FULL_SUITE
```bash
npm test && npm run build
```

---

## Acceptance Criteria

- [ ] `src/index.ts` is the full bot entry point (not just a placeholder)
- [ ] `interactionCreate` event wired for slash commands
- [ ] `messageCreate` event preserved for TTS reading
- [ ] Server.ts and World.ts compile and are typed
- [ ] All old `.js` source files in `src/` deleted
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `node dist/src/index.js` starts without import errors (will fail at Discord login without real token, but must not fail on module resolution)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Server.js is huge (~700 lines) with complex voice logic | High | High | Convert method-by-method, type-check after each batch |
| Deleting .js files breaks something | Medium | High | Build and test BEFORE deleting; keep bot.js as fallback |
| setupProviders() dynamic require of .ts files | Medium | Medium | In compiled dist/, all .ts files become .js — discovery still works |
| tsc-alias path rewriting after .js deletion | Low | Medium | Build and verify no unrewritten aliases remain in dist/ |
