# TalkBot - Discord Text-to-Speech Bot

TalkBot reads Discord text channel messages aloud in voice channels. It supports multiple TTS providers, per-user voice customization, and server-level configuration through slash commands.

## Features

- Reads Discord text channel messages aloud in voice channels
- 6 TTS providers: Google Cloud, Amazon Polly, Azure Cognitive Services, IBM Watson, Tencent Cloud, Alibaba Cloud
- 37 slash commands for voice control, personalization, and server administration
- SSML support for fine-grained speech customization
- Per-user voice, pitch, speed, and language settings
- Sound effects system with custom triggers
- Text replacement rules (literal and regex)
- Twitch chat integration for reading Twitch messages in Discord voice
- Automatic message translation

## Quick Start (Docker)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nullabork/talkbot.git
   cd talkbot
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Discord bot token and at least one TTS provider's API keys.

3. **Run with Docker Compose:**
   ```bash
   docker compose up -d
   ```

4. The bot automatically registers slash commands on startup.

## Quick Start (Local Development)

1. **Prerequisites:** Node.js 22+ and npm

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Discord bot token and TTS provider credentials.

4. **Build the TypeScript source:**
   ```bash
   npm run build
   ```

5. **Start the bot:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables (.env)

Copy `.env.example` to `.env` and fill in the values. See the comments in that file for details on each variable.

**Required:**
| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | Application (client) ID from the Discord Developer Portal |

**TTS Providers (at least one required):**
| Provider | Variables |
|----------|-----------|
| Google Cloud | `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON) |
| Amazon Polly | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| Azure | `AZURE_SUBSCRIPTION_KEY`, `AZURE_ENDPOINT` |
| IBM Watson | `WATSON_API_KEY`, `WATSON_SERVICE_URL` |
| Tencent Cloud | `TENCENT_ACCESS_KEY_ID`, `TENCENT_SECRET_ACCESS_KEY` |
| Alibaba Cloud | `ALIBABA_APP_KEY`, `ALIBABA_TOKEN`, `ALIBABA_ENDPOINT` |

**Application settings:**
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for deployed instances |
| `LOG_LEVEL` | `info` | Logging verbosity: `error`, `warn`, `info`, `debug` |

### Discord Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under the **Bot** tab, create a bot and copy the token into your `.env` file.
3. Under **Bot > Privileged Gateway Intents**, enable:
   - **Message Content Intent**
   - **Server Members Intent**
4. Under **OAuth2 > URL Generator**, select scopes `bot` and `applications.commands`, then select permissions:
   - Send Messages
   - Connect
   - Speak
   - Manage Messages
5. Use the generated URL to invite the bot to your server.

### TTS Providers

You need at least one TTS provider configured. Each provider requires its own API credentials:

- **Google Cloud TTS:** Create a [service account](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries) and download the JSON key file. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the key file.
- **Amazon Polly:** Create an [IAM user](https://docs.aws.amazon.com/polly/latest/dg/get-started-what-is.html) with `polly:SynthesizeSpeech` permission. Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- **Azure Cognitive Services:** Create a [Speech resource](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) in the Azure portal. Set `AZURE_SUBSCRIPTION_KEY` and `AZURE_ENDPOINT`.
- **IBM Watson:** Create a [Text to Speech](https://cloud.ibm.com/catalog/services/text-to-speech) service instance. Set `WATSON_API_KEY` and `WATSON_SERVICE_URL`.
- **Tencent Cloud:** Create API credentials in the [Tencent Cloud console](https://cloud.tencent.com/product/tts). Set `TENCENT_ACCESS_KEY_ID` and `TENCENT_SECRET_ACCESS_KEY`.
- **Alibaba Cloud:** Create an application in the [Alibaba Cloud console](https://www.alibabacloud.com/product/intelligent-speech-interaction). Set `ALIBABA_APP_KEY`, `ALIBABA_TOKEN`, and `ALIBABA_ENDPOINT`.

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in watch mode with ts-node (auto-restarts on changes) |
| `npm test` | Run tests with Vitest |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled bot from `dist/` |
| `npm run deploy:commands` | Manually register slash commands with Discord |
| `npm run lint` | Type-check without emitting (`tsc --noEmit`) |

## Commands

### Voice Control
| Command | Description |
|---------|-------------|
| `/follow` | Make the bot join your voice channel |
| `/unfollow` | Make the bot leave the voice channel |
| `/stop` | Stop the bot from speaking |
| `/tts` | Force the bot to speak a message |

### Personalization
| Command | Description |
|---------|-------------|
| `/myvoice` | Set your TTS voice |
| `/mypitch` | Set your voice pitch (-20 to 20) |
| `/myspeed` | Set your voice speed (0.25 to 4.0) |
| `/mytitle` | Set your announcement title |
| `/myprefix` | Set a prefix spoken before your messages |
| `/mysuffix` | Set a suffix spoken after your messages |
| `/tolang` | Set your translation language |
| `/defaults` | Clear all your personal voice settings |
| `/puberty` | Toggle puberty mode (randomize pitch/speed) |
| `/announceme` | Toggle voice join/leave announcements |
| `/voices` | Find available voices |
| `/details` | Show voice settings for a user |

### Server Administration
| Command | Description |
|---------|-------------|
| `/permit` | Permit a user to use the bot |
| `/unpermit` | Remove a user's permission |
| `/mute` | Mute yourself or another user |
| `/unmute` | Unmute yourself or another user |
| `/adminrole` | Set the admin role for bot management |
| `/transfer` | Transfer bot master to another user |
| `/sidle` | Transfer bot master to yourself (admin only) |
| `/who` | Show the current master and permitted users |
| `/restrict` | Restrict bot to specific text channels |
| `/bind` | Bind the bot to channels, users, or roles |
| `/keep` | Set how many messages to keep in the channel |
| `/commandchar` | Set the command prefix character |

### Sound Effects and Text Rules
| Command | Description |
|---------|-------------|
| `/sfx` | Manage sound effects (set, list, delete, play) |
| `/textrule` | Manage text replacement rules |

### Integrations
| Command | Description |
|---------|-------------|
| `/twitch` | Manage Twitch chat integration |

### Utility
| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/ping` | Check if the bot is alive |
| `/stats` | Show server TTS statistics |
| `/invite` | Get the invite link for the bot |

