---
description: '!langs, !voices, !mylang and !myvoice'
---

# Supported languages

### Quick start - set your voice

1. Run **!langs** to see the available language codes
2. Run **!voices &lt;lang&gt;** to see the available voices
3. Set your voice with **!myvoice &lt;alias&gt;**

For example to set your voice to an Australian voice:

```text
!langs
!voices au  
!myvoice Isla
```

### Details

Talkbot supports all the languages provided by the [Google cloud-text-to-speech API](https://cloud.google.com/text-to-speech/docs/voices).

They are:

| Language | Code | Alternative Code |
| :--- | :--- | :--- |
| Dutch \(Netherlands\) | nl-nl | nl |
| English \(Australia\) | en-au | au |
| English \(UK\) | en-gb | gb |
| English \(US\) | en-us | us |
| French | fr-fr | fr |
| French \(Canada\) | fr-ca | ca |
| German | de-de | de |
| Italian | it-it | it |
| Japanese | ja-jp | jp |
| Korean | ko-kr | kr |
| Portugese \(Brazil\) | pt-br | br |
| Spanish | es-es | es |
| Swedish | sv-se | se |
| Turkish | tr-tr | tr |

To see the languages inline use **!langs** . This will produce a table like the above. You can then set a  specific languge using **!mylang.** 

For example:

```text
!mylang au
```

From there you can see the available voices using **!voices** and **!myvoice**. Voices will return the list of voices for a specific language and !myvoice will set your personal voice. 

For example:

```text
!myvoice Isla
OR
!myvoice en-AU-Standard-A
```

!voices will return a list of all available voices for that language. For example the available Australian voices using `!voices au` are below. Note: The smiley faces indicate the quality of the voice. 

![Response from !voices au ](.gitbook/assets/image%20%285%29.png)





