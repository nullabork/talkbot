# TalkBot Modernization

## Problem Statement

Self-hosters and local users trying to install TalkBot face an inconsistent, fragile setup experience. The codebase is plain JavaScript with no types, making contributions error-prone and maintenance difficult. Discord API changes have broken commands, the Docker image uses a Python 2.7 base with Node 18, and there are zero tests to catch regressions. Users who aren't highly technical struggle to get the bot running.

## Evidence

- Discord's Message Content privileged intent enforcement means prefix commands don't work for bots in 100+ servers without approval — slash commands are the only viable path forward
- Docker base image (`python:2.7` + NVM Node 18) is severely outdated; discord.js 14.20+ requires Node 22.12.0+
- Zero test coverage means any change risks breaking TTS providers, SSML parsing, or command handling silently
- Users are actively requesting to use the bot but hitting setup friction
- Two incompatible command authoring patterns coexist (`BotCommand` plain objects vs `Command` ES6 classes), increasing cognitive load

## Proposed Solution

Convert the entire codebase to TypeScript, migrate all commands to Discord slash commands, modernize the Docker setup, add comprehensive tests, and move secrets to `.env` — while preserving every existing feature and maintaining backward compatibility with per-guild `.server` config files. Improve code DRYness and add descriptive comments on TTS provider APIs and voice service patterns.

## Key Hypothesis

We believe a TypeScript codebase with modern Discord.js patterns, proper tests, and streamlined Docker/local setup will make TalkBot installable and maintainable for self-hosters.
We'll know we're right when every existing feature works, the bot runs on Node 22+ in both Docker and local environments, and tests validate all TTS providers and commands.

## What We're NOT Building

- New features beyond what exists today — this is a modernization, not a feature release
- New TTS providers — preserve the existing 6 (Google, Amazon, Azure, Watson, Tencent, Alibaba)
- UI dashboard or web interface
- Database backend — keep file-based `.server` config persistence
- Discord.js v15 migration — v15 is not stable yet; stay on v14

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| All commands functional as slash commands | 100% of existing commands | Manual test + automated test suite |
| TypeScript coverage | 100% of source files converted | No `.js` files remain in `src/` |
| Test suite passes | All TTS providers load, voices produce audio, commands execute | `npm test` in CI |
| Docker install works | Single `docker compose up` gets bot running | Fresh clone test |
| Local install works | `npm install && npm start` gets bot running | Fresh clone test |
| Node.js version | 22 LTS | `engines` field in package.json |

## Open Questions

- [ ] Should the Twitch integration (`tmi.js`) be kept as-is or modernized to a newer Twitch library?
- [ ] Are all 6 TTS providers still actively used, or can any be deprecated (e.g., Alibaba is hardcoded `enabled: false`)?
- [ ] Should `module-alias` be replaced with TypeScript path aliases, or kept for runtime compatibility?
- [ ] Does the `@ffmpeg/ffmpeg` WASM approach for MP3-to-Opus conversion still make sense, or should we use native ffmpeg?
- [ ] Should PM2 be kept as the process manager, or replaced with Docker's built-in restart policies?

---

## Users & Context

**Primary User**
- **Who**: Self-hosters and local users who want a TTS bot for their Discord server. May not be highly technical.
- **Current behavior**: Clone repo, try to follow README, struggle with config/auth.json setup, Docker issues, missing dependencies
- **Trigger**: Want their Discord server to have text-to-speech in voice channels
- **Success state**: Bot is running, joins voice, reads messages aloud, commands work via slash commands

**Job to Be Done**
When I want a TTS bot for my Discord server, I want to easily install and configure it with clear instructions, so I can have messages read aloud without fighting setup issues.

