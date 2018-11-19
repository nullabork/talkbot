# talkbot
Discord bot for text-to-speech

# quick start

1. Go here to add the bot to your discord https://discordapp.com/oauth2/authorize?&client_id=428866923267358721&scope=bot&permissions=0
2. Once the bot joins wait 60 seconds for the bot to retrieve the relevant information about your server
3. Join a voice channel
4. Type !follow
5. Type some text to hear it read out to you

# commands in discord
The bot requires a master to control it. Once you're its master it'll convert your non-command text into voice in the current channel. The bot will also follow you between voice channels. Other users will only be able to use the bot if you permit them to use it. If you don't use the bot for 30 minutes it'll unfollow you.

* !follow - bind the bot to you so only you can control it
* !unfollow - release the bot so someone else can use it
* !sidle - take control of the bot from someone else
* !permit [username] - allow another user to use TTS
* !unpermit [username] - disallow another user
* !who - find out who is the bot's current master
* !lang [lang] - set the global lang of the bot eg. en-UK, en-us, fr-fr, it
* !mylang [lang] - set your personal language for the bot
* !sfx [sound_url] - play a sound in channel (this command has lots of other cool stuff as well!)
* !sfx set [emoji] [sound_url] - associate a URL with an emoji to have it play when someone says the emoji 
* !help [longer help] - writes out the help for all commands

# setup your own bot
Use this to setup your own bot on your own server. Note you will require a google cloud account to use their TTS API.

## software requirements
- node js
- npm
- ffmpeg

## install and setup
1. Copy this respository to a folder on linux 
2. Copy auth.example to ../auth.json and put in your discord app key. To learn how to setup a discord app and get this token go here https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
3. Setup your google API credentials. To learn how to do this go here https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries
4. To run: node bot.js 

## to run
node bot.js

# Troubleshooting
## getting the right node version

install nvm
* windows - https://github.com/coreybutler/nvm-windows/releases
* mac/linux - https://github.com/creationix/nvm

cd to project root and run `nvm use`

# Props to
* WootoSmash - coder/bugmaker/shitposter
* FaxWang - coder/bugfinder/shitposter
* GreenLionVoltronPilot - bugfinder/shitposter

Want to shitpost also? https://discord.gg/NxrPp8g
