# TalkBot - Discord Text-to-Speech Bot

TalkBot reads Discord text channel messages aloud in voice channels. Type a message and the bot speaks it. Supports multiple voice providers, per-user voice customization, and works on any server.

---

## Table of Contents

- [What You Need](#what-you-need)
- [Download](#download)
- [Quick Start (Docker)](#quick-start-docker)
- [Quick Start (No Docker)](#quick-start-no-docker)
- [Discord Setup](#discord-setup)
- [TTS Providers](#tts-providers)
- [Commands](#commands)
- [Migrating from auth.json](#migrating-from-authjson)
- [Environment Variables Reference](#environment-variables-reference)
- [Setup on Coolify](#setup-on-coolify)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Acknowledgements](#acknowledgements)

---

## What You Need

1. **A Discord bot token** — free from the [Discord Developer Portal](https://discord.com/developers/applications) (see [Discord Setup](#discord-setup))
2. **API credentials for a TTS (text-to-speech) service** — at least one. Amazon Polly is the easiest to start with (see [TTS Providers](#tts-providers))
3. **A place to run the bot** — your own computer, a VPS, or a hosting service like [Coolify](#setup-on-coolify)

---

## Download

**Option A — Download as ZIP (no git required):**

1. Click the green **Code** button at the top of this page
2. Click **Download ZIP**
3. Extract the ZIP to a folder on your computer

**Option B — Clone with git:**
```bash
git clone https://github.com/nullabork/talkbot.git
cd talkbot
```

---

## Quick Start (Docker)

[Docker](https://www.docker.com/get-started/) packages the bot and everything it needs into a container so you don't have to install Node.js or manage dependencies. If you don't have Docker, see [Quick Start (No Docker)](#quick-start-no-docker) instead.

1. **Install Docker** if you don't have it: [docker.com/get-started](https://www.docker.com/get-started/)

2. **Open a terminal** in the talkbot folder.

3. **Create your settings file:**
   - Copy the file `.env.example` and rename the copy to `.env`
   - Open `.env` in a text editor (Notepad, VS Code, etc.)
   - Paste your Discord bot token after `DISCORD_TOKEN=`
   - Paste your TTS provider credentials (see [TTS Providers](#tts-providers))

4. **Start the bot:**
   ```bash
   docker compose up -d
   ```

6. **Check it's working:**
   ```bash
   docker compose logs -f
   ```
   You should see `Loaded the <Provider> TTS API credentials OK.` and then the bot logging into Discord. Press Ctrl+C to stop watching logs (the bot keeps running).

**To stop the bot:** `docker compose down`
**To restart after changes:** `docker compose down && docker compose build && docker compose up -d`

---

## Quick Start (No Docker)

If you'd rather run the bot directly on your computer without Docker.

1. **Install Node.js 22 or newer** from [nodejs.org](https://nodejs.org/) — download the LTS version.

2. **Open a terminal** in the talkbot folder.

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create your settings file:**
   - Copy `.env.example` and rename the copy to `.env`
   - Open `.env` in a text editor and add your Discord bot token and TTS credentials

5. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

The bot will start and connect to Discord. To stop it, press Ctrl+C.

---

## Migrating from auth.json

If you're upgrading from an older version that used `config/auth.json`:

1. **Copy your bot token** from `auth.json` → `DISCORD_TOKEN` in `.env`
2. **Copy your TTS provider credentials** for whichever provider you use:
   - Amazon Polly: `accessKeyId` → `AWS_ACCESS_KEY_ID`, `secretAccessKey` → `AWS_SECRET_ACCESS_KEY`
   - Azure: `subscriptionKey` → `AZURE_SUBSCRIPTION_KEY`
   - Watson: `apikey` → `WATSON_API_KEY`, `serviceUrl` → `WATSON_SERVICE_URL`
   - Google: already uses `GOOGLE_APPLICATION_CREDENTIALS` env var
3. **Optionally move** other settings: `dev_ids` → `DEV_IDS` (comma-separated), `command_char` → `COMMAND_CHAR`
4. **Delete `auth.json`** — it's no longer used. Everything is in `.env` now.

**Your `.server` files** (per-guild state in `config/`) are unchanged and will continue to work.

See the full [Environment Variables Reference](#environment-variables-reference) for all available settings and their defaults.

---

## Discord Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under **Bot**, create a bot and copy the token → paste into `DISCORD_TOKEN` in `.env`.
3. Under **Bot > Privileged Gateway Intents**, enable:
   - **Message Content Intent** (required — the bot reads message text for TTS)
   - **Server Members Intent** (optional, for member lookups)
4. Under **OAuth2 > URL Generator**, select:
   - Scopes: `bot`
   - Permissions: Send Messages, Connect, Speak, Manage Messages
5. Use the generated URL to invite the bot to your server.

---

## TTS Providers

You need at least one provider enabled. Set the API credentials and `TTS_<PROVIDER>_ENABLED=true` in `.env`.

### Amazon Polly (recommended starter)

1. Create an [IAM user](https://docs.aws.amazon.com/polly/latest/dg/get-started-what-is.html) with `polly:SynthesizeSpeech` and `polly:DescribeVoices` permissions.
2. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   TTS_AMAZON_ENABLED=true
   ```

### Google Cloud TTS

1. Create a [service account](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries) and download the JSON key file.
2. Place the key file in `config/google-auth.json`.
3. Add to `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-auth.json
   TTS_GOOGLE_ENABLED=true
   ```

### Azure Cognitive Services

1. Create a [Speech resource](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) in the Azure portal.
2. Add to `.env`:
   ```
   AZURE_SUBSCRIPTION_KEY=your_key
   AZURE_ENDPOINT=https://eastus.tts.speech.microsoft.com/
   TTS_AZURE_ENABLED=true
   ```

### IBM Watson

1. Create a [Text to Speech](https://cloud.ibm.com/catalog/services/text-to-speech) service instance.
2. Add to `.env`:
   ```
   WATSON_API_KEY=your_key
   WATSON_SERVICE_URL=https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/your-guid
   TTS_WATSON_ENABLED=true
   ```

### Tencent Cloud

1. Create API credentials in the [Tencent Cloud console](https://cloud.tencent.com/product/tts).
2. Add to `.env`:
   ```
   TENCENT_ACCESS_KEY_ID=your_key
   TENCENT_SECRET_ACCESS_KEY=your_secret
   TTS_TENCENT_ENABLED=true
   ```

### Alibaba Cloud (currently disabled)

The Alibaba provider is non-functional due to missing audio processing dependencies. It is hardcoded to `enabled: false`.

---

## Commands

TalkBot uses prefix commands (default `!`). Type `!help` in any text channel the bot can see.

### Getting Started
1. Join a voice channel
2. Type `!follow` — the bot joins your channel
3. Type any message — the bot reads it aloud
4. Type `!unfollow` when done

### Control
| Command | Description |
|---------|-------------|
| `!follow` | Bot joins your voice channel |
| `!unfollow` | Bot leaves voice channel |
| `!tts <message>` | Force the bot to speak a message |
| `!stop` | Stop current playback |
| `!mute [@user]` | Mute yourself or someone else |
| `!unmute [@user]` | Unmute yourself or someone else |
| `!sidle` | Take over as bot master |
| `!transfer @user` | Transfer master to someone else |

### Personalization
| Command | Description |
|---------|-------------|
| `!myvoice <voice>` | Set your TTS voice (`provider/voice` or just `voice`) |
| `!mypitch <-20..20>` | Set voice pitch |
| `!myspeed <0.25..4>` | Set voice speed |
| `!tolang <lang>` | Translate your text (e.g. `en`, `fr`, `de`) |
| `!defaults` | Reset all your voice settings |
| `!mytitle <title>` | Set your display title |
| `!puberty on\|off` | Toggle random pitch/speed per message |
| `!announceme on\|off` | Toggle join/leave voice announcements |
| `!myprefix set <text>` | Prepend text before your messages |
| `!mysuffix set <text>` | Append text after your messages |

### Info
| Command | Description |
|---------|-------------|
| `!help` | Show all commands |
| `!help <group>` | Show commands for a group (control, personalization, info, server) |
| `!ping` | Check if the bot is alive |
| `!who` | Show master and permitted users |
| `!voices` | Browse available TTS voices |
| `!details [@user]` | Show voice settings |
| `!stats` | Show server TTS usage statistics |
| `!invite` | Get the bot invite link |

### Server Administration
| Command | Description |
|---------|-------------|
| `!permit @user` | Allow a user to speak through the bot |
| `!unpermit @user` | Remove speak permission |
| `!adminrole @role` | Set which role can manage the bot |
| `!commandchar <char>` | Change the command prefix (default `!`) |
| `!restrict [#channel]` | Restrict bot to specific text channels |
| `!keep <count>` | Auto-delete old messages (keep last N) |
| `!sfx set <word> <url>` | Add a sound effect triggered by a word/emoji |
| `!sfx list` | List all sound effects |
| `!sfx del <word>` | Remove a sound effect |
| `!textrule add <find> -> <replace>` | Add a text replacement rule |
| `!textrule list` | List all text rules |
| `!bind add <id>` | Auto-follow when users join a channel/role |
| `!twitch permit <channel> <who>` | Connect Twitch chat to voice |

---

## Environment Variables Reference

All configuration is done through `.env`. Copy `.env.example` to get started.

### Required
| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |

### Optional — Discord
| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_ID` | | Application ID (needed for slash command registration) |
| `DEV_IDS` | | Comma-separated Discord user IDs for bot developers |
| `SUPPORT_SERVER_ID` | | Your support Discord server ID |

### Optional — Bot Behavior
| Variable | Default | Description |
|----------|---------|-------------|
| `COMMAND_CHAR` | `!` | Prefix character for commands |
| `DEFAULT_TITLE` | `master` | Default title for the bot master |
| `NEGLECT_TIMEOUT` | `3600000` | Ms before bot leaves inactive voice (default 1 hour) |
| `NEGLECT_TIMEOUT_MESSAGES` | `Talkbot inactivity timeout` | Comma-separated messages spoken before timeout |
| `PESTER_THRESHOLD` | `10000000` | Character count before self-hosting nag |
| `TWITCH_AUDIO_QUEUE_LIMIT` | `10` | Max queued Twitch messages |
| `ADVERTISE_STREAMER` | | Streamer name to advertise |
| `TAGLINE` | | Bot tagline |

### Optional — Logging
| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_OUTPUT` | `true` | Enable info logging |
| `LOG_ERRORS` | `true` | Enable error logging |
| `NODE_ENV` | `development` | Set to `production` for deployed instances |
| `LOG_LEVEL` | `info` | Logging verbosity |

### TTS Provider Credentials
| Variable | Provider | Description |
|----------|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Google | Path to service account JSON |
| `AWS_ACCESS_KEY_ID` | Amazon Polly | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Amazon Polly | IAM secret key |
| `AWS_REGION` | Amazon Polly | AWS region (default `us-east-1`) |
| `AZURE_SUBSCRIPTION_KEY` | Azure | Speech resource subscription key |
| `AZURE_ENDPOINT` | Azure | Speech endpoint URL |
| `WATSON_API_KEY` | Watson | IAM API key |
| `WATSON_SERVICE_URL` | Watson | Service instance URL |
| `TENCENT_ACCESS_KEY_ID` | Tencent | API access key |
| `TENCENT_SECRET_ACCESS_KEY` | Tencent | API secret key |
| `ALIBABA_APP_KEY` | Alibaba | Application key |
| `ALIBABA_TOKEN` | Alibaba | Access token |
| `ALIBABA_ENDPOINT` | Alibaba | TTS endpoint URL |

### TTS Provider Settings
Each provider has `ENABLED`, `ENFORCE_LIMIT`, and `LIMIT` settings. Format: `TTS_<PROVIDER>_<SETTING>`.

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_GOOGLE_ENABLED` | `false` | Enable Google Cloud TTS |
| `TTS_GOOGLE_ENFORCE_LIMIT` | `false` | Block requests after limit hit |
| `TTS_GOOGLE_LIMIT` | `5000000` | Character limit |
| `TTS_AMAZON_ENABLED` | `true` | Enable Amazon Polly |
| `TTS_AMAZON_ENFORCE_LIMIT` | `false` | Block requests after limit hit |
| `TTS_AMAZON_LIMIT` | `5000000` | Character limit |
| `TTS_AZURE_ENABLED` | `false` | Enable Azure Cognitive Services |
| `TTS_AZURE_ENFORCE_LIMIT` | `false` | Block requests after limit hit |
| `TTS_AZURE_LIMIT` | `5000000` | Character limit |
| `TTS_WATSON_ENABLED` | `false` | Enable IBM Watson |
| `TTS_WATSON_ENFORCE_LIMIT` | `false` | Block requests after limit hit |
| `TTS_WATSON_LIMIT` | `5000000` | Character limit |
| `TTS_TENCENT_ENABLED` | `false` | Enable Tencent Cloud |
| `TTS_TENCENT_ENFORCE_LIMIT` | `true` | Block requests after limit hit |
| `TTS_TENCENT_LIMIT` | `1000000` | Character limit |
| `TTS_ALIBABA_ENABLED` | `false` | Enable Alibaba Cloud |
| `TTS_ALIBABA_ENFORCE_LIMIT` | `true` | Block requests after limit hit |
| `TTS_ALIBABA_LIMIT` | `1000000` | Character limit |

---

## Setup on Coolify

[Coolify](https://coolify.io/) is a self-hosted PaaS that can deploy Docker apps.

1. **Create a new resource** in Coolify and connect your GitHub repo (or use the public URL).

2. **Set build pack** to Docker Compose.

3. **Add environment variables** in Coolify's UI — add all the variables from your `.env` file. At minimum:
   - `DISCORD_TOKEN`
   - Your TTS provider credentials (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
   - `TTS_<PROVIDER>_ENABLED=true` for the provider(s) you want

4. **Persistent storage** — create a volume mount for the config directory so `.server` files (per-guild state) persist across deployments:
   ```
   /data/talkbot/config → /app/config
   ```

5. **Deploy** — Coolify will build the Docker image and start the container.

6. **Check logs** in Coolify's UI to verify the bot connected and loaded TTS providers.

**Tips:**
- Coolify passes env vars to the container automatically — you don't need a `.env` file inside the container.
- For Google TTS, upload `google-auth.json` to your persistent volume and set `GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-auth.json`.
- The bot stores per-server state in `config/*.server` files — make sure the volume is persistent so these survive redeployments.

---

## Local Development

### Prerequisites
- Node.js 22+
- npm

### Setup
```bash
git clone https://github.com/nullabork/talkbot.git
cd talkbot
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Commands
| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled bot |
| `npm run dev` | Watch mode with auto-restart |
| `npm test` | Run tests (Vitest) |
| `npm run lint` | Type-check (`tsc --noEmit`) |

### How it works
1. `npm run build` compiles TypeScript from `src/` to `dist/` using `tsc`, then rewrites path aliases with `tsc-alias`, then copies `src/lang.json` to `dist/`.
2. `npm start` runs `node dist/src/index.js` which loads `.env`, validates env vars with Zod, initializes TTS providers, connects to Discord, and listens for messages.
3. When a user types in a text channel, the bot checks if it's a command (`!follow`, etc.) or regular text. Regular text is sent to the TTS provider and played in the voice channel.

---

## Project Structure

```
src/
  index.ts              — Bot entry point (event handlers, startup)
  env.ts                — Zod-validated environment variables
  config-loader.ts      — Loads config/config.json
  paths.ts              — Resolved filesystem paths
  commands/
    index.ts            — Command registry and dispatch
    modules/            — Individual command handlers (37 commands)
  helpers/
    bot-stuff.ts        — Discord client setup
    common.ts           — Logging and string utilities
    ffmpeg.ts           — MP3 → Opus conversion (WASM)
    ssml-dictionary.ts  — Discord markdown → SSML mappings
  models/
    Server.ts           — Per-guild state, voice connection, TTS pipeline
    World.ts            — All servers, presence, lifecycle
    Command.ts          — Base command class
    BotCommand.ts       — Legacy command data class
    MessageDetails.ts   — Command context wrapper
    MessageSSML.ts      — SSML message builder
  services/
    TextToSpeechService.ts  — Abstract TTS base class + provider registry
    tts/                    — Provider implementations (Google, Amazon, Azure, Watson, Tencent, Alibaba)
  types/                — TypeScript interfaces
config/
  config.json           — Server overrides (per-guild settings)
  config.example.json   — Template
  default.textrules.json — Default text replacement rules
  lang.json             — i18n string overrides
  *.server              — Per-guild state files (auto-generated)
```

---

## Troubleshooting

### Bot doesn't respond to commands
- Make sure `DISCORD_TOKEN` is set in `.env`.
- Check that **Message Content Intent** is enabled in the Discord Developer Portal.
- Verify the bot has Send Messages permission in the channel.

### Bot joins voice but doesn't speak
- Check that at least one TTS provider is enabled (`TTS_<PROVIDER>_ENABLED=true`) and has valid credentials in `.env`.
- Check logs for TTS API errors.
- Make sure the bot has **Connect** and **Speak** permissions in the voice channel.

### Docker build fails
- Ensure `patches/` directory exists (needed by `patch-package`).
- Check that `config/default.textrules.json` and `config/lang.json` exist.

### Google TTS not working
- `GOOGLE_APPLICATION_CREDENTIALS` must point to a valid service account JSON file.
- In Docker, the config volume mount (`./config:/app/config`) must contain `google-auth.json`.

### Bot is slow to speak
- First message after startup is slower (WASM ffmpeg cold load for Amazon Polly).
- Subsequent messages are faster.
- Google Cloud TTS is generally the fastest provider.

### Migrating from old version
- See [Migrating from auth.json](#migrating-from-authjson) for the full field mapping.

---

## Acknowledgements

- WootoSmash
- FaxWang
- GreenLionVoltronPilot
- Kingk22
- Kelinmiriel

## License

See [LICENSE](LICENSE) for details.
