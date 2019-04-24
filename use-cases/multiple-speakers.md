---
description: '!permit and personalisation'
---

# Multiple speakers

## Introduction

A common use case for Talkbot is where multiple non-voice users need to use the text-to-speech capability at once. Talkbot provides this capability by the **!permit** command and personalisation of voice using personalisation commands such as !mylang and !myvoice.

**!permit** allows the current master of Talkbot to permit other users or roles to also use the bot at the same time. 

Below is an example of permitting @wootosmash and the role @talkbot\_users

```text
!permit @wootosmash @talkbot_users
```

If you permit a role it will permit all users with that role to be able to use the bot.

#### Personalisation 

Talkbot provides several commands for personalisation, see the table below. Full details of personalisation can be found under [Personalising your voice](personalising-your-voice.md).

| Command | Description |
| :--- | :--- |
| !mygender | Change your gender - this is used to automatically select your voice |
| !mylang | Change your language - see [Supported Languages](../supported-languages.md) for details |
| !myvoice | Explicitly set your voice - see [Supported Languages](../supported-languages.md) for details |
| !mytitle | Set a personal title replacement for 'master' |
| !mypitch | Set the pitch your voice speaks with |
| !myspeed | Set the speed your voice speaks with |

