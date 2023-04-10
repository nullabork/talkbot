[logo]: https://raw.githubusercontent.com/nullabork/artwork/master/talkbot/face/png/face_200.png 'Talkbot'

![alt text](https://raw.githubusercontent.com/nullabork/artwork/master/talkbot/face/png/face_200.png 'Talkbot')

# Talkbot

Discord bot for text-to-speech and language translation

Try it out here: [https://discord.gg/NxrPp8g](https://discord.gg/NxrPp8g)

# Docker

1. If your on windows10, Install wsl2 https://docs.microsoft.com/en-us/windows/wsl/install-win10 else go to step two ;)
2. Install docker https://docs.docker.com/get-docker/
3. Clone this repo or [Download the talkbot files](https://github.com/nullabork/talkbot/archive/refs/heads/master.zip) and extract them.
4. Copy `config/auth.example` to `config/auth.json` and put in your discord app key.
    - To learn how to setup a discord app and get this token [go here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)
    - AMAZON: To learn how to setup Amazon AWS Polly [go here](https://docs.aws.amazon.com/polly/latest/dg/setting-up.html)
    - AZURE: To learn how to setup Azure [go here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/overview#try-the-speech-service-for-free)
5. Add a file, `config/google-auth.json` with the google credentials
    - GOOGLE: To learn how to setup your Google API credentials [go here](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries)
6. In the command line run `docker pull faxwang/talkbot:latest` this will take a while.
7. In the command line run change directory to the project root and run
    - `docker-compose up -d` to run talkbot in the background
    - `docker-compose up` to run talkbot in the foreground
8. It should be running now.

# Quick start

1. [Click here to add the bot to your discord](https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0): https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0
2. Join a voice channel
3. Type `!follow`
4. Type the message `Hello World` to hear it read out to you

# Documentation

Check out the documentation on gitbook: https://nullabork.gitbook.io/talkbot/

# Commands in discord

The bot requires a master to control it. Once you're its master it'll convert your text into voice in the current voice channel. The bot will also follow you between voice channels. Other users will only be able to use the bot if you permit them to use it. If you don't use the bot for 30 minutes it'll unfollow you.

```yaml
= Control =
 !follow            :: The bot will join your voice channel and speak what you write
 !unfollow          :: Release the bot
 !sidle             :: Take control of the bot from someone else
 !transfer          :: Transfer control of the bot to another person
 !permit [<user>]   :: Permit someone else to use the bot whilst it's following you
 !unpermit [<user>] :: Unpermit someone else from using the bot
 !tts               :: Speak when you're muted

= Personalization =
 !defaults              :: Reset your default voice settings
 !mypitch <pitch>       :: Alter the pitch of the bot's voice. Valid values are -20 to 20
 !myspeed <speed>       :: Alter the speed the bot talks. 1.0 is the default. Valid values are 0.25 to 4.0
 !myvoice <voice|alias> :: Change accent or style.
 !tolang <lang>         :: Translate your text to a different language eg. en, fr, jp, de etc.
 !mute                  :: Mute yourself so your text is not read out
 !unmute                :: Unmute yourself so all your text is read out

= More =
 !help info   :: info help commands
 !help server :: server help commands
```

# Setup your own bot

Use this to setup your own bot on your own server.
Note you will require a Google Cloud account to use their TTS API and an Amazon Polly account to use Amazon TTS voices.
Both of these services have free tiers but may cost you money if you exceed their free caps.
Each of these services can be turned on and off in the configuration of the bot.

## Win 10 Software requirements

-   node js - v18
-   git

## Install, setup and run

1. Clone this respository
    - `git clone https://github.com/nullabork/talkbot talkbot`
    - `git
2. Duplicate the `auth.example` file in the `config` directory and rename the new file to `auth.json` edit the file and paste in your discord app key.
    - To learn how to setup a discord app and get this token [go here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)
3. Setup your prefered API provider - Google, Amazon AWS Polly or Azure or any combination of those.
    - GOOGLE: To learn how to setup your Google API credentials [go here](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries)
    - AMAZON: To learn how to setup Amazon AWS Polly [go here](https://docs.aws.amazon.com/polly/latest/dg/setting-up.html)
    - AZURE: To learn how to setup Azure [go here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/overview#try-the-speech-service-for-free)
4. Install NPM dependencies
    ```yaml
    npm install
    ```
5. Run the bot!
    - `node bot.js`

# Updating to the latest code

To update to the latest code run:
`git pull`

# Troubleshooting

[Talk to us on discord](https://discord.gg/NxrPp8g)

## Google TTS API Issues

Confirm you've put the path to your API credentials file in the env var GOOGLE_APPLICATION_CREDENTIALS. [See Google cloud docs here](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries)

## npm install issues

Some of the packages are difficult to install particularly on Windows.
Usually you'll need to check your PATH environment variable and confirm Visual Studio C++ build tools are available.
Check you're using Node v14 or above
Check you have Python installed and that it is version 2.7.\*. It may have to be before version 3 in your path variable for it to be picked up.

# Acknowledgements

-   WootoSmash - coder/bugmaker/shitposter
-   FaxWang - coder/bugfinder/shitposter
-   GreenLionVoltronPilot - bugfinder/shitposter
-   Kingk22 - bugfinder/shitposter/questionanswerer
-   Kelinmiriel - bugfinder/shitposter
-   All the npm package builders!

[Want to shitpost also?](https://discord.gg/NxrPp8g)
