---
description: '!restrict'
---

# Restrict text to a channel

## Introduction

{% hint style="info" %}
Only a user with server admin permissions or server management permissions can perform this command.
{% endhint %}

The default operation of Talkbot is to read out the text from every channel it can access on the channel. On some servers you may want to restrict text-to-speech activities to a single channel or a few channels. 

Talkbot can be restricted to reading text from only a few channels using **!restrict** or using role based permissions in discord.

## !restrict

To restrict Talkbot to reading text from a specific channel you can use **!restrict**.

Example:

```text
!restrict #text-to-speech
```

Once this is done, Talkbot will only look for messages to be read out from this channel. Talkbot will still read commands from any channel it has access to. 

Restrict can also restrict Talkbot to multiple channels by calling restrict multiple times or chaining the channels together when running the command. For example to restrict Talkbot to reading from two channels, \#tts-team1 and \#tts-team2:

```text
!restrict #tts-team1 #tts-team2
```

If you'd like to unrestrict Talkbot use the 'none' special channel:

```text
!restrict none
```

To see the channels Talkbot is restricted to:

```text
!restrict
```

## Using Discord channel based permissions

Discord has a comprehensive permissions system that can be used to restrict Talkbot to specific channels. There are multiple ways to restrict Talkbot using this system. The below example is just one example.

To do this using Discord's inbuilt functionality:

1. For each channel you don't want Talkbot to read from, click on the channel settings icon

![Click the cog](../.gitbook/assets/image%20%281%29.png)

2. Add Talkbot to the role/members section on the left:

![Click the circle with the plus symbol](../.gitbook/assets/image%20%283%29.png)

3. Add Talkbot and set the "Read Messages" permissions to the cross:

![Click the cross icon to deny Talkbot access to read this channel](../.gitbook/assets/image%20%284%29.png)

