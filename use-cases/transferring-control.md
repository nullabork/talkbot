---
description: '!unfollow, !transfer and !sidle'
---

# Transferring control

When your call **!follow** Talkbot sets you as the master on the current discord server and binds to your user ID. This means you have control of the bot until you leave the voice channel, transfer control or unfollow the bot.

From time-to-time you may want to transfer the bot to another user or take control of the bot from someone who is currently using it. For example if a user has gone AFK while being in control of the bot. 

This can be performed three ways: **!unfollow, !transfer** and **!sidle**

### !unfollow

Unfollow is the simplest way to transfer control of Talkbot from yourself to someone else. When you're done with using Talkbot run the **!unfollow** command to release control of the bot and then someone else can call !follow to take control of the bot.

Example:

```text
!unfollow
```

Talkbot will also automatically unfollow you if you leave voice.

### !transfer

Transfer allows you to transfer control of Talkbot from yourself to someone else. When you transfer control you will still be permitted to speak until you **!unpermit** yourself or the new master **!unpermit**s you. Any user who is Talkbot's master can use this command.

```text
!transfer @faxo
```

Once control is transferred to another user you can safely leave the voice channel without Talkbot unfollowing.

Transfer can also be used by a server admin or a user with server manager permissions to force Talkbot to follow a user when there is no current master. This is useful where a user is unfamiliar with the bot commands, but is only text capable.

### !sidle

Sidle allows a server administrator or user with server management permissions to take control of Talkbot from someone who is currently the master. This may be useful for example if a user has gone AFK whilst in control of Talkbot.

Example:

```text
!sidle
```