## Project Structure

```
src/
  commands/modules/  -- slash command handlers
  helpers/           -- utility functions
  models/            -- data models (Server, World, etc.)
  services/          -- TTS provider implementations
  types/             -- TypeScript interfaces
config/
  config.example.json -- bot configuration template
  default.textrules.json -- default text replacement rules
  lang.json          -- language configuration
```

## Troubleshooting

### Bot does not respond to slash commands
- Make sure the bot has been invited with the `applications.commands` scope.
- Check that `CLIENT_ID` in `.env` matches your Discord application ID.
- Run `npm run deploy:commands` to manually register commands.

### Bot joins voice but does not speak
- Verify that at least one TTS provider is configured with valid credentials.
- Check the console for TTS API error messages.
- Make sure the bot has **Connect** and **Speak** permissions in the voice channel.

### "Message Content" errors
- Enable the **Message Content Intent** under your bot's settings in the Discord Developer Portal (Bot > Privileged Gateway Intents).

### Docker build fails
- Ensure the `patches/` directory exists (it is needed by `patch-package` during `npm ci`).
- Check that `config/default.textrules.json` and `config/lang.json` exist.

### Google Cloud TTS not working
- Confirm that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file.
- When running with Docker, the config volume mount (`./config:/app/config`) should contain the `google-auth.json` file.

## Acknowledgements

- WootoSmash
- FaxWang
- GreenLionVoltronPilot
- Kingk22
- Kelinmiriel

## License

See [LICENSE](LICENSE) for details.
