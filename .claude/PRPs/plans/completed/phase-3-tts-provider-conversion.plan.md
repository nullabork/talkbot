# Feature: Phase 3 — TTS Provider Conversion

## Summary

Convert all 6 TTS providers and the base class to TypeScript with a DRYer architecture. Move duplicated logic (enabled/limit getters, getVoices, getRandomVoice, getDefaultVoice fallback, doBookkeeping) into the base class. Add JSDoc comments explaining each cloud API's auth, request format, and audio output. Convert PollyTTS and ffmpeg helper as part of this phase since they're tightly coupled to the Amazon provider.

## User Story

As a developer maintaining TalkBot
I want typed TTS providers with shared base class logic
So that adding or modifying providers is consistent and less error-prone

## Problem Statement

6 providers duplicate identical code for enabled/limit getters, voice retrieval, random voice selection, default voice fallback, and usage bookkeeping. All are untyped JavaScript with no IDE support. Several providers have bugs (Tencent: undefined `self` and `Credential`, Alibaba: missing imports for `lame`/`samplerate`/`prism`).

## Solution Statement

Convert `TextToSpeechService.js` to an abstract TypeScript base class that implements common patterns (getVoices, getRandomVoice, getDefaultVoice 3-pass fallback, doBookkeeping, enabled/limit getters). Each provider becomes a TypeScript subclass that only defines provider-specific logic: credentials, SDK client, buildRequest, getAudioContent, buildVoices. PollyTTS becomes a typed utility class.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | HIGH |
| Systems Affected | src/services/, src/helpers/ffmpeg.js |
| Dependencies | discord.js ^14.25.1, @google-cloud/text-to-speech 6.4.0, ibm-watson ^12.1.1, tencentcloud-sdk-nodejs 4.1.159, @ffmpeg/ffmpeg ^0.11.6, aws4, request-promise, xmlbuilder, streamifier, ssml-validator, node-fetch |
| Estimated Tasks | 10 |

---

## Mandatory Reading

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/services/TextToSpeechService.js` | all | Base class — every method must be typed |
| P0 | `src/types/tts.ts` | all | Already-defined interfaces to implement |
| P0 | `src/types/member-settings.ts` | all | VoiceSettings type used by buildRequest |
| P0 | `src/types/config.ts` | all | AuthConfig type for config access |
| P1 | Each provider file in `src/services/tts/` | all | Full implementation to convert |
| P1 | `src/helpers/ffmpeg.js` | all | MP3→Opus conversion for Amazon |
| P2 | `src/models/Server.js` | 457-499 | How talk() calls buildRequest/getAudioContent |

---

## Patterns to Mirror

**EXISTING TS PATTERN (env.ts):**
```typescript
// SOURCE: src/env.ts:1-3
import 'dotenv/config';
import { z } from 'zod';
```

**DRY OPPORTUNITIES — Move these identical patterns into base class:**

```javascript
// DUPLICATED in 5 providers — enabled getter:
get enabled() { return auth.tts && auth.tts.<name> && auth.tts.<name>.enabled; }

// DUPLICATED in 5 providers — limit getter:
get limit() { return auth.tts.<name>.limit; }

// DUPLICATED in 6 providers — getVoices():
getVoices() { return XyzTextToSpeechAPI.voices; }

// DUPLICATED in 5 providers — getRandomVoice():
getRandomVoice(randnum, gender, lang_code) {
    if (!randnum) randnum = Math.random() * 1000000;
    var voices = XyzTextToSpeechAPI.voices.filter(...);
    return voices[randnum % voices.length].voice;
}

// DUPLICATED in 4 providers — doBookkeeping():
doBookkeeping(request) {
    XyzTextToSpeechAPI.count += request.text.length;
    if (auth.tts.<name>.enforce_limit && XyzTextToSpeechAPI.count > this.limit)
        throw '<Name> limit reached';
}

