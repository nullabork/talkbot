---
description: '!sfx'
---

# Emoji sound effects

## Introduction

{% hint style="info" %}
Only a user with server admin permissions or server management permissions can perform this command.
{% endhint %}

To personalise your server you may want to associate sounds with specific words or emojis. For example you may want to associate :clap: with [https://sfx.nullabork.dev/applause-2.wav](https://sfx.nullabork.dev/applause-2.wav). These sound effects will then be played when that specific emoji or word is used when speaking whilst the bot is in voice.

To configure this capability use the **!sfx** command.

To get started list all the existing sound effects using **!sfx list .** 

If you'd like to clear all the existing effects use **!sfx clearall.**

Sound effects can be found online at many free sound effects sites. Please be polite when using a site's audio and make sure you're allowed to use it for this purpose.

## **Examples**

### **Add a clapping sound to the clap emoji**

```
!sfx add :clap: https://sfx.nullabork.dev/applause-2.wav
```

**Note:** URLs need to be **https** insecure URLs will not work.

Then to test, **!follow** the bot and type :clap: and then the applause-2 sound effect should be played.

Example:

```text
!follow
:clap:
```



