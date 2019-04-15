[logo]: https://github.com/nullabork/artwork/raw/master/nullabork/png/nullbork_icon_200.png "Nullabork"
![alt text](https://github.com/nullabork/artwork/raw/master/nullabork/png/nullbork_icon_200.png "Nullabork")
# Talkbot
Discord bot for natural voice text-to-speech and language translation


Try it out here: https://discord.gg/NxrPp8g


# Quick start 

1. [Click here to add the bot to your discord](https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0): https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0
2. Join a voice channel
3. Type `!follow`
4. Type some text to hear it read out to you

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
 !mygender <gender>     :: Set the gender the bot will speak with
 !mylang <lang>         :: Set the language the bot will speak in. eg. en-AU, gb, en-US, fr, jp etc.
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
6. Install ffmpeg 
    * To learn how to do this [go here](https://www.ffmpeg.org/download.html)
7. To run: `node bot.js`

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