**Non-Users**
- Developers looking for a bot framework/template — this is an application, not a library
- Users who want a hosted service — this is self-hosted only

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | TypeScript conversion of entire `src/` codebase | Core ask — type safety, maintainability, IDE support |
| Must | Slash command migration for all 25+ commands | Discord API requires it for public bots; prefix commands are deprecated |
| Must | Typed interfaces for `.server` config files and `auth` config | Consistency and validation of per-guild state |
| Must | `.env` for secrets (Discord token, TTS API keys) | Security best practice; simpler setup than editing JSON |
| Must | Modern Docker setup (Node 22 Alpine, multi-stage) | Current `python:2.7` base is a security and compatibility risk |
| Must | Test suite: TTS provider loading, voice output, command execution, SSML parsing | Zero tests today; need regression safety net |
| Must | Updated README with Docker and local setup instructions | Users are non-technical; clear docs are essential |
| Should | DRY refactoring of duplicated patterns (command registration, TTS provider base class) | Two command styles coexist; TTS providers share boilerplate |
| Should | Descriptive comments on TTS provider APIs and voice service patterns | Help future contributors understand the 6 different cloud APIs |
| Should | Unified command system (single `Command` class pattern) | Remove `BotCommand` legacy, one way to write commands |
| Should | Zod schema validation for env vars and config | Fail fast with clear errors on misconfiguration |
| Could | Preserve legacy prefix commands behind MessageContent intent flag | Backward compat for small private servers |
| Won't | New features, new providers, web UI, database backend | Scope control — modernization only |

### MVP Scope

All existing commands working as Discord slash commands, full TypeScript codebase, tests passing for all TTS providers and commands, Docker and local install paths documented and working.

### User Flow (Setup)

1. Clone repo
2. Copy `.env.example` to `.env`, fill in Discord token + TTS API keys
3. Either:
   - **Docker**: `docker compose up` — done
   - **Local**: `npm install && npm run build && npm start`
4. Bot comes online, registers slash commands with Discord
5. User types `/follow` in a text channel — bot joins their voice channel
6. User types a message — bot reads it aloud via configured TTS provider

---

## Technical Approach

**Feasibility**: HIGH — discord.js v14 is already installed, TypeScript is first-class in the ecosystem, and the existing architecture maps cleanly to modern patterns.

**Architecture Notes**
- Replace `module-alias` with TypeScript path aliases (`paths` in tsconfig.json) — cleaner, no runtime dependency
- Each command module exports a `SlashCommandBuilder` definition + `execute(interaction)` function
- Command registration script (`deploy-commands.ts`) PUTs all command definitions to Discord REST API on startup
- `src/env.ts` with Zod validates all environment variables at startup before bot connects
- Keep `config/{guild_id}.server` files but define TypeScript interfaces for their shape
- Keep `config/auth.json` as optional fallback but prefer `.env` for secrets
- Unified `Command` abstract class replaces both `BotCommand` and current `Command`
- TTS provider base class with proper abstract methods and JSDoc comments describing each cloud API

**Key Technical Decisions**
- **Node 22 LTS** — required by discord.js 14.20+
- **Vitest** for testing — fast, native ESM/TS, compatible with Jest API
- **`sodium-native`** for voice encryption — replaces removed `tweetnacl`
- **Multi-stage Docker** with `node:22-alpine` — small, secure images
- **Keep `@discordjs/voice`** current API patterns — already close to modern usage

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TTS provider SDK breaking changes during upgrade | Medium | Test each provider individually; pin SDK versions |
| `@ffmpeg/ffmpeg` WASM incompatibility with Node 22 | Medium | Test early; fallback to native ffmpeg if needed |
| `module-alias` removal breaks import resolution | Low | TypeScript path aliases are a direct replacement |
| Per-guild `.server` files have inconsistent shapes across installations | Medium | Define types with optional fields; validate on load with defaults |
| `sodium-native` native compilation fails in Docker Alpine | Low | Fallback to `@noble/ciphers` (pure JS) |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Project scaffolding | TypeScript config, build pipeline, env setup, new Docker, package.json modernization | complete | - | - | [phase-1-project-scaffolding.plan.md](../plans/completed/phase-1-project-scaffolding.plan.md) |
| 2 | Core types & models | TypeScript interfaces for config, server state, TTS providers, commands; convert models | complete | - | 1 | [phase-2-core-types-and-models.plan.md](../plans/completed/phase-2-core-types-and-models.plan.md) |
| 3 | TTS provider conversion | Convert all 6 TTS providers to TypeScript with typed base class, comments, DRY patterns | complete | with 4 | 2 | [phase-3-tts-provider-conversion.plan.md](../plans/completed/phase-3-tts-provider-conversion.plan.md) |
| 4 | Helper & utility conversion | Convert helpers (SSML, common, discord-to-ssml, ffmpeg) to TypeScript | complete | with 3 | 2 | [phase-4-helper-utility-conversion.plan.md](../plans/completed/phase-4-helper-utility-conversion.plan.md) |
| 5 | Command system overhaul | Unified Command class, slash command builders, interaction handlers for all 25+ commands | complete | - | 2, 3, 4 | [phase-5-command-system-overhaul.plan.md](../plans/completed/phase-5-command-system-overhaul.plan.md) |
| 6 | Bot entry point & wiring | Convert bot.js, wire slash commands, event handlers, voice state, startup flow | complete | - | 5 | [phase-6-bot-entry-point.plan.md](../plans/completed/phase-6-bot-entry-point.plan.md) |
| 7 | Test suite | Vitest setup, TTS provider tests, command tests, SSML tests, config validation tests | complete | with 8 | 6 | [phase-7-test-suite.plan.md](../plans/completed/phase-7-test-suite.plan.md) |
| 8 | Docker & documentation | Multi-stage Dockerfile, docker-compose, .env.example, README with setup instructions | complete | with 7 | 6 | [phase-8-docker-documentation.plan.md](../plans/completed/phase-8-docker-documentation.plan.md) |
| 9 | Integration testing & polish | End-to-end validation, cleanup, final DRY pass, comment review | complete | - | 7, 8 | [phase-9-integration-testing-polish.plan.md](../plans/completed/phase-9-integration-testing-polish.plan.md) |

