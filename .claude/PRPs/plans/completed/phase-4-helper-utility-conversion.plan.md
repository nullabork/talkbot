# Feature: Phase 4 — Helper & Utility Conversion

## Summary

Convert all helper files and model utility classes to TypeScript. This includes `common.js`, `bot-stuff.js`, `ssml-dictionary.js`, `discord-to-ssml.js`, `runtime-testing.js`, `paths.js`, and all model files (`SSMLTag`, `MessageParser`, `MessageSSML`, `CommentBuilder`, `BotCommand`, `Command`, `MessageDetails`). The conversion order follows the dependency graph: leaves first (no deps), then progressively dependent files. `ffmpeg.ts` was already converted in Phase 3.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | HIGH |
| Systems Affected | src/helpers/, src/models/, src/paths.js |
| Dependencies | discord.js ^14.25.1, @google-cloud/translate ^9.3.0, pad 3.3.0, lang.js 1.1.14 |
| Estimated Tasks | 14 |

---

## Files to Change

| File | Action | Wave | Justification |
|------|--------|------|---------------|
| `src/models/SSMLTag.ts` | CREATE | 1 | Zero deps — leaf node |
| `src/models/MessageParser.ts` | CREATE | 1 | Zero deps — leaf node |
| `src/models/BotCommand.ts` | CREATE | 1 | Zero deps — leaf node |
| `src/paths.ts` | CREATE | 2 | Only uses `path` built-in |
| `src/helpers/common.ts` | CREATE | 2 | Only uses `@auth` + `util` |
| `src/helpers/ssml-dictionary.ts` | CREATE | 3 | Depends on SSMLTag |
| `src/models/Command.ts` | CREATE | 3 | Depends on common |
| `src/models/CommentBuilder.ts` | CREATE | 3 | Depends on common + pad |
| `src/helpers/discord-to-ssml.ts` | CREATE | 3 | Depends on common |
| `src/helpers/bot-stuff.ts` | CREATE | 4 | Depends on common + discord.js |
| `src/models/MessageDetails.ts` | CREATE | 5 | Depends on bot-stuff + common |
| `src/models/MessageSSML.ts` | CREATE | 5 | Depends on ssml-dictionary + common |
| `src/helpers/runtime-testing.ts` | CREATE | 6 | Lazy requires TextToSpeechService |
| `src/helpers/helpers.test.ts` | CREATE | - | Tests for converted helpers |

---

## NOT Building (Scope Limits)

- **NOT converting Server.js** — that's Phase 6 (bot entry point)
- **NOT converting World.js** — that's Phase 6
- **NOT converting commands/index.js** — that's Phase 5
- **NOT converting any command modules** — that's Phase 5
- **NOT deleting .js files** — old files kept until Phase 6

---

## Step-by-Step Tasks

### Task 1: CREATE `src/models/SSMLTag.ts`

