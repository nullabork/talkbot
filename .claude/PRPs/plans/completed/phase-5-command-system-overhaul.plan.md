# Feature: Phase 5 — Command System Overhaul

## Summary

Convert all 37 commands (across 30 module files) from prefix-based (`!command`) to Discord slash commands (`/command`), convert the Commands registry (`commands/index.js`) to TypeScript, create a slash command deployment script, and add a module augmentation type for `Client.commands`. Preserve the listener event bus system that powers the TTS pipeline. Keep `messageCreate` handling for TTS reading (reads message.content → speaks it).

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR + ENHANCEMENT |
| Complexity | VERY HIGH |
| Systems Affected | src/commands/, src/types/ |
| Dependencies | discord.js ^14.25.1 (SlashCommandBuilder, REST, Routes, ChatInputCommandInteraction) |
| Estimated Tasks | 6 (registry + deploy script + type augmentation + command modules in batches + tests) |

---

## Architecture Decisions

**APPROACH**: Each command module exports `{ data: SlashCommandBuilder, execute: (interaction) => void }` alongside the existing listener registrations. The Commands registry is converted to TypeScript and gains slash command awareness. A separate deploy script registers commands with Discord's REST API.

**KEY DECISIONS**:
- `REST` and `Routes` imported from `discord.js` directly (no separate `@discordjs/rest` install needed)
- Guild-scoped registration for dev (instant), global for prod
- `messageCreate` event KEPT for TTS reading — slash commands only replace `!command` prefix dispatch
- Listener bus (onMessage, onToken, onValidate, etc.) PRESERVED — it's used by TTS pipeline
- Commands use `interaction.reply()` instead of `msg.response()` / `msg.il8nResponse()`
- Permission checks migrate: `ownerIsMaster()` → runtime check in execute; `setDefaultMemberPermissions()` for Discord-level perms
- Subcommands used for: `sfx` (add/remove/list/clearall), `textrule` (add/addregex/list/del/clearall), `bind`, `twitch`