// DUPLICATED in 3 providers — getDefaultVoice 3-pass fallback:
// 1. match code+gender  2. match code  3. match en-US+gender  4. hardcoded
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/services/TextToSpeechService.ts` | CREATE | Typed abstract base class with shared logic |
| `src/services/tts/GoogleTextToSpeechAPI.ts` | CREATE | Typed Google provider |
| `src/services/tts/AmazonTextToSpeechAPI.ts` | CREATE | Typed Amazon provider |
| `src/services/tts/AzureTextToSpeechAPI.ts` | CREATE | Typed Azure provider |
| `src/services/tts/WatsonTextToSpeechAPI.ts` | CREATE | Typed Watson provider |
| `src/services/tts/TencentTextToSpeechAPI.ts` | CREATE | Typed Tencent provider |
| `src/services/tts/AlibabaTextToSpeechAPI.ts` | CREATE | Typed Alibaba provider |
| `src/services/tts/PollyTTS.ts` | CREATE | Typed AWS signing client |
| `src/helpers/ffmpeg.ts` | CREATE | Typed MP3→Opus conversion |
| `src/services/tts/tts-providers.test.ts` | CREATE | Tests for base class and provider contracts |

**Old `.js` files will be kept alongside `.ts` files during migration. They will be removed in Phase 6 when bot.js is replaced.**

---

## NOT Building (Scope Limits)

- **NOT fixing Alibaba's broken audio pipeline** — it uses uninstalled deps (`lame`, `samplerate`, `prism`); keep `enabled: false` hardcoded
- **NOT fixing Tencent's runtime bugs** — the undefined `self`, `Credential` references are preserved as-is; just typed around
- **NOT changing the provider discovery mechanism** — `setupProviders()` still uses `fs.readdirSync` + dynamic require
- **NOT changing how Server.js calls providers** — that's Phase 6
- **NOT moving auth config reading to .env** — providers still read from `require('@auth')` for now

---

## Step-by-Step Tasks

### Task 1: CREATE `src/services/TextToSpeechService.ts`

- **ACTION**: Convert base class to TypeScript abstract class with shared implementations
- **IMPLEMENT**: Abstract class that:
  - Implements common `getVoices()`, `getRandomVoice()`, `getDefaultVoice()` with 3-pass fallback
  - Implements `doBookkeeping()` as a protected method
  - Declares abstract methods: `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`
  - Declares abstract getters: `shortname`, `format`
  - Implements `enabled` and `limit` reading from auth config using shortname
  - Keeps all static methods: `setupProviders()`, `getService()`, `checkProviderContract()`, `checkVoiceStructure()`, etc.
  - Stores voices as a protected static map keyed by shortname
  - Stores usage count as a protected static map keyed by shortname
- **TYPES**: Import `VoiceRecord`, `AudioContent`, `AudioFormat`, `TTSProviderContract`, `VoiceSettings` from `@src/types`
- **GOTCHA**: `setupProviders()` uses dynamic `require()` — keep as-is for now, TypeScript `allowJs: true` handles this
- **GOTCHA**: `checkProviderContract` writes JSON files to disk as a side effect — preserve this behavior
- **GOTCHA**: `getVoiceRecords()` has a bug with undeclared `service` variable — fix it while converting
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/services/tts/PollyTTS.ts`

- **ACTION**: Convert AWS Polly HTTP signing client to TypeScript
- **IMPLEMENT**: Class with typed constructor, `describeVoices()`, `textToSpeech()` methods
- **TYPES**: Import `AWSPollyVoice`, `PollyTTSOptions` from `@src/types`
- **GOTCHA**: Region is hardcoded to `eu-west-1` in the original — preserve this behavior but note it
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `src/helpers/ffmpeg.ts`

- **ACTION**: Convert ffmpeg MP3→Opus helper to TypeScript
- **IMPLEMENT**: Typed `mp3ToReadableOpusBuffer()` function, remove unused imports (`joinVoiceChannel`, `createAudioPlayer`, `NoSubscriberBehavior`)
- **TYPES**: Return type is `AudioResource` from `@discordjs/voice`
- **GOTCHA**: `@ffmpeg/ffmpeg` v0.11 types may not exist — use `any` for the ffmpeg instance if needed
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE `src/services/tts/GoogleTextToSpeechAPI.ts`

