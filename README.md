[logo]: https://github.com/nullabork/artwork/raw/master/nullabork/png/nullbork_icon_200.png "Nullabork"
![alt text](https://github.com/nullabork/artwork/raw/master/nullabork/png/nullbork_icon_200.png "Nullabork")
# Talkbot
Discord bot for natural voice text-to-speech and language translation


[Try it out here.](https://discord.gg/NxrPp8g)


# Quick start - [Add Talkbot to your discord](https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0)

1. [Click here to add the bot to your discord](https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0)
2. Join a voice channel
3. Type !follow
4. Type some text to hear it read out to you

# Commands in discord
The bot requires a master to control it. Once you're its master it'll convert your text into voice in the current voice channel. The bot will also follow you between voice channels. Other users will only be able to use the bot if you permit them to use it. If you don't use the bot for 30 minutes it'll unfollow you.
```yaml
- !follow  bind the bot to you so only you can control it
- !unfollow - release the bot so someone else can use it
- !sidle - take control of the bot from someone else
- !permit [username1] [username2]... - allow other users to use TTS
- !unpermit [username1] - disallow another user
- !who - find out who is the bot's current master
- !lang [lang] - set the global lang of the bot eg. en-UK, en-us, fr-fr, it
- !mylang [lang] - set your personal language accent for the bot
- !langs - list available langs.
- !tolang [lang] - translate to this language
- !voices [lang_code] -list voices for a language
- !myvoice [voice, alias] change voice to a specific voices, language and gender.
- !sfx set [emoji] [sound_url] - associate a URL with an emoji to have it play when someone says the emoji 
- !textrule add [search_text] -> [replace_text]
- !help [longer help] - writes out the help for all commands
```
# Setup your own bot
Use this to setup your own bot on your own server. Note you will require a google cloud account to use their TTS API.

## Software requirements
- node js
- npm
- ffmpeg

## Install and setup
1. Clone this respository
2. Copy `config/auth.example` to `config/auth.json` and put in your discord app key. 
    - To learn how to setup a discord app and get this token [go here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)
3. Setup your google API credentials. 
    * To learn how to do this [go here](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries)
4. Install nvm and run 
    ```
      nvm install
      nvm use
    ```
    * [windows](https://github.com/coreybutler/nvm-windows/releases)
    * [mac/linux](https://github.com/creationix/nvm)
5. Install NPM dependencies
    * `npm install` or `yarn install`
5. To run: node `bot.js`

## To run
node bot.js

# Troubleshooting 

[Talk to us on discord](https://discord.gg/NxrPp8g)

## Google TTS API Issues

Confirm you've put the path to your API credentials file in the env var GOOGLE_APPLICATION_CREDENTIALS. [See Google cloud docs here](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries) 

# Props to
* WootoSmash - coder/bugmaker/shitposter
* FaxWang - coder/bugfinder/shitposter
* GreenLionVoltronPilot - bugfinder/shitposter
* Kingk22 - bugfinder/shitposter
* Kelinmiriel - bugfinder/shitposter

[Want to shitpost also?](https://discord.gg/NxrPp8g)
