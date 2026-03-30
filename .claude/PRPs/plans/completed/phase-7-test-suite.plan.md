# Feature: Phase 7 — Test Suite

## Summary

Expand the test suite beyond the existing 126 tests to cover all critical paths: TTS provider loading/request building, command execution with mocked interactions, SSML parsing, config validation, and `.server` file parsing. The existing tests (env validation, type shapes, TTS base class, helper utilities, command definitions, entry point) provide a foundation — this phase adds behavioral and integration-level tests.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | test files only — no source changes |
| Dependencies | vitest ^3.0.0 |
| Estimated Tasks | 6 |

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/services/tts/tts-integration.test.ts` | CREATE | TTS provider request building and voice lookup tests |
| `src/models/ssml.test.ts` | CREATE | SSML parsing, tag stack, MessageSSML.build() tests |
| `src/models/server-config.test.ts` | CREATE | .server file parsing, state load/save round-trip |
| `src/env.test.ts` | UPDATE | Add failure case tests (missing required vars) |
| `src/commands/command-execution.test.ts` | CREATE | Command execute() with mocked interactions |
| `src/helpers/common-extended.test.ts` | CREATE | Extended coverage for Common utility edge cases |

---

## NOT Building

- NOT testing actual Discord API calls — all network calls mocked
- NOT testing actual TTS API calls — mock SDK responses
- NOT writing e2e tests requiring a running bot — that's Phase 9

---

## Step-by-Step Tasks

### Task 1: CREATE `src/services/tts/tts-integration.test.ts`

Tests covering:
- Each provider's `buildRequest()` returns valid request object shape
- `TextToSpeechService.getService('google')` returns correct provider
- `TextToSpeechService.getVoice('en-AU-Standard-A')` finds voice
- `TextToSpeechService.isValidLang('en-AU')` returns true
- `TextToSpeechService.getVoiceRecords('en')` returns filtered voices
- Voice record structure validation for each provider's hardcoded voices

### Task 2: CREATE `src/models/ssml.test.ts`

Tests covering:
- `SSMLTag.openString()` produces correct SSML element
- `SSMLTag.closeString()` produces correct close tag
- `MessageParser` tokenizes "hello world" into 2 tokens
- `MessageParser` handles empty string
- `MessageParser` handles multi-space separation
- `MessageSSML.build()` wraps text in `<speak>` tags
- `MessageSSML.getRelatedTagInfo('***')` returns emphasis tag
- SSML dictionary has 10 entries with valid open/close/type

### Task 3: CREATE `src/models/server-config.test.ts`

Tests covering:
- `ServerStateData` type matches sample `.server` JSON structure
- Default textrules from `config/default.textrules.json` parse correctly
- Lang messages from `src/lang.json` load correctly
- Server save replacer excludes runtime fields (connection, player, world, guild, *_timeout)
- Server state round-trip: construct defaults → serialize → parse back

### Task 4: UPDATE `src/env.test.ts`

Add tests:
- Missing DISCORD_TOKEN triggers validation error
- Missing CLIENT_ID triggers validation error
- Invalid NODE_ENV value triggers validation error
- Empty string DISCORD_TOKEN triggers validation error

### Task 5: CREATE `src/commands/command-execution.test.ts`

Tests covering:
- Commands registry `get()` returns command by name
- Commands registry `getCommandChar()` returns default '!'
- Slash command data for `ping` has correct name and description
- Slash command data for `sfx` has subcommands (set/list/del/clearall)
- Slash command data for `myvoice` has required string option "voice"
- Slash command data for `transfer` has required user option "user"
- Slash command data for `debugbork` has restricted permissions

### Task 6: CREATE `src/helpers/common-extended.test.ts`

Tests covering edge cases:
- `cleanMessage` with URLs removes them
- `cleanMessage` with repeating chars truncates
- `cleanMessage` with code blocks (triple backtick) — `isMessageExcluded` returns true
- `removeUrls` with replacement function
- `numberMap` range mapping
- `scaleToRange` boundary values
- `hashCode` deterministic for same input
- `caseToSpace` with camelCase input

---

## Validation Commands

```bash
npm test
npm test && npm run build
```

---

## Acceptance Criteria

- [ ] All new tests pass alongside existing 126
- [ ] Total test count significantly increased (target: 180+)
- [ ] TTS provider request building tested
- [ ] SSML parsing tested
- [ ] Config validation edge cases tested
- [ ] Command definition structure tested
- [ ] `npm run build` still succeeds
