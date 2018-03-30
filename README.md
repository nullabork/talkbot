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
* !follow - bind the bot to you so only you can control it
* !unfollow - release the bot so someone else can use it
* !leave - get the bot to leave the channel
* !quiet - keep the bot quiet
* all other text will be spoken in text-to-speech
