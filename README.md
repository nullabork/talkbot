# talkbot
Discord bot for text-to-speech

# requirements
- node js
- npm

# setup
Copy auth.example to auth.json and put in your discord app key. 
To learn how to setup a discord app and get this token go here 
https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token

# to run
node bot.js

# in discord
The bot requires a master to control it. Once you're its master it'll convert your non-command text into voice in the current channel. The bot will also follow you between voice channels. Other users will only be able to use the bot if you permit them to use it. If you don't use the bot for 30 minutes it'll unfollow you.

* !follow - bind the bot to you so only you can control it
* !unfollow - release the bot so someone else can use it
* !leave - get the bot to leave the channel
* !permit [username] - allow another user to use TTS
* !unpermit [username] - disallow another user
* !who - find out who is the bot's current master
* !join - get the bot to join the voice channel the master is in
* !leave - get the bot to leave the current voice channel
* all other text will be spoken in text-to-speech