### Phase Details

**Phase 1: Project Scaffolding**
- **Goal**: Establish TypeScript build infrastructure so all subsequent work is in TS
- **Scope**: `tsconfig.json`, build scripts, `src/env.ts` with Zod, `.env.example`, update `package.json` (engines, scripts, devDependencies), remove `module-alias` in favor of TS path aliases, update `.gitignore` for `dist/`
- **Success signal**: `npm run build` compiles an empty `src/index.ts` to `dist/`; `.env` loading works

**Phase 2: Core Types & Models**
- **Goal**: Define the type foundation that all other phases build on
- **Scope**: Interfaces for `ServerConfig` (`.server` files), `AuthConfig`, `TTS provider config`, `Command` abstract class, `MessageDetails`, `World`, `Server` model conversion
- **Success signal**: All interfaces compile; existing `.server` files parse against the types

**Phase 3: TTS Provider Conversion**
- **Goal**: All 6 TTS providers in TypeScript with a clean abstract base class
- **Scope**: `TextToSpeechService` abstract class with typed methods, convert Google/Amazon/Azure/Watson/Tencent/Alibaba providers, add JSDoc comments explaining each cloud API's authentication, request format, and audio output format
- **Success signal**: Each provider compiles and exports typed interfaces

**Phase 4: Helper & Utility Conversion**
- **Goal**: Convert all helpers to TypeScript
- **Scope**: `common.ts`, `discord-to-ssml.ts`, `ssml-dictionary.ts`, `ffmpeg.ts`, `runtime-testing.ts`, `bot-stuff.ts`
- **Success signal**: All helpers compile with proper types

**Phase 5: Command System Overhaul**
- **Goal**: Every command is a slash command with proper interaction handling
- **Scope**: Unified `Command` base class (remove `BotCommand`), `SlashCommandBuilder` for each of 25+ commands, command registration script, interaction handler in place of `messageCreate` dispatch, preserve all listener bus events (`onToken`, `onMessage`, `onFollow`, etc.)
- **Success signal**: All commands have slash command definitions and typed `execute(interaction)` methods

**Phase 6: Bot Entry Point & Wiring**
- **Goal**: Bot starts up, registers commands, connects to Discord, handles all events
- **Scope**: Convert `bot.js` to `src/index.ts`, wire `interactionCreate` to command handler, preserve `voiceStateUpdate`/`guildCreate`/`guildDelete` handlers, startup TTS provider validation, slash command deployment on ready
- **Success signal**: Bot compiles, starts, registers slash commands with Discord, responds to `/ping`