- **ACTION**: Convert Google TTS provider to TypeScript extending new base class
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Remove duplicated `enabled`, `limit`, `getVoices()`, `getRandomVoice()` (now in base class). Add JSDoc comments explaining Google Cloud TTS API auth (service account JSON), request format (SSML + voice config + audio config), and output format (OGG_OPUS).
- **GOTCHA**: Google's `getDefaultVoice()` has special `type == 'Standard'` preference — override base class method
- **GOTCHA**: `buildVoices()` has a ~100-entry hardcoded voice map — preserve as-is
- **GOTCHA**: Line 26 has stray `s` character — remove during conversion
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE `src/services/tts/AmazonTextToSpeechAPI.ts`

- **ACTION**: Convert Amazon Polly provider to TypeScript
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Use base class `doBookkeeping()`, `getDefaultVoice()`, `getRandomVoice()`, `getVoices()`. Add JSDoc comments explaining AWS Polly auth (accessKeyId/secretAccessKey signing via aws4), request format (SSML text with voiceId), and output format (MP3 → ffmpeg → Opus).
- **GOTCHA**: `buildRequest` uses `ssml-validator` to correct SSML — import and type appropriately
- **GOTCHA**: `getAudioContent` returns ffmpeg-converted audio — depends on Task 3
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: CREATE `src/services/tts/AzureTextToSpeechAPI.ts`

- **ACTION**: Convert Azure TTS provider to TypeScript
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Azure has unique features: token refresh interval, XML builder for SSML, HTTP streaming response. Add JSDoc comments explaining Azure Cognitive Services auth (subscription key → bearer token via issuetoken endpoint, refreshed every 10 min), request format (SSML XML via xmlbuilder), and output format (ogg-24khz-16bit-mono-opus stream).
- **GOTCHA**: Azure's `getDefaultVoice()` uses 2-pass fallback (not 3) — override base class
- **GOTCHA**: `request-promise` is deprecated but functional — keep for now, note for future replacement
- **GOTCHA**: `voiceMap` is referenced but never populated — remove dead code
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: CREATE `src/services/tts/WatsonTextToSpeechAPI.ts`

- **ACTION**: Convert Watson TTS provider to TypeScript
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Use base class `doBookkeeping()`. Add JSDoc comments explaining IBM Watson TTS auth (IAM API key via IamAuthenticator), request format (plain text with voice name and accept header), and output format (audio/ogg;codecs=opus stream via SDK).
- **GOTCHA**: Watson's `getDefaultVoice()` ignores parameters and returns hardcoded value — override
- **GOTCHA**: Watson's `getRandomVoice()` doesn't filter by gender/lang — override
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: CREATE `src/services/tts/TencentTextToSpeechAPI.ts`

- **ACTION**: Convert Tencent TTS provider to TypeScript
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Use base class `doBookkeeping()`, `getDefaultVoice()`, `getRandomVoice()`. Add JSDoc comments explaining Tencent Cloud TTS auth (HMAC-SHA256 signed credentials), request format (TextToVoiceRequest model with text/voice/codec params), and output format (opus audio as base64 in response.Audio).
- **GOTCHA**: `buildRequest` uses `self` which is undefined — fix to use `this`
- **GOTCHA**: `doBookkeeping` reads `request.text.length` but field is `request.Text` — fix the casing
- **GOTCHA**: `Credential`, `HttpProfile`, `ClientProfile` are used but not imported from the SDK — fix imports
- **GOTCHA**: Single hardcoded voice with integer `0` — type as string for consistency
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: CREATE `src/services/tts/AlibabaTextToSpeechAPI.ts`

- **ACTION**: Convert Alibaba TTS provider to TypeScript
- **IMPLEMENT**: Override `shortname`, `format`, `startupTests()`, `buildRequest()`, `getAudioContent()`, `buildVoices()`. Keep `enabled` hardcoded to `false`. Use base class `doBookkeeping()`, `getDefaultVoice()`, `getRandomVoice()`. Add JSDoc comments explaining Alibaba TTS auth (appkey/token), request format (JSON body with voice/format/sample_rate), and note that the audio pipeline is non-functional (missing lame/samplerate/prism dependencies).
- **GOTCHA**: `getAudioContent` references uninstalled packages — type the function but mark as non-functional in comments
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: CREATE `src/services/tts/tts-providers.test.ts`

