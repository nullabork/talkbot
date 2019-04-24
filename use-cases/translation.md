---
description: '!tolang'
---

# Translation

## Introduction

Talkbot can be used to translate one language to another using Google's translation API. 

To enable this use !tolang and a language code from [Supported languages](../supported-languages.md). Talkbot will automatically attempt to detect which language you're speaking in and attempt to translate it to your target language.

Example, translate to German:

```text
!tolang de
```

Once this is enabled it'll translate all typed text to the target language before speaking it out of the bot. To disable translation use 

```text
!tolang default
```