- **ACTION**: Convert SSMLTag class to TypeScript
- **IMPLEMENT**: Import `SSMLTagData` from types. Class with typed constructor accepting `Partial<SSMLTagData>`, properties `open`, `close`, `type`, `attributes`, methods `openString()`, `closeString()`, `getAttributesString()`.
- **GOTCHA**: Constructor uses `Object.assign(this, details)` — keep this pattern
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/models/MessageParser.ts`

- **ACTION**: Convert MessageParser class to TypeScript
- **IMPLEMENT**: Class with constructor `(text: string)`, properties `text: string`, `compiled: string[]`, `index: number`, methods `tokensRemaining(): boolean`, `nextToken(): string | null`, `compile(token: string): string`, `parse(): string[]`
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `src/models/BotCommand.ts`

- **ACTION**: Convert BotCommand class to TypeScript
- **IMPLEMENT**: Import `BotCommandData`, `CommandLike` from types. Class implementing `CommandLike` with constructor accepting `Partial<BotCommandData>`. Properties with defaults matching original. `Object.assign(this, client_data)` pattern.
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE `src/paths.ts`

- **ACTION**: Convert paths module to TypeScript
- **IMPLEMENT**: Import `Paths` type from types. Same `__dirname` resolution logic. Same `make()`, `join()`, `include()` functions. Export typed `paths` object.
- **GOTCHA**: `__dirname` will differ when compiled to `dist/` — use same logic but it should still work since `__dirname` of the compiled file under `dist/src/` pops `src` just like the original pops `src` from the source tree.
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE `src/helpers/common.ts`

- **ACTION**: Convert Common class to TypeScript
- **IMPLEMENT**: All static methods with proper types. `require('@auth')` for config. `require('util')` for inspect. Keep same logging behavior gated by `config.logging.out`/`config.logging.err`.
- **GOTCHA**: `removeUrls` takes `fn` as either string or function — type as `string | ((match: string) => string)`
- **GOTCHA**: `makeCsv` takes a discord.js-like Collection — type as `{ size: number; forEach(cb: (item: any) => void): void }`
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: CREATE `src/helpers/ssml-dictionary.ts`

- **ACTION**: Convert SSML dictionary to TypeScript
- **IMPLEMENT**: Import SSMLTag class. Export typed array of SSMLTag instances matching the 10 entries.
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: CREATE `src/models/Command.ts`

- **ACTION**: Convert Command base class to TypeScript
- **IMPLEMENT**: Import `CommandLike`, `CommandListeners`, `ListenerCallback` from types. Static singleton pattern with `static instance: Command`. Typed getters. `execute` method typed with `unknown` params.
- **GOTCHA**: `static get command()` uses `this` to reference the subclass — TypeScript needs `this: typeof Command` or the `new this()` pattern must be typed carefully
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: CREATE `src/models/CommentBuilder.ts`

- **ACTION**: Convert CommentBuilder class to TypeScript
- **IMPLEMENT**: Import `CommentBuilderData` from types. Typed constructor, `static create()`, `recurse()`, `row()`, `arrayRow()`, `heading()`, `out()`.
- **GOTCHA**: `pad` npm package may need `@types/pad` or a manual declaration — check and add if needed
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: CREATE `src/helpers/discord-to-ssml.ts`

- **ACTION**: Convert discord-to-ssml constructor function to TypeScript
- **IMPLEMENT**: Convert to a class or keep as constructor function. Properties `config`, `tags`. Methods `addBuffer()`, `build()`. Remove `String.prototype.reverse` mutation if possible (check if it's used).
- **GOTCHA**: This is a constructor function, not a class — convert to class for TypeScript
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: CREATE `src/helpers/bot-stuff.ts`

- **ACTION**: Convert BotStuff singleton to TypeScript
- **IMPLEMENT**: Import discord.js types (`Client`, `GatewayIntentBits`, `PermissionsBitField`). Class with typed constructor, properties (`auth`, `bot`, `translate_client`), methods (`connect`, `isServerOwner`, `canManageTheServer`, `canManageTheBot`, `botHasManageMessagePermissions`, `sendMessage`). Export singleton instance: `module.exports = new BotStuff()`.
- **GOTCHA**: Must export the INSTANCE, not the class
- **VALIDATE**: `npx tsc --noEmit`

### Task 11: CREATE `src/models/MessageDetails.ts`

- **ACTION**: Convert MessageDetails class to TypeScript
- **IMPLEMENT**: Import discord.js types for Message, GuildMember, Role, Collection. Import `MessageDetailsLike` from types. Typed constructor with `Object.assign` pattern. All methods typed.
- **GOTCHA**: `richResponse` uses `{ embed: embobj }` which is deprecated discord.js v14 syntax — keep as-is for now (Phase 5 will fix)
- **VALIDATE**: `npx tsc --noEmit`

### Task 12: CREATE `src/models/MessageSSML.ts`

- **ACTION**: Convert MessageSSML class to TypeScript
- **IMPLEMENT**: Import SSMLTag, ssml-dictionary, common. Typed constructor, `compile()`, `tagsToClose()`, `getRelatedTagInfo()`, `messageBuffer()`, `build()`.
- **GOTCHA**: Requires `@commands` (commands/index.js) — keep as `require('@commands')` with `any` type since commands/index.js isn't converted yet
- **VALIDATE**: `npx tsc --noEmit`

### Task 13: CREATE `src/helpers/runtime-testing.ts`

- **ACTION**: Convert RuntimeTesting class to TypeScript
- **IMPLEMENT**: Lazy `require('@services/TextToSpeechService')` inside methods. Two static methods: `TestIfTTSAPIServicesAreConfigured()`, `TestIfNodeOpusIsInstalled()`.
- **VALIDATE**: `npx tsc --noEmit`

### Task 14: CREATE `src/helpers/helpers.test.ts`

- **ACTION**: Write tests for converted helpers and models
- **IMPLEMENT**: Tests covering:
  - `Common.escapeRegExp()`, `isURL()`, `numberClamp()`, `hashCode()`, `cleanMessage()`, `isMessageExcluded()`, `camelize()`, `makeAudioSSML()`
  - `SSMLTag` constructor and `openString()`/`closeString()` output
  - `MessageParser` tokenization of simple text
  - `CommentBuilder.create()` with simple data
  - `BotCommand` default properties
  - `Command.command` singleton pattern
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

- [ ] All 13 helper/model files converted to TypeScript
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes with new helper tests
- [ ] `npm run build` succeeds
- [ ] Existing 53 tests still pass
- [ ] Old `.js` files preserved alongside `.ts` files

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `pad` npm package has no types | Medium | Low | Add `declare module 'pad'` in a `.d.ts` file |
| `@commands` circular reference in MessageSSML | Low | Medium | Use `require()` with `any` type — commands/index.js stays as JS |
| `discord-to-ssml.js` mutates String.prototype | Low | Low | Keep mutation in TS version, note for future cleanup |
| `paths.ts` __dirname differs in compiled output | Medium | Medium | Test that path resolution still works after build |
