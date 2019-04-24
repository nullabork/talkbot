---
description: '!keep'
---

# Keeping text neat

### Removing old messages from a text channel automatically

{% hint style="info" %}
Only a user with server admin permissions or server management permissions can perform this command.
{% endhint %}

You may want to remove the text in the channel after a while to keep the text channel neat. Talkbot can do this for you using **!keep. !keep** works by removing the oldest messages after the count. For example !keep 20 will retain 20 messages in the channel and delete any older messages than this.

If the messages were there before control was taken of Talkbot !keep will not delete those messages.

Example:

```text
!keep 20
```

To reset keep to retain all messages use **!keep all**

Example:

```text
!keep all
```