**Phase 7: Test Suite**
- **Goal**: Comprehensive test coverage for all critical paths
- **Scope**: Vitest config, test categories:
  - **Unit**: SSML parsing, message cleaning, config validation, text rules
  - **Provider**: Each TTS provider loads, builds requests, returns typed responses (mock API calls)
  - **Command**: Each command's execute function handles valid/invalid input
  - **Integration**: Voice pipeline produces audio buffers from TTS input (mock TTS API, verify Opus output)
  - **Config**: `.server` file parsing, `.env` validation, auth config loading
- **Success signal**: `npm test` passes with all test categories green

**Phase 8: Docker & Documentation**
- **Goal**: One-command Docker setup and clear local install instructions
- **Scope**: Multi-stage `Dockerfile` (Node 22 Alpine, build + production stages), updated `docker-compose.yml`, `.env.example` with every variable documented, comprehensive README covering: prerequisites, Docker setup, local setup, configuration guide, command reference, troubleshooting
- **Success signal**: Fresh `git clone && docker compose up` with populated `.env` starts the bot

**Phase 9: Integration Testing & Polish**
- **Goal**: Everything works end-to-end, code is clean
- **Scope**: Manual testing of all commands as slash commands, verify each TTS provider produces audio, DRY pass (deduplicate remaining patterns), comment review, final linting
- **Success signal**: All features work, all tests pass, code review clean

### Parallelism Notes

Phases 3 and 4 can run in parallel in separate worktrees — TTS providers and helpers are independent modules that both depend on the types defined in Phase 2 but don't depend on each other.

Phases 7 and 8 can run in parallel — test writing and Docker/docs are independent workstreams that both require the bot to be functional (Phase 6 complete).

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| TypeScript build tool | `tsc` (native compiler) | `swc`, `esbuild`, `tsx` | Simplest; no extra dependencies; TypeScript path aliases just work |
| Test framework | Vitest | Jest, Mocha | Fastest TS support, native ESM, modern ecosystem standard |
| Node version | 22 LTS | 20 LTS | Required by discord.js 14.20+; long-term support until 2027 |
| Docker base | `node:22-alpine` | `node:22-slim`, `node:22` | Smallest image, fewest CVEs, sufficient for this workload |
| Config approach | `.env` for secrets + keep `auth.json` for non-secret config | Full `.env`, full JSON | Secrets belong in env vars; non-secret config (limits, thresholds) is fine in JSON |
| Voice encryption | `sodium-native` | `@noble/ciphers`, `libsodium-wrappers` | Fastest; native compilation works in Alpine with build deps in Docker build stage |
| Slash command registration | On bot startup (guild-scoped in dev, global in prod) | Separate deploy script only | Simpler for self-hosters; no extra step |
| Keep `.server` files | Yes, with TypeScript interfaces | Migrate to SQLite/Postgres | Users asked to preserve; adding types ensures consistency |
| Command pattern | Single abstract `Command` class | Keep both patterns, decorators (discordx) | DRY; one way to write commands reduces confusion |
| Process manager | Docker restart policy (production), `nodemon` (dev) | PM2 | Simpler; PM2 adds unnecessary complexity for single-process bot |

---

## Research Summary

**Market Context**
- Discord.js v14 is stable (v14.25.1); v15 exists but is not production-ready
- Message Content is a privileged intent — slash commands are mandatory for public/verified bots
- The KevinNovak TypeScript template is the community gold standard for bot structure
- Vitest has overtaken Jest as the preferred test framework for TS Discord bots
- No official Discord.js testing utilities exist; `@shoginn/discordjs-mock` is the community choice

**Technical Context**
- Current codebase is already on discord.js v14.25.1 but uses legacy message-based commands
- 6 TTS providers with different auth patterns, audio formats, and SDK versions
- `@ffmpeg/ffmpeg` WASM is used for MP3-to-Opus conversion (Amazon Polly only) — needs Node 22 compatibility check
- `module-alias` can be cleanly replaced by TypeScript `paths` configuration
- Per-guild `.server` files have no schema — shapes may vary across installations
- Docker image uses `python:2.7` base which is a major security and maintenance liability

---

*Generated: 2026-03-28*
*Status: DRAFT - needs validation*