**NOT BUILDING**:
- Autocomplete interactions — static choices are sufficient for now
- Context menu commands — out of scope
- Button/modal interactions — out of scope
- Removing prefix command support entirely — keep for backward compat behind MessageContent intent

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/types/discord.d.ts` | CREATE | Module augmentation: Client.commands Collection |
| `src/commands/index.ts` | CREATE | TypeScript Commands registry with slash command support |
| `src/deploy-commands.ts` | CREATE | Standalone script to PUT slash commands to Discord API |
| `src/commands/modules/*.ts` | CREATE (30 files) | All 30 command modules converted to TS with SlashCommandBuilder |
| `src/commands/commands.test.ts` | CREATE | Tests for registry and command definitions |

---

## Step-by-Step Tasks

### Task 1: CREATE `src/types/discord.d.ts`

- **ACTION**: Create module augmentation for discord.js Client
- **IMPLEMENT**:
```typescript
import { Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    startup?: () => void;
    listeners?: Record<string, Function>;
    sequence?: { message?: number; token?: number };
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, SlashCommand>;
    }
}
```
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/commands/index.ts`

- **ACTION**: Convert Commands registry to TypeScript with slash command support
- **IMPLEMENT**:
  - Keep the listener bus system (notify, on) for TTS pipeline events
  - Add `Collection<string, SlashCommand>` for slash command storage
  - `registerAllCommands()` scans `src/commands/modules/` for `.ts` files, loads each, adds to both listener bus and slash command collection
  - `process()` method remains for legacy prefix fallback (messageCreate)
  - New `handleInteraction(interaction)` method dispatches slash commands
  - Export singleton
- **GOTCHA**: The listener system must still work — commands like `sfx`, `textrule`, `stats`, `keep` register listeners that fire on every TTS message
- **GOTCHA**: `process()` dispatch difference: BotCommand gets `(msgDets)`, Command gets `({input: msgDets})` — keep for backward compat
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `src/deploy-commands.ts`

- **ACTION**: Create standalone slash command deployment script
- **IMPLEMENT**:
```typescript
import { REST, Routes } from 'discord.js';
import { env } from './env';
// Load all command modules, collect data.toJSON()
// PUT to Routes.applicationGuildCommands (dev) or Routes.applicationCommands (prod)
```
- Add to package.json scripts: `"deploy:commands": "node -r dotenv/config -r tsconfig-paths/register -r ts-node/register src/deploy-commands.ts"`
- **GOTCHA**: Only run when command definitions change, not on every startup
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE all 30 command module `.ts` files

This is the bulk of the work. Each command module needs:
1. A `SlashCommandBuilder` definition (`data`)
2. An `execute(interaction: ChatInputCommandInteraction)` function
3. Preserved listener registrations (if any)
4. A `register(commands)` function that works with both old and new registry

**Command conversion reference** (grouped by complexity):

**Simple commands (no args, no listeners)**:
- `ping.ts` — `/ping` → replies "pong"
- `defaults.ts` — `/defaults` → clears member settings
- `who.ts` — `/who` → shows master/permitted
- `invite.ts` — `/invite` → sends invite embed
- `voices.ts` — `/voices` optionalString("search") → sends voice browser link
- `help.ts` — `/help` optionalString("group", choices: personalization/control/info/server)

**Single-arg commands (personalization)**:
- `myvoice.ts` — `/myvoice` requiredString("voice") → sets TTS voice
- `mypitch.ts` — `/mypitch` requiredNumber("pitch", min:-20, max:20) or optionalString("reset")
- `myspeed.ts` — `/myspeed` requiredNumber("speed", min:0.25, max:4.0) or optionalString("reset")
- `mytitle.ts` — `/mytitle` optionalString("title") → sets/shows title
- `tolang.ts` — `/tolang` requiredString("language") → sets translation language
- `announceme.ts` — `/announceme` requiredString("toggle", choices: on/off) + listeners
- `myprefix.ts` — `/myprefix` subcommands: on/off/set(text) + listener
- `mysuffix.ts` — `/mysuffix` subcommands: on/off/set(text) + listener
- `puberty.ts` — `/puberty` requiredString("toggle", choices: on/off) + listener

**Voice control commands**:
- `follow.ts` — `/follow` → joins voice channel
- `unfollow.ts` — `/unfollow` → leaves voice (was in follow.js with 4 commands, split to individual)
- `sidle.ts` — `/sidle` → transfer master to self
- `transfer.ts` — `/transfer` requiredUser("user") → transfer master

**Permission commands**:
- `permit.ts` — `/permit` requiredUser("user") → permit user
- `unpermit.ts` — `/unpermit` requiredUser("user") → unpermit user

**TTS control**:
- `tts.ts` — `/tts` requiredString("message") → force-speak text
- `mute.ts` — `/mute` optionalUser("user") → mute self/other (split from tts.js)
- `unmute.ts` — `/unmute` optionalUser("user") → unmute self/other
- `stop.ts` — `/stop` optionalBoolean("all") → stop playback

**Server admin commands**:
- `adminrole.ts` — `/adminrole` requiredRole("role") → set admin role
- `commandchar.ts` — `/commandchar` optionalString("char") → set/show prefix
- `restrict.ts` — `/restrict` optionalChannel("channel") + listener
- `keep.ts` — `/keep` requiredString("count") + 2 listeners
- `details.ts` — `/details` optionalUser("user") → show settings

**Complex commands (subcommands)**:
- `sfx.ts` — `/sfx set|list|del|clearall|play` + token listener
- `textrule.ts` — `/textrule add|addregex|list|del|clearall` + message listener
- `bind.ts` — `/bind show|add|remove|permit|unpermit|echo` + 2 listeners
- `twitch.ts` — `/twitch permit|unpermit` + unfollow listener
- `stats.ts` — `/stats` optionalBoolean("daily") + message listener

**Dev-only commands**:
- `debugbork.ts` — `/debugbork` optionalInteger("minutes") (setDefaultMemberPermissions(0n))
- `evalo.ts` — `/evalo` requiredString("code") (setDefaultMemberPermissions(0n))

**IMPORTANT for each command**:
- Access server state: commands need access to `Server` and `World` objects. Since slash commands don't have a `message` with channel context, use `interaction.guildId` to look up the server from World.
- For commands that previously used `msg.response()`: use `interaction.reply()` or `interaction.editReply()`
- For commands that previously used `msg.il8nResponse()`: use `server.lang()` then `interaction.reply()`
- For permission checks: check `server.isMaster(interaction.member)` etc. inside execute()
- Listener registrations remain the same — they fire on messageCreate TTS pipeline, not on slash commands

**GOTCHA**: follow.js currently registers 4 commands in one file. Split into separate files (follow.ts, unfollow.ts, sidle.ts, transfer.ts) or use subcommands. Recommend separate files.
**GOTCHA**: tts.js currently registers 4 commands in one file. Split into tts.ts, mute.ts, unmute.ts, stop.ts.
**GOTCHA**: permit.js registers 2 commands. Split into permit.ts, unpermit.ts.
**GOTCHA**: debugbork.js registers 2 commands. Keep in one file with 2 exports or split.

- **VALIDATE**: `npx tsc --noEmit` after each batch

### Task 5: UPDATE `package.json`

- **ACTION**: Add deploy:commands script
- **IMPLEMENT**: Add `"deploy:commands": "ts-node -r tsconfig-paths/register src/deploy-commands.ts"` to scripts
- **VALIDATE**: Script entry exists

### Task 6: CREATE `src/commands/commands.test.ts`

- **ACTION**: Write tests for the command system
- **IMPLEMENT**: Tests covering:
  - Every command module has a valid `data` property (SlashCommandBuilder with name and description)
  - Every command module has an `execute` function
  - Command names are unique (no duplicates)
  - Commands with subcommands have valid subcommand definitions
  - Listener registrations are functions
  - Permission-restricted commands have setDefaultMemberPermissions set
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

- [ ] All 37 commands have SlashCommandBuilder definitions
- [ ] Commands registry (`index.ts`) handles both slash commands and legacy prefix
- [ ] Deploy script can register commands with Discord API
- [ ] Listener bus preserved for TTS pipeline events
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Permission checks work (dev-only, master-only, manage-server)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 37 commands is huge surface area | High | High | Convert in batches, validate after each |
| Slash commands need Server/World context | Medium | Medium | Look up via interaction.guildId from World singleton |
| Listener system breaks during conversion | Medium | High | Keep old JS files as runtime fallback; test listener chain |
| Permission model differs (Discord perms vs custom master/permitted) | Medium | Medium | Use setDefaultMemberPermissions for Discord perms, runtime checks for custom perms |

---

## Notes

- This phase creates `.ts` files alongside `.js` files. Phase 6 will wire the new TS entry point and remove old JS files.
- The `messageCreate` event handler stays — it's how the bot reads messages for TTS. Only the `!command` prefix dispatch is replaced by slash commands.
- Commands that were split from multi-command files (follow/unfollow/sidle/transfer, tts/mute/unmute/stop, permit/unpermit) become individual files for cleaner slash command registration.
- The deploy script is a standalone utility, not run on every bot start. Add to README in Phase 8.