- **ACTION**: Write tests for the base class shared logic and provider type compliance
- **IMPLEMENT**: Tests covering:
  - Base class `getDefaultVoice()` 3-pass fallback with mock voices
  - Base class `getRandomVoice()` deterministic selection
  - Base class `doBookkeeping()` counting and limit enforcement
  - `checkVoiceStructure()` accepts valid voices, rejects invalid
  - Each provider class can be instantiated and has correct `shortname` and `format`
  - VoiceRecord shape validation against real provider buildVoices output (for providers with hardcoded voices)
- **VALIDATE**: `npm test`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `src/services/tts/tts-providers.test.ts` | getDefaultVoice fallback, getRandomVoice, doBookkeeping, checkVoiceStructure, provider instantiation, voice shapes | Base class logic, provider contracts |

### Edge Cases Checklist

- [ ] `getDefaultVoice` with no matching voices falls to hardcoded default
- [ ] `getRandomVoice` with empty filter results
- [ ] `doBookkeeping` throws string (not Error) on limit breach
- [ ] `checkVoiceStructure` rejects voice missing `gender`
- [ ] `checkVoiceStructure` rejects voice with invalid gender string
- [ ] Provider with `enabled: false` is skipped by setupProviders

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 2: UNIT_TESTS

```bash
npm test
```

**EXPECT**: All tests pass (existing 15 + new TTS tests)

### Level 3: FULL_SUITE

```bash
npm test && npm run build
```

**EXPECT**: All tests pass, build succeeds

---

## Acceptance Criteria

- [ ] All 8 provider/service files converted to TypeScript
- [ ] `TextToSpeechService.ts` base class eliminates duplicated: enabled, limit, getVoices, getRandomVoice, getDefaultVoice, doBookkeeping
- [ ] Each provider overrides only provider-specific logic
- [ ] JSDoc comments on each provider explain: auth mechanism, request format, audio output format
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes with new provider tests
- [ ] `npm run build` succeeds
- [ ] Known bugs documented (Tencent undefined refs, Alibaba missing deps)
- [ ] Existing tests still pass

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `@ffmpeg/ffmpeg` v0.11 has no TypeScript types | High | Low | Use `any` for ffmpeg instance; add `@ts-expect-error` if needed |
| Provider SDK types may not match actual runtime shapes | Medium | Medium | Use `any` for SDK responses where types are unavailable; gradually tighten |
| `setupProviders()` dynamic require breaks with .ts files | High | High | Keep `.js` files alongside `.ts` during migration; `setupProviders` loads `.js` files; Phase 6 will update discovery |
| `request-promise` has no maintained types | Medium | Low | Use `@types/request-promise` or type as `any` for the HTTP responses |

---

## Notes

- Old `.js` files are **not deleted** in this phase. They remain as the runtime files loaded by `setupProviders()` via `fs.readdirSync`. The new `.ts` files compile to `dist/` but won't be used until Phase 6 rewires the entry point. This phase focuses on getting the TypeScript versions correct and tested.
- The base class DRY refactoring uses a `protected static voiceStore: Map<string, VoiceRecord[]>` keyed by shortname, replacing per-class static arrays. `getVoices()` in the base reads from this map using `this.shortname`.
- Similarly, `protected static usageCount: Map<string, number>` replaces per-class count variables.
- `doBookkeeping` is moved to a protected base class method that reads `auth.tts[this.shortname].enforce_limit`.
- Google's `getDefaultVoice` override adds the `type == 'Standard'` preference.
- Watson's `getDefaultVoice` and `getRandomVoice` are overridden since they don't follow the common pattern.
- Azure's `getDefaultVoice` has a 2-pass fallback — it overrides to skip the `en-US` fallback step.
